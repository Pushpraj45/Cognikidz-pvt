import React, { useState, useRef, useEffect } from 'react';
import Button from '../../components/ui/Button';
import ArticleService from '../../services/ArticleService';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORIES = ['ADHD', 'Autism', 'Dyslexia', 'Development', 'Early Intervention'];

const BlogWrite = ({ onBack, onSuccess }) => {
  const { currentUser, isLoggedIn } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('ADHD');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef();

  // Reset form and scroll to top when component mounts
  useEffect(() => {
    // Reset all form state
    setSelectedCategory('ADHD');
    setTitle('');
    setContent('');
    setTags('');
    setImage(null);
    setImagePreview(null);
    setHelpOpen(false);
    setIsSubmitting(false);
    setSubmitError('');

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []); // Empty dependency array means this runs once when component mounts

  const handleSubmit = async () => {
    console.log('=== Article Submission Started ===');
    console.log('Current User:', currentUser);
    console.log('Is Logged In:', isLoggedIn);
    console.log('Current state:', { title, content, selectedCategory, tags });

    // Validation
    if (!title.trim()) {
      setSubmitError('Please enter a title');
      return;
    }
    if (!content.trim()) {
      setSubmitError('Please enter content');
      return;
    }
    if (!isLoggedIn || !currentUser) {
      setSubmitError('You must be logged in to create an article');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const articleData = {
        title: title.trim(),
        body: content.trim(),
        category: selectedCategory,
        tags: tags.trim()
          ? tags
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag)
          : [],
        image: image,
      };

      console.log('Prepared article data:', articleData);
      console.log('About to call ArticleService.createArticle...');

      const response = await ArticleService.createArticle(articleData);

      console.log('Article created successfully:', response);

      // Reset form
      setTitle('');
      setContent('');
      setTags('');
      setImage(null);
      setImagePreview(null);
      setSelectedCategory('ADHD');

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(response);
      } else {
        // Default success action - could redirect to blog list or show success message
        alert('Article published successfully!');
        if (onBack) onBack();
      }
    } catch (error) {
      console.error('=== Article Submission Error ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error config:', error.config);
      console.error('Error message:', error.message);

      setSubmitError(
        error.friendlyMessage || error.message || 'Failed to create article. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      console.log('=== Article Submission Completed ===');
    }
  };

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSubmitError('Please select a valid image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image size should be less than 5MB');
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setSubmitError('');
    }
  };

  const removeImage = () => {
    setImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen mt-20 bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Decorative background gradients and dots for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/10 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[400px] h-[400px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        <div className="absolute top-[30%] left-[15%] w-3 h-3 bg-primary rounded-full"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full"></div>
        <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-secondary rounded-full"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 bg-primary rounded-full"></div>
      </div>
      <main className="flex flex-col lg:flex-row gap-4 lg:gap-6 p-4 lg:p-8 relative z-10 max-w-7xl mx-auto">
        {/* Main form */}
        <div className="flex-1 lg:max-w-3xl">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-4 text-primary hover:underline font-medium flex items-center gap-1"
              aria-label="Back to blog feed"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <div className="glassmorphism-card relative z-10 rounded-2xl p-6 lg:p-8 shadow-colored-lg">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 animated-gradient-text">
              Write a New Article
            </h2>

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-400 rounded-lg">
                {submitError}
              </div>
            )}

            <input
              className="w-full mb-4 px-4 py-2 rounded-lg border border-white/30 dark:border-gray-700/40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/60 text-lg"
              placeholder="Title......"
              value={title}
              onChange={e => setTitle(e.target.value)}
              aria-label="Article Title"
              disabled={isSubmitting}
            />
            <textarea
              className="w-full mb-4 px-4 py-3 rounded-lg border border-white/30 dark:border-gray-700/40 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/60 min-h-[180px] text-base"
              placeholder="Start writing here....."
              value={content}
              onChange={e => setContent(e.target.value)}
              aria-label="Article Content"
              disabled={isSubmitting}
            />
            <Button
              className="mt-4 md:hidden w-full"
              variant="gradient"
              size="lg"
              aria-label="Upload Article"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              <span className="flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                      />
                    </svg>
                    Submit Article
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
        {/* Sidebar */}
        <aside className="w-full lg:w-80 flex-shrink-0">
          <div className="relative rounded-2xl shadow-colored-lg border border-white/30 dark:border-gray-700/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 z-0 rounded-2xl" />
            <div className="relative z-10 glassmorphism-card bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg rounded-2xl p-4 lg:p-6 flex flex-col gap-4 lg:gap-6">
              <div>
                <div className="mb-2 font-semibold text-primary dark:text-white">
                  Select Category
                </div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-xl font-semibold text-sm focus:outline-none focus:ring-0 focus:border-0 transition-all duration-300 border border-white/30 dark:border-gray-700/40 shadow-sm backdrop-blur-md hover:scale-105 active:scale-95
                        ${
                          selectedCategory === cat
                            ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg scale-105 focus:ring-0 focus:border-0 focus:outline-none'
                            : 'bg-white/40 dark:bg-gray-800/40 text-primary dark:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md focus:ring-2 focus:ring-primary/60'
                        }
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                      aria-pressed={selectedCategory === cat}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  className="flex-1 flex flex-col items-center justify-center gap-1 bg-white/40 dark:bg-gray-900/40 border border-white/20 dark:border-gray-700/30 rounded-xl py-3 text-primary dark:text-white hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  aria-label="Add Images"
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  disabled={isSubmitting}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16l4-4a3 3 0 014 0l4 4M2 12V6a2 2 0 012-2h16a2 2 0 012 2v6"
                    />
                  </svg>
                  <span className="text-xs">Add Images</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                </button>
                <button
                  className="flex-1 flex flex-col items-center justify-center gap-1 bg-white/40 dark:bg-gray-900/40 border border-white/20 dark:border-gray-700/30 rounded-xl py-3 text-primary dark:text-white hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  aria-label="Need Help"
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  disabled={isSubmitting}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8a9 9 0 1118 0z"
                    />
                  </svg>
                  <span className="text-xs">Need Help</span>
                </button>
              </div>
              {imagePreview && (
                <div className="w-full flex flex-col items-center mt-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-cover border border-primary/40 shadow"
                  />
                  <button
                    type="button"
                    className="mt-2 text-xs text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={removeImage}
                    disabled={isSubmitting}
                  >
                    Remove Image
                  </button>
                </div>
              )}
              <textarea
                className="w-full mb-2 px-3 py-2 rounded-lg border border-white/30 dark:border-gray-700/40 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md text-primary dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/60 min-h-[60px] text-sm disabled:opacity-50"
                placeholder="Add Tags (comma separated)"
                value={tags}
                onChange={e => setTags(e.target.value)}
                aria-label="Add Tags"
                disabled={isSubmitting}
              />
              <Button
                className="w-full hidden md:block"
                variant="gradient"
                size="lg"
                aria-label="Upload Article"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <span className="flex items-center gap-2">
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                        />
                      </svg>
                      Submit Article
                    </>
                  )}
                </span>
              </Button>
            </div>
          </div>
        </aside>
      </main>
      {/* Help Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="glassmorphism-card bg-white/90 dark:bg-gray-900/90 border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-colored-lg max-w-md w-full p-8 relative animate-fadeIn">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/60 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110"
              aria-label="Close help dialog"
              onClick={() => setHelpOpen(false)}
              autoFocus
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-xl font-bold mb-4 text-primary dark:text-white">
              Need Help Writing?
            </h3>
            <ul className="mb-4 space-y-2 text-gray-700 dark:text-gray-200 text-base list-disc pl-5">
              <li>Start with a clear title and introduction.</li>
              <li>Share your personal experience or advice.</li>
              <li>Be respectful and protect privacy—avoid sharing sensitive info.</li>
              <li>Use tags to help others find your story.</li>
              <li>Keep it supportive and positive!</li>
            </ul>
            <div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
              For more help, see our{' '}
              <a href="#" className="text-primary underline">
                Community Guidelines
              </a>{' '}
              or{' '}
              <a href="mailto:support@cognikidz.care" className="text-primary underline">
                contact support
              </a>
              .
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogWrite;
