import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ArticleService from '../../services/ArticleService';
import Button from '../ui/Button';
import Input from '../ui/Input';

const ArticleForm = ({ isEditing = false }) => {
  const { articleId } = useParams();
  const { currentUser, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [],
    featured: false,
    image: null,
  });

  // Preview image URL
  const [previewUrl, setPreviewUrl] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tagInput, setTagInput] = useState('');

  // Available categories - would be dynamically loaded in a real app
  const categories = ['adhd', 'autism', 'dyslexia', 'general'];

  // Fetch article data if editing
  useEffect(() => {
    if (isEditing && articleId) {
      const fetchArticle = async () => {
        setLoading(true);
        setError(null);

        try {
          const articleData = await ArticleService.getArticleById(articleId);

          // Check if user is authorized to edit
          if (currentUser.id !== articleData.author?.id && currentUser.role !== 'admin') {
            setError('You are not authorized to edit this article');
            return;
          }

          setFormData({
            title: articleData.title || '',
            excerpt: articleData.excerpt || '',
            content: articleData.body || '',
            category: articleData.category || '',
            tags: articleData.tags || [],
            featured: articleData.featured || false,
          });

          if (articleData.bannerUrl) {
            setPreviewUrl(articleData.bannerUrl);
          }
        } catch (err) {
          console.error('Error fetching article:', err);
          setError('Failed to load article data. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      fetchArticle();
    }
  }, [isEditing, articleId, currentUser]);

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { state: { from: isEditing ? `/blog/edit/${articleId}` : '/blog/new' } });
    }
  }, [isLoggedIn, navigate, isEditing, articleId]);

  // Handle form input changes
  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      // Handle file input
      const file = files[0];
      if (file) {
        setFormData(prev => ({
          ...prev,
          [name]: file,
        }));

        // Create preview URL
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } else if (type === 'checkbox') {
      // Handle checkbox input
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      // Handle other inputs
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle tag input
  const handleTagInputChange = e => {
    setTagInput(e.target.value);
  };

  // Add a tag
  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  // Handle enter key on tag input
  const handleTagKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Remove a tag
  const removeTag = tagToRemove => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();

    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Update existing article
        await ArticleService.updateArticle(articleId, formData);
        navigate(`/blog/${articleId}`, { state: { message: 'Article updated successfully' } });
      } else {
        // Create new article
        const newArticle = await ArticleService.createArticle(formData);
        navigate(`/blog/${newArticle.id}`, { state: { message: 'Article created successfully' } });
      }
    } catch (err) {
      console.error('Error saving article:', err);
      setError(err.response?.data?.detail || 'Failed to save article. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditing ? 'Edit Article' : 'Create New Article'}
      </h1>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger rounded-md p-4 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
        {/* Title */}
        <div className="mb-6">
          <Input
            id="title"
            name="title"
            label="Article Title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter a compelling title"
            required
          />
        </div>

        {/* Excerpt */}
        <div className="mb-6">
          <label
            htmlFor="excerpt"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Excerpt / Summary <span className="text-danger">*</span>
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            placeholder="Write a brief summary of your article (appears in listings)"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={3}
            required
          />
        </div>

        {/* Content */}
        <div className="mb-6">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Article Content <span className="text-danger">*</span>
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your article content here (supports HTML formatting)"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
            rows={15}
            required
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Basic HTML tags are supported for formatting.
          </p>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Category <span className="text-danger">*</span>
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Tags
          </label>
          <div className="flex items-center">
            <input
              id="tagInput"
              value={tagInput}
              onChange={handleTagInputChange}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tags (press Enter)"
              className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
              aria-label="Add tags"
              aria-describedby="tag-input-help"
            />
            <button
              type="button"
              onClick={addTag}
              className="ml-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-600 transition-colors"
              aria-label="Add tag"
            >
              Add
            </button>
          </div>
          <p id="tag-input-help" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Press Enter to add a tag
          </p>

          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3" role="list" aria-label="Added tags">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  role="listitem"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    aria-label={`Remove tag ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Banner Image */}
        <div className="mb-6">
          <label
            htmlFor="image"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Banner Image <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            If no image is uploaded, a default banner will be used.
          </p>

          {previewUrl && (
            <div className="mt-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
              <img
                src={previewUrl}
                alt="Banner preview"
                className="max-h-40 rounded-lg object-cover"
              />
            </div>
          )}
        </div>

        {/* Featured Article (Admin only) */}
        {currentUser?.role === 'admin' && (
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                aria-describedby="featured-help"
              />
              <label
                htmlFor="featured"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Mark as Featured Article
              </label>
            </div>
            <p id="featured-help" className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Featured articles will be displayed prominently on the blog page.
            </p>
          </div>
        )}

        {/* Submit and Cancel */}
        <div className="flex items-center justify-end gap-3 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/blog')}
            disabled={loading}
            aria-label="Cancel article editing"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            disabled={loading}
            aria-label={isEditing ? 'Update article' : 'Publish article'}
          >
            {isEditing ? 'Update Article' : 'Publish Article'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;
