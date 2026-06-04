import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConcernsSelector from '../ui/ConcernsSelector';
import ValidationErrorGuide from '../ui/ValidationErrorGuide';
import AvatarImage from '../ui/AvatarImage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

const ChildProfileForm = ({ child = null, onSave, onCancel, onAddAnother }) => {
  const { currentUser } = useAuth();
  const toast = useToast();

  const initialFormData = child || {
    name: '',
    birthdate: '',
    gender: '',
    grade: '',
    hasConsent: false,
    concerns: [],
    otherConcern: '',
    diagnosisNotes: '',
    languages: [],
    notes: '',
    avatar: 'default',
    familyHistory: {
      adhd: false,
      autism: false,
      dyslexia: false,
      learningIssues: false,
      otherConditions: '',
    },
    environmentalFactors: {
      traumaHistory: false,
      traumaDetails: '',
      screenTimeHours: 2,
      parentingStyle: 'other',
    },
    schoolRecords: {
      academicPerformance: 'unknown',
      learningDifficulties: false,
      attentionIssues: false,
      schoolNotes: '',
    },
  };

  const [formData, setFormData] = useState(initialFormData);
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUsingAvatar, setIsUsingAvatar] = useState(true);
  const [showValidationGuide, setShowValidationGuide] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize form when editing a child
  useEffect(() => {
    if (child) {
      setFormData(child);
      // Check if child has an uploaded image (S3 URL or file path) vs predefined avatar
      if (child.avatar && (child.avatar.startsWith('http') || child.avatar.startsWith('/'))) {
        setPhotoPreview(child.avatar);
        setIsUsingAvatar(false);
      } else if (child.photo && (child.photo.startsWith('http') || child.photo.startsWith('/'))) {
        // Legacy support for photo field
        setPhotoPreview(child.photo);
        setIsUsingAvatar(false);
      } else {
        setIsUsingAvatar(true);
      }
    }
  }, [child]);

  const avatarOptions = [
    { id: 'default', name: 'Default Star' },
    { id: 'boy1', name: 'Happy Boy' },
    { id: 'boy2', name: 'Cool Boy' },
    { id: 'boy3', name: 'Cheerful Boy' },
    { id: 'boy4', name: 'Playful Boy' },
    { id: 'girl1', name: 'Happy Girl' },
    { id: 'girl2', name: 'Smart Girl' },
    { id: 'girl3', name: 'Friendly Girl' },
    { id: 'girl4', name: 'Cute Girl' },
  ];

  const gradeOptions = [
    'Pre-K',
    'Kindergarten',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
    'Grade 11',
    'Grade 12',
    'Not in School',
  ];

  const languageOptions = [
    'English',
    'Hindi',
    'Bengali',
    'Telugu',
    'Marathi',
    'Tamil',
    'Gujarati',
    'Urdu',
    'Malayalam',
    'Kannada',
    'Odia',
    'Punjabi',
    'Assamese',
    'Sanskrit',
    'Other',
  ];

  const parentingStyleOptions = [
    { value: 'authoritative', label: 'Authoritative - Warm but firm' },
    { value: 'authoritarian', label: 'Authoritarian - Strict with high expectations' },
    { value: 'permissive', label: 'Permissive - Lenient and nurturing' },
    { value: 'uninvolved', label: 'Uninvolved - Less engaged' },
    { value: 'other', label: 'Other/Mixed approach' },
  ];

  const academicPerformanceOptions = [
    { value: 'excellent', label: 'Excellent - Above grade level' },
    { value: 'good', label: 'Good - At grade level' },
    { value: 'average', label: 'Average - Meeting most expectations' },
    { value: 'below_average', label: 'Below Average - Struggles with some subjects' },
    { value: 'poor', label: 'Poor - Significant difficulties' },
    { value: 'unknown', label: 'Unknown/Not applicable' },
  ];

  // Date validation function for children (1-16 years)
  const validateDateOfBirth = dateString => {
    if (!dateString) return { isValid: true, message: '' };

    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    if (adjustedAge < 1) {
      return { isValid: false, message: 'Child must be at least 1 year old' };
    }

    if (adjustedAge > 16) {
      return { isValid: false, message: 'Child cannot be more than 16 years old' };
    }

    return { isValid: true, message: '' };
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    // Add DOB validation
    if (name === 'birthdate') {
      const validation = validateDateOfBirth(value);
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }
    }

    if (name.includes('.')) {
      const [section, key] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: type === 'checkbox' ? checked : value,
        },
      }));
    } else if (type === 'checkbox') {
      if (name === 'languages') {
        let updatedLanguages = [...formData.languages];
        if (checked) {
          updatedLanguages.push(value);
        } else {
          updatedLanguages = updatedLanguages.filter(lang => lang !== value);
        }
        setFormData(prev => ({
          ...prev,
          languages: updatedLanguages,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        setErrorMessage('Please upload a PNG or JPG image only.');
        return;
      }

      if (file.size > maxSize) {
        setErrorMessage('Image must be less than 2MB in size.');
        return;
      }

      setErrorMessage('');
      setIsUsingAvatar(false);
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarSelect = avatarId => {
    setFormData(prev => ({
      ...prev,
      avatar: avatarId,
    }));
    setIsUsingAvatar(true);
    setPhotoPreview(null);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setSelectedFile(null);
    setIsUsingAvatar(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrorMessage('');
  };

  const handleNextStep = () => {
    if (step === 1) {
      // Validate required fields in step 1
      if (!formData.name.trim()) {
        toast.error('Child name is required');
        return;
      }
      if (!formData.birthdate) {
        toast.error('Date of birth is required');
        return;
      }

      // Validate DOB before proceeding
      const dobValidation = validateDateOfBirth(formData.birthdate);
      if (!dobValidation.isValid) {
        toast.error(dobValidation.message);
        return;
      }

      setErrorMessage('');
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async event => {
    event.preventDefault();

    console.log('Form submission started...');
    console.log('Form data:', formData);

    // Validate DOB before saving
    const dobValidation = validateDateOfBirth(formData.birthdate);
    if (!dobValidation.isValid) {
      toast.error(dobValidation.message);
      setErrorMessage(dobValidation.message);
      setShowValidationGuide(true);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      // Improved name handling to prevent NA and NaN issues
      const fullName = formData.name.trim();
      let firstName = '';
      let lastName = '';

      if (fullName.includes(' ')) {
        const parts = fullName.split(' ').filter(part => part.trim().length > 0);
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        firstName = fullName;
        lastName = ''; // Leave empty instead of 'N/A'
      }

      const childData = {
        firstName,
        lastName: lastName || undefined, // Don't send empty string, send undefined
        dateOfBirth: formData.birthdate,
        gender: formData.gender,
        grade: formData.grade,
        concerns: formData.concerns,
        otherConcern: formData.otherConcern,
        languages: formData.languages,
        diagnosis_details: formData.diagnosisNotes,
        notes: formData.notes,
        parental_consent: true,
        parent_id: currentUser?.id,
        familyHistory: formData.familyHistory,
        environmentalFactors: formData.environmentalFactors,
        schoolRecords: formData.schoolRecords,
      };

      // Handle photo/avatar
      if (!isUsingAvatar && selectedFile) {
        childData.avatar = selectedFile;
      } else if (isUsingAvatar) {
        childData.avatar = formData.avatar;
      }

      console.log('Prepared child data for save:', childData);
      console.log('Calling onSave...');

      await onSave(childData);

      console.log('onSave completed successfully');

      // Only reset form if this was a new child creation (not editing)
      if (!child) {
        setFormData(initialFormData);
        setPhotoPreview(null);
        setIsUsingAvatar(true);
        setStep(1);
      }

      // Don't show toast here - let the parent component handle it
      // toast.success(
      //   child ? 'Child profile updated successfully!' : 'Child profile created successfully!'
      // );
    } catch (error) {
      console.error('Save error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Enhanced error handling with validation guide
      if (error.response?.data?.message) {
        const errorMsg = error.response.data.message;

        // Set error message and show validation guide
        setErrorMessage(errorMsg);
        setShowValidationGuide(true);

        // Handle specific validation errors
        if (errorMsg.includes('concerns') || errorMsg.includes('enum')) {
          toast.error('Please check your concern selections and try again.');
        } else if (errorMsg.includes('Date of birth')) {
          toast.error('Invalid date of birth. Child must be between 1-16 years old.');
        } else if (errorMsg.includes('Gender')) {
          toast.error('Please select a gender option.');
        } else {
          toast.error(errorMsg);
        }
      } else if (error.message) {
        setErrorMessage(error.message);
        setShowValidationGuide(true);
        toast.error(error.message);
      } else {
        const defaultError = 'Failed to save child profile. Please try again.';
        setErrorMessage(defaultError);
        setShowValidationGuide(true);
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Format selected items helper function (updated for concerns)
  const formatSelectedItems = items => {
    if (Array.isArray(items)) {
      return items.filter(item => item.trim() !== '');
    } else if (typeof items === 'object' && items !== null) {
      return Object.entries(items)
        .filter(([key, value]) => value === true)
        .map(([key]) => key);
    }
    return [];
  };

  // Handle concerns change
  const handleConcernsChange = newConcerns => {
    setFormData(prev => ({
      ...prev,
      concerns: newConcerns,
    }));
  };

  // Handle other concern change
  const handleOtherConcernChange = value => {
    setFormData(prev => ({
      ...prev,
      otherConcern: value,
    }));
  };

  const getAvatarImage = avatarId => {
    // Use actual images from public/child-avatar folder
    if (avatarId === 'default') {
      return (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="white"
            className="w-8 h-8"
          >
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    }

    // Use actual JPG images for child avatars
    const imagePath = `/child-avatar/${avatarId}.jpg`;

    return (
      <AvatarImage
        imagePath={imagePath}
        avatarId={avatarId}
        className="w-full h-full"
        fallbackType="star"
      />
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
    exit: {
      opacity: 0,
      x: step === 1 ? '100%' : '-100%',
      transition: { duration: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-8">
      <form onSubmit={handleSubmit}>
        {/* Step indicator and navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                1
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Basic Info
              </span>
            </div>
            <div className="w-12 h-px bg-gray-200"></div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Development
              </span>
            </div>
          </div>

          {/* Help button */}
          <button
            type="button"
            onClick={() => setShowValidationGuide(true)}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <QuestionMarkCircleIcon className="w-4 h-4" />
            <span>Need Help?</span>
          </button>
        </div>

        {/* Form steps content */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Step 1 content */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <motion.div
                  variants={itemVariants}
                  className="flex-shrink-0 flex flex-col items-center"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border border-white/50 dark:border-gray-700/50 shadow-md mb-4">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Child profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : isUsingAvatar ? (
                      getAvatarImage(formData.avatar)
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-10 h-10"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 w-full">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-blue-600 hover:border-blue-700 shadow-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 mr-2"
                          aria-hidden="true"
                        >
                          <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
                          <path
                            fillRule="evenodd"
                            d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3H9a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Upload Photo
                        <input
                          id="child-photo-upload"
                          type="file"
                          accept="image/png, image/jpeg, image/jpg"
                          className="sr-only"
                          onChange={handlePhotoChange}
                          ref={fileInputRef}
                          aria-label="Upload child profile photo"
                        />
                      </Button>
                    </motion.div>

                    <motion.button
                      type="button"
                      onClick={() => setIsUsingAvatar(true)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 w-full transition-colors duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 mr-2"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a1.96 1.96 0 00-.189.866c0 .298.059.605.189.866.108.215.395.634.936.634.54 0 .828-.419.936-.634.13-.26.189-.568.189-.866 0-.298-.059-.605-.189-.866-.108-.215-.395-.634-.936-.634zm4.314.634c.108-.215.395-.634.936-.634.54 0 .828.419.936.634.13.26.189.568.189.866 0 .298-.059.605-.189.866-.108.215-.395.634-.936.634-.54 0-.828-.419-.936-.634a1.96 1.96 0 01-.189-.866c0-.298.059-.605.189-.866zm2.023 7.465a.75.75 0 01.06 1.06A8.981 8.981 0 0112 20.25a8.981 8.981 0 01-7.23-3.695.75.75 0 111.201-.9 7.481 7.481 0 006.03 3.078 7.481 7.481 0 006.022-3.078.75.75 0 011.061-.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Use Avatar
                    </motion.button>

                    {(photoPreview || isUsingAvatar) && (
                      <motion.button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 w-full transition-colors duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Remove
                      </motion.button>
                    )}

                    {errorMessage && <p className="text-danger text-xs mt-1">{errorMessage}</p>}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PNG or JPG, max 2MB
                    </p>
                  </div>
                </motion.div>

                <div className="flex-1 space-y-6">
                  <motion.div variants={itemVariants}>
                    <Input
                      id="name"
                      name="name"
                      label="Child's Name or Nickname"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      className="p-3 text-lg rounded-md transition-all focus:ring-2 focus:ring-primary/50 dark:focus:ring-dark-primary"
                      helpText="Use a nickname like 'Sunny' for privacy"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Input
                      id="birthdate"
                      name="birthdate"
                      type="date"
                      label="Date of Birth"
                      value={formData.birthdate}
                      onChange={handleChange}
                      required
                      aria-required="true"
                      className="p-3 text-lg rounded-md transition-all focus:ring-2 focus:ring-primary/50 dark:focus:ring-dark-primary"
                      helpText="Must be between 1-16 years old"
                      max={
                        new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                          .toISOString()
                          .split('T')[0]
                      }
                      min={
                        new Date(new Date().setFullYear(new Date().getFullYear() - 16))
                          .toISOString()
                          .split('T')[0]
                      }
                    />
                  </motion.div>

                  {/* Grade Selection */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Grade (Optional)
                    </label>
                    <select
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="w-full p-3 text-lg border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                    >
                      <option value="">Select grade</option>
                      {gradeOptions.map(grade => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This helps us provide age-appropriate assessments
                    </p>
                  </motion.div>

                  {/* Improved Gender Selection - Removed "Prefer not to say" */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Gender
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['male', 'female', 'other'].map(option => (
                        <label
                          key={option}
                          className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            formData.gender === option
                              ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={option}
                            checked={formData.gender === option}
                            onChange={handleChange}
                            className="absolute opacity-0"
                          />
                          <span
                            className={`text-sm font-medium capitalize ${
                              formData.gender === option
                                ? 'text-primary dark:text-primary'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {option}
                          </span>
                          {formData.gender === option && (
                            <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </motion.div>

                  {isUsingAvatar && (
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Choose Avatar
                      </label>
                      <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
                        {avatarOptions.map(avatar => (
                          <motion.button
                            key={avatar.id}
                            type="button"
                            onClick={() => handleAvatarSelect(avatar.id)}
                            className={`h-14 w-14 rounded-full overflow-hidden flex items-center justify-center border-2 transition-all duration-200 ${
                              formData.avatar === avatar.id
                                ? 'border-primary dark:border-dark-primary scale-110 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={`Select ${avatar.name} avatar`}
                            aria-pressed={formData.avatar === avatar.id}
                          >
                            {getAvatarImage(avatar.id)}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Error Message for Step 1 */}
            {errorMessage && step === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => setShowValidationGuide(true)}
                    className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                  >
                    Get Help
                  </button>
                </div>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-end pt-6">
              <Button
                type="button"
                variant="gradient"
                size="md"
                onClick={handleNextStep}
                disabled={!formData.name || !formData.birthdate || !formData.gender}
                className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                Next Step
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Developmental Information
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Help us understand your child's development and any areas of concern
              </p>
            </div>

            {/* Replace the old diagnoses section with ConcernsSelector */}
            <ConcernsSelector
              selectedConcerns={formData.concerns}
              onConcernsChange={handleConcernsChange}
              otherConcern={formData.otherConcern}
              onOtherConcernChange={handleOtherConcernChange}
              className="mb-6"
            />

            {/* Additional Notes */}
            <motion.div variants={itemVariants}>
              <label
                htmlFor="diagnosisNotes"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Additional Notes About Development
              </label>
              <textarea
                id="diagnosisNotes"
                name="diagnosisNotes"
                value={formData.diagnosisNotes}
                onChange={handleChange}
                placeholder="Any additional information about your child's development, previous assessments, or other relevant details..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors resize-vertical"
                rows={4}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Optional: Include any previous evaluations, therapies, or observations from teachers
              </p>
            </motion.div>

            {/* Languages */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Languages Spoken at Home (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {languageOptions.map(language => (
                  <label
                    key={language}
                    className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="languages"
                      value={language}
                      checked={formData.languages.includes(language)}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">{language}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Understanding your child's language environment helps us provide better assessments
              </p>
            </motion.div>

            {/* Error Message for Step 2 */}
            {errorMessage && step === 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-md"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => setShowValidationGuide(true)}
                    className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                  >
                    Get Help
                  </button>
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handlePrevStep}
                disabled={isSaving}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </Button>

              <Button
                type="submit"
                variant="gradient"
                size="md"
                disabled={isSaving}
                className="min-w-[120px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
              >
                {isSaving ? 'Saving...' : child ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </motion.div>
        )}
      </form>

      {/* Validation Error Guide Modal */}
      <ValidationErrorGuide
        isOpen={showValidationGuide}
        onClose={() => setShowValidationGuide(false)}
        error={errorMessage}
      />
    </div>
  );
};

export default ChildProfileForm;
