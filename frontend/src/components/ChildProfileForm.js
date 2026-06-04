import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChildProfileService from '../services/ChildProfileService';
import AuthService from '../services/AuthService';
import { format } from 'date-fns';
import TranslatedText from './ui/TranslatedText';

const ChildProfileForm = ({ isEdit = false }) => {
  const navigate = useNavigate();
  const { childId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentParent, setCurrentParent] = useState(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Prefer not to say',
    avatar: '',
    photo: '',
    grade: '',
    diagnoses: [],
    diagnosis_details: '',
    languages: [],
    notes: '',
    parental_consent: false,
    parent_id: '',
  });

  // Fetch parent data and child data if editing
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Get current parent
        const parent = await AuthService.getCurrentUser();
        setCurrentParent(parent);
        setFormData(prev => ({ ...prev, parent_id: parent.id }));

        // If in edit mode, fetch child data
        if (isEdit && childId) {
          const childData = await ChildProfileService.getChild(childId);
          // Format date from ISO to YYYY-MM-DD for input
          const formattedDob = childData.dob ? format(new Date(childData.dob), 'yyyy-MM-dd') : '';

          setFormData({
            ...childData,
            dob: formattedDob,
            diagnoses: childData.diagnoses || [],
            languages: childData.languages || [],
          });
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load data. Please try again.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchData();
  }, [isEdit, childId]);

  // Handle form field changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'parental_consent') {
        // Single checkbox
        setFormData({ ...formData, [name]: checked });
      } else {
        // Checkboxes for arrays (diagnoses, languages)
        const arrayName = name.split('-')[0]; // e.g., "diagnoses-ADHD" -> "diagnoses"
        const itemValue = name.split('-')[1]; // e.g., "diagnoses-ADHD" -> "ADHD"

        setFormData(prev => {
          const currentArray = [...(prev[arrayName] || [])];

          if (checked) {
            // Add to array if not present
            if (!currentArray.includes(itemValue)) {
              currentArray.push(itemValue);
            }
          } else {
            // Remove from array
            const index = currentArray.indexOf(itemValue);
            if (index !== -1) {
              currentArray.splice(index, 1);
            }
          }

          return { ...prev, [arrayName]: currentArray };
        });
      }
    } else {
      // Regular inputs
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle Avatar selection
  const handleAvatarSelect = avatar => {
    setFormData({ ...formData, avatar });
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      // Prepare data for API
      const childData = {
        ...formData,
        // Ensure parent_id is set
        parent_id: currentParent?.id,
      };

      if (isEdit) {
        await ChildProfileService.updateChild(childId, childData);
        // Navigate back to dashboard with refresh flag
        navigate('/dashboard?refresh=true&tab=children');
      } else {
        await ChildProfileService.createChild(childData);
        // Navigate back to dashboard with child added flag
        navigate('/dashboard?childAdded=true&tab=children');
      }
    } catch (err) {
      setError('Failed to save child profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Navigation between steps
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);

  // If loading
  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEdit ? 'Edit Child Profile' : 'Add Child Profile'}
      </h1>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`h-1 w-1/2 ${currentStep >= 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`h-1 w-1/2 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
        </div>
        <div className="text-sm text-gray-500 mt-2">Step {currentStep} of 2</div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Information */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              <TranslatedText>Add Child Profile</TranslatedText>
            </h2>
            <p className="text-gray-600 mb-6">
              <TranslatedText>
                Add basic information to create a profile for your child
              </TranslatedText>
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Child's Name or Nickname <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="Prefer not to say">
                  <TranslatedText>Prefer not to say</TranslatedText>
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Choose Avatar</label>
              <div className="grid grid-cols-4 gap-4">
                {/* Sample avatars - replace with actual avatar choices */}
                {['star', 'cat', 'fox', 'dog', 'bear', 'lion', 'tiger', 'panda'].map(avatar => (
                  <div
                    key={avatar}
                    onClick={() => handleAvatarSelect(avatar)}
                    className={`cursor-pointer rounded-full p-2 ${formData.avatar === avatar ? 'ring-2 ring-indigo-500' : ''}`}
                  >
                    <div className="bg-yellow-100 rounded-full h-16 w-16 flex items-center justify-center">
                      {avatar === 'star' && '★'}
                      {avatar === 'cat' && '🐱'}
                      {avatar === 'fox' && '🦊'}
                      {avatar === 'dog' && '🐶'}
                      {avatar === 'bear' && '🐻'}
                      {avatar === 'lion' && '🦁'}
                      {avatar === 'tiger' && '🐯'}
                      {avatar === 'panda' && '🐼'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => navigate('/children')}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Additional Information */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              <TranslatedText>Add Child Profile</TranslatedText>
            </h2>
            <p className="text-gray-600 mb-6">
              <TranslatedText>Add optional details and provide consent</TranslatedText>
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                <TranslatedText>School Grade</TranslatedText>
              </label>
              <select
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">
                  <TranslatedText>Select grade</TranslatedText>
                </option>
                <option value="Pre-K">Pre-K</option>
                <option value="Kindergarten">
                  <TranslatedText>Kindergarten</TranslatedText>
                </option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Known Diagnoses (if any)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="diagnoses-ADHD"
                      checked={formData.diagnoses.includes('ADHD')}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    ADHD
                  </label>
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="diagnoses-Dyslexia"
                      checked={formData.diagnoses.includes('Dyslexia')}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Dyslexia
                  </label>
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="diagnoses-Autism Spectrum"
                      checked={formData.diagnoses.includes('Autism Spectrum')}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Autism Spectrum
                  </label>
                </div>
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      name="diagnoses-Other"
                      checked={formData.diagnoses.includes('Other')}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Other
                  </label>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Additional Diagnosis Details (Optional)
              </label>
              <input
                type="text"
                name="diagnosis_details"
                value={formData.diagnosis_details}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Primary Language(s)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  'English',
                  'Hindi',
                  'Tamil',
                  'Telugu',
                  'Bengali',
                  'Marathi',
                  'Gujarati',
                  'Kannada',
                  'Malayalam',
                ].map(lang => (
                  <div key={lang}>
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        name={`languages-${lang}`}
                        checked={formData.languages.includes(lang)}
                        onChange={handleChange}
                        className="mr-2"
                      />
                      {lang}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Behavioral/Developmental Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-2 border rounded h-24"
                placeholder="Add any notes that might help us understand your child's needs better"
              ></textarea>
              <div className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/500 characters
              </div>
            </div>

            <div className="mb-8 p-4 border rounded bg-gray-50">
              <h3 className="font-medium mb-2">
                <TranslatedText>Parental Consent</TranslatedText>
              </h3>
              <p className="text-gray-700 mb-4">
                I hereby confirm that I am the parent or legal guardian of the child whose
                information I am providing. I understand and consent to the collection and
                processing of this data for the purpose of conducting assessments and providing
                personalized feedback.
              </p>
              <p className="text-gray-700 mb-4">I understand that:</p>
              <ul className="list-disc pl-5 mb-4 text-gray-700">
                <li>The data will be used to identify potential developmental areas of focus.</li>
              </ul>
              <div>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name="parental_consent"
                    checked={formData.parental_consent}
                    onChange={handleChange}
                    required
                    className="mr-2"
                  />
                  I confirm I am the parent/legal guardian and consent to data use for assessments.
                </label>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button type="button" onClick={prevStep} className="px-4 py-2 border rounded">
                Back
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => navigate('/children')}
                  className="px-4 py-2 border rounded mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                  disabled={loading}
                >
                  {isEdit ? 'Save Profile' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default ChildProfileForm;
