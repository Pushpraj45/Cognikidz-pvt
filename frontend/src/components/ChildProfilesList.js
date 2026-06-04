import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ChildProfileService from '../services/ChildProfileService';
import { format } from 'date-fns';
import Button from './ui/Button';
import TranslatedText from './ui/TranslatedText';

const ChildProfilesList = () => {
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const data = await ChildProfileService.getChildren();
      setChildren(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to load children profiles. Please try again.');
      setLoading(false);
    }
  };

  const handleAddChild = () => {
    navigate('/children/add');
  };

  const handleEditChild = childId => {
    navigate(`/children/${childId}/edit`);
  };

  const handleDeleteChild = async childId => {
    if (window.confirm('Are you sure you want to delete this child profile?')) {
      try {
        await ChildProfileService.deleteChild(childId);
        // Refresh the list
        fetchChildren();
      } catch (err) {
        console.error('Error deleting child:', err);
        setError('Failed to delete child profile. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-3xl mx-auto my-4">
        <p>{error}</p>
        <button onClick={fetchChildren} className="mt-2 px-4 py-2 bg-red-600 text-white rounded">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            <TranslatedText>Children Profiles</TranslatedText>
          </h1>
          <p className="text-gray-600">
            <TranslatedText>Manage profiles for your children</TranslatedText>
          </p>
        </div>
        <button
          onClick={handleAddChild}
          className="px-4 py-2 bg-indigo-600 text-white rounded flex items-center"
        >
          <span className="mr-2">+</span> Add Child
        </button>
      </div>

      {children.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium mb-2">
            <TranslatedText>No Children Profiles Yet</TranslatedText>
          </h2>
          <p className="text-gray-600 mb-6">
            Add your child's profile to get started with personalized assessments and activities.
          </p>
          <button
            onClick={handleAddChild}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium"
          >
            Add Your First Child
          </button>
        </div>
      ) : (
        <div className="grid gap-4 xs:gap-6 sm:grid-cols-1 md:grid-cols-2">
          {children.map(child => (
            <div key={child.id} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="p-4">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    {child.avatar ? (
                      <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
                        {/* Map avatar name to emoji */}
                        {child.avatar === 'star' && '★'}
                        {child.avatar === 'cat' && '🐱'}
                        {child.avatar === 'fox' && '🦊'}
                        {child.avatar === 'dog' && '🐶'}
                        {child.avatar === 'bear' && '🐻'}
                        {child.avatar === 'lion' && '🦁'}
                        {child.avatar === 'tiger' && '🐯'}
                        {child.avatar === 'panda' && '🐼'}
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                        👤
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{child.name}</h2>
                    <p className="text-gray-600">
                      {child.dob ? format(new Date(child.dob), 'MMM d, yyyy') : 'No DOB provided'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Gender:</span>{' '}
                      <span>{child.gender}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Grade:</span>{' '}
                      <span>{child.grade || 'Not specified'}</span>
                    </div>

                    {child.diagnoses && child.diagnoses.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Diagnoses:</span>{' '}
                        <span>{child.diagnoses.join(', ')}</span>
                      </div>
                    )}

                    {child.languages && child.languages.length > 0 && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">Languages:</span>{' '}
                        <span>{child.languages.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEditChild(child.id)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteChild(child.id)}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildProfilesList;
