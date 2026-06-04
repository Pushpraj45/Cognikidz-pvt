import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import Input from '../ui/Input';
import PhoneInput from '../ui/PhoneInput';
import NotificationPreferences from '../ui/NotificationPreferences';
import AuthService from '../../services/AuthService';
import { useToast } from '../../contexts/ToastContext';
import {
  UserCircleIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  CameraIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const EnhancedParentProfile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    address: '',
    location: '',
    parental_role: '',
    language_preference: '',
    profile_picture: '',
    dateOfBirth: '',
    occupation: '',
    mentalHealthInfo: {
      hasMentalIllness: false,
      mentalIllnessDetails: '',
      hasDepression: false,
      hasAnxiety: false,
      hasBipolarDisorder: false,
      hasSchizophrenia: false,
      hadMaternalStress: false,
      hadAutoimmuneDuringPregnancy: false,
      hadThyroidIssuesDuringPregnancy: false,
    },
  });
  const [formData, setFormData] = useState({
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, CA 94521',
    role: 'Mother',
    location: '',
    dateOfBirth: '',
    occupation: '',
    mentalHealthInfo: {
      hasMentalIllness: false,
      mentalIllnessDetails: '',
      hasDepression: false,
      hasAnxiety: false,
      hasBipolarDisorder: false,
      hasSchizophrenia: false,
      hadMaternalStress: false,
      hadAutoimmuneDuringPregnancy: false,
      hadThyroidIssuesDuringPregnancy: false,
    },
    notifications: {
      email: true,
      sms: false,
      app: true,
    },
    preferences: {
      darkMode: false,
      highContrast: false,
      dyslexiaFont: false,
      language: 'english',
      timezone: 'Asia/Kolkata',
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add toast context
  const toast = useToast();

  // Feature flags
  const [featureFlags, setFeatureFlags] = useState({
    notifications: true,
    security: false,
    accessibility: false,
  });

  // Enhanced Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    hover: {
      y: -4,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
  };

  const tabVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.3,
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: 'easeOut',
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  // Date validation function
  const validateDateOfBirth = dateString => {
    if (!dateString) return { isValid: true, message: '' };

    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    if (adjustedAge < 22) {
      return { isValid: false, message: 'Parent must be at least 22 years old' };
    }

    if (adjustedAge > 75) {
      return { isValid: false, message: 'Parent age cannot be more than 75 years' };
    }

    return { isValid: true, message: '' };
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const data = await AuthService.getCurrentUser();

        // Ensure we have user ID, if not, try to get it from profile data
        if (!data || !data.id || !data._id) {
          try {
            const profileData = await AuthService.getUserProfile();
            const userData = {
              ...data,
              ...profileData,
              id: profileData._id || profileData.id || data._id || data.id,
            };

            // Store the complete user data in localStorage
            localStorage.setItem('user_data', JSON.stringify(userData));

            setUserData(userData);

            // Also update the formData state - Fixed: Empty location by default
            setFormData(prev => ({
              ...prev,
              name: `${userData.firstName || ''}${userData.lastName && userData.lastName !== 'NA' && userData.lastName.trim() ? ` ${userData.lastName}` : ''}`.trim(),
              email: userData.email || '',
              phone: userData.phone || '',
              address: userData.address || '',
              location: userData.location || '', // Fixed: Empty instead of default city
              role: userData.parental_role || 'Parent',
              dateOfBirth: userData.dateOfBirth
                ? new Date(userData.dateOfBirth).toISOString().split('T')[0]
                : '',
              occupation: userData.occupation || '',
              mentalHealthInfo: userData.mentalHealthInfo || {
                hasMentalIllness: false,
                mentalIllnessDetails: '',
                hasDepression: false,
                hasAnxiety: false,
                hasBipolarDisorder: false,
                hasSchizophrenia: false,
                hadMaternalStress: false,
                hadAutoimmuneDuringPregnancy: false,
                hadThyroidIssuesDuringPregnancy: false,
              },
            }));
          } catch (err) {
            console.error('Error fetching profile data:', err);
            setUserData(data);
          }
        } else {
          setUserData(data);

          // Update the formData state with the current user data - Fixed: Empty location by default
          setFormData(prev => ({
            ...prev,
            name: `${data.firstName || ''}${data.lastName && data.lastName !== 'NA' && data.lastName.trim() ? ` ${data.lastName}` : ''}`.trim(),
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            location: data.location || '', // Fixed: Empty instead of default city
            role: data.parental_role || 'Parent',
            dateOfBirth: data.dateOfBirth
              ? new Date(data.dateOfBirth).toISOString().split('T')[0]
              : '',
            occupation: data.occupation || '',
            mentalHealthInfo: data.mentalHealthInfo || {
              hasMentalIllness: false,
              mentalIllnessDetails: '',
              hasDepression: false,
              hasAnxiety: false,
              hasBipolarDisorder: false,
              hasSchizophrenia: false,
              hadMaternalStress: false,
              hadAutoimmuneDuringPregnancy: false,
              hadThyroidIssuesDuringPregnancy: false,
            },
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    // Add DOB validation
    if (name === 'dateOfBirth') {
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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleAvatarChange = e => {
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

      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onload = event => {
        setAvatarPreview(event.target.result);
      };
      reader.readAsDataURL(file);
      setErrorMessage('');
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setErrorMessage('');
  };

  const handleSave = async e => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    // Validate DOB before saving
    const dobValidation = validateDateOfBirth(formData.dateOfBirth);
    if (!dobValidation.isValid) {
      toast.error(dobValidation.message);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // First handle avatar upload if necessary
      if (selectedAvatar) {
        await handleImageUpload(selectedAvatar);
      }

      // Improved name handling to prevent NA and empty strings
      const fullName = formData.name.trim();
      let firstName = '';
      let lastName = '';

      if (fullName.includes(' ')) {
        const parts = fullName.split(' ').filter(part => part.trim().length > 0);
        firstName = parts[0];
        lastName = parts.slice(1).join(' ');
      } else {
        firstName = fullName;
        lastName = ''; // Leave empty instead of undefined for parent profile
      }

      // Create payload with updated profile data - Filter out empty optional fields
      const payload = {
        firstName: firstName,
        lastName: lastName || undefined, // Send undefined if empty to prevent "NA" storage
        email: formData.email,
        parental_role: formData.role,
        dateOfBirth: formData.dateOfBirth,
        mentalHealthInfo: formData.mentalHealthInfo,
      };

      // Only include optional fields if they have values
      if (formData.phone && formData.phone.trim()) {
        payload.phone = formData.phone.trim();
      }

      if (formData.address && formData.address.trim()) {
        payload.address = formData.address.trim();
      }

      if (formData.location && formData.location.trim()) {
        payload.location = formData.location.trim();
      }

      if (formData.occupation && formData.occupation.trim()) {
        payload.occupation = formData.occupation.trim();
      }

      console.log('Updating profile with:', payload);
      const updatedData = await AuthService.updateUserProfile(payload);
      console.log('Profile update response:', updatedData);

      // Update local state with the response from the server
      setUserData(prevData => ({ ...prevData, ...updatedData }));
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async file => {
    try {
      setIsUploading(true);

      const result = await AuthService.uploadProfilePicture(file);

      if (result && result.profile_picture) {
        setUserData(prev => ({
          ...prev,
          profile_picture: result.profile_picture,
        }));

        // Also update the formData to keep it in sync
        setFormData(prev => ({
          ...prev,
          profile_picture: result.profile_picture,
        }));

        // Clear selected avatar after upload
        setSelectedAvatar(null);

        // Update avatar preview
        setAvatarPreview(result.profile_picture);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setError(error.message || 'Failed to upload image. Please try again.');
      throw error; // Rethrow to let the caller know that upload failed
    } finally {
      setIsUploading(false);
    }
  };

  // Render the profile form
  const renderProfileTab = () => {
    return (
      <div className="space-y-6 xs:space-y-8">
        <div className="flex flex-col xs:flex-row items-center xs:items-center space-y-4 xs:space-y-0 xs:space-x-6">
          <div className="relative w-20 h-20 xs:w-24 xs:h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow">
            {avatarPreview || userData.profilePicture ? (
              <img
                src={avatarPreview || userData.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-primary/10 text-primary text-2xl xs:text-3xl font-bold">
                {userData.firstName?.charAt(0) || userData.name?.charAt(0) || 'U'}
              </div>
            )}
            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer transition-opacity opacity-0 hover:opacity-100"
              >
                <span className="text-white text-xs xs:text-sm">Change</span>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg, image/png"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            )}
          </div>
          <div className="text-center xs:text-left">
            <h2 className="text-lg xs:text-xl font-semibold text-gray-800 dark:text-gray-200">
              {userData.firstName}
              {userData.lastName && userData.lastName !== 'NA' && userData.lastName.trim()
                ? ` ${userData.lastName}`
                : ''}
            </h2>
            <p className="text-sm xs:text-base text-gray-500 dark:text-gray-400">
              {userData.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 xs:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6">
            <Input
              id="name"
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email Address"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              required
            />

            <PhoneInput
              id="phone"
              name="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              disabled={!isEditing}
              helpText="Include country code for international numbers"
            />

            <Input
              id="location"
              name="location"
              label="Location (Optional)"
              placeholder="Enter your location"
              value={formData.location}
              onChange={handleChange}
              disabled={!isEditing}
              helpText="City, State, or Country"
            />

            <Input
              id="address"
              name="address"
              label="Address (Optional)"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
            />

            {/* Improved Relation with Child - Radio button design */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Relation with Child <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2 xs:gap-3">
                {['Mother', 'Father', 'Guardian', 'Other'].map(option => (
                  <label
                    key={option}
                    className={`relative flex items-center justify-center p-2 xs:p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.role === option
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                    } ${!isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option}
                      checked={formData.role === option}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="absolute opacity-0"
                    />
                    <span
                      className={`text-xs xs:text-sm font-medium ${
                        formData.role === option
                          ? 'text-primary dark:text-primary'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {option}
                    </span>
                    {formData.role === option && (
                      <div className="absolute top-1 right-1 w-2 h-2 xs:w-3 xs:h-3 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-1 h-1 xs:w-1.5 xs:h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              label="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              disabled={!isEditing}
              required
              helpText="Must be between 22-75 years old"
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 22))
                  .toISOString()
                  .split('T')[0]
              }
              min={
                new Date(new Date().setFullYear(new Date().getFullYear() - 75))
                  .toISOString()
                  .split('T')[0]
              }
            />

            <Input
              id="occupation"
              name="occupation"
              label="Occupation (Optional)"
              placeholder="Enter your occupation"
              value={formData.occupation}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          {/* Mental Health Information Section - Fixed dark mode */}
          {isEditing && (
            <div className="mt-6 xs:mt-8 p-4 xs:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg xs:rounded-xl">
              <h3 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 xs:mb-4">
                Health Information
              </h3>
              <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400 mb-4">
                This information helps us better understand factors that may influence your child's
                development. All information is kept strictly confidential.
              </p>

              <div className="space-y-3 xs:space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="mentalHealthInfo.hasMentalIllness"
                      name="mentalHealthInfo.hasMentalIllness"
                      type="checkbox"
                      className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                      checked={formData.mentalHealthInfo.hasMentalIllness}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="ml-3 text-xs xs:text-sm">
                    <label
                      htmlFor="mentalHealthInfo.hasMentalIllness"
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      Do you have any mental illness?
                    </label>
                  </div>
                </div>

                {formData.mentalHealthInfo.hasMentalIllness && (
                  <div className="ml-7">
                    <Input
                      id="mentalHealthInfo.mentalIllnessDetails"
                      name="mentalHealthInfo.mentalIllnessDetails"
                      label="Please specify"
                      value={formData.mentalHealthInfo.mentalIllnessDetails}
                      onChange={handleChange}
                    />
                  </div>
                )}

                <div className="mt-4">
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-xs xs:text-sm">
                    Do you suffer from any of these conditions?
                  </p>
                  <div className="ml-2 space-y-2">
                    {[
                      { key: 'hasDepression', label: 'Depression' },
                      { key: 'hasAnxiety', label: 'Anxiety' },
                      { key: 'hasBipolarDisorder', label: 'Bipolar Disorder' },
                      { key: 'hasSchizophrenia', label: 'Schizophrenia' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`mentalHealthInfo.${key}`}
                            name={`mentalHealthInfo.${key}`}
                            type="checkbox"
                            className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                            checked={formData.mentalHealthInfo[key]}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="ml-3 text-xs xs:text-sm">
                          <label
                            htmlFor={`mentalHealthInfo.${key}`}
                            className="font-medium text-gray-700 dark:text-gray-300"
                          >
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pregnancy-related questions - only show if role is Mother */}
                {formData.role === 'Mother' && (
                  <div className="mt-4">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-xs xs:text-sm">
                      Pregnancy-related Information:
                    </p>
                    <div className="ml-2 space-y-2">
                      {[
                        {
                          key: 'hadMaternalStress',
                          label:
                            'Maternal stress during pregnancy (e.g., trauma, high cortisol levels)',
                        },
                        {
                          key: 'hadAutoimmuneDuringPregnancy',
                          label: 'Autoimmune disorders during pregnancy',
                        },
                        {
                          key: 'hadThyroidIssuesDuringPregnancy',
                          label: 'Poor thyroid function during pregnancy',
                        },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id={`mentalHealthInfo.${key}`}
                              name={`mentalHealthInfo.${key}`}
                              type="checkbox"
                              className="focus:ring-primary h-4 w-4 text-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                              checked={formData.mentalHealthInfo[key]}
                              onChange={handleChange}
                            />
                          </div>
                          <div className="ml-3 text-xs xs:text-sm">
                            <label
                              htmlFor={`mentalHealthInfo.${key}`}
                              className="font-medium text-gray-700 dark:text-gray-300"
                            >
                              {label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Display a summary of health information when not editing - Fixed dark mode */}
          {!isEditing && userData.mentalHealthInfo && (
            <div className="mt-6 xs:mt-8 p-4 xs:p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg xs:rounded-xl">
              <h3 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 xs:mb-4">
                Health Information
              </h3>

              {userData.mentalHealthInfo.hasMentalIllness && (
                <div className="mb-4">
                  <p className="font-medium text-gray-700 dark:text-gray-300 text-xs xs:text-sm">
                    Mental Health:
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 ml-4 text-xs xs:text-sm">
                    {userData.mentalHealthInfo.mentalIllnessDetails || 'Mental illness reported'}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <p className="font-medium text-gray-700 dark:text-gray-300 text-xs xs:text-sm">
                  Conditions:
                </p>
                <ul className="ml-8 list-disc text-gray-600 dark:text-gray-400 text-xs xs:text-sm">
                  {userData.mentalHealthInfo.hasDepression && <li>Depression</li>}
                  {userData.mentalHealthInfo.hasAnxiety && <li>Anxiety</li>}
                  {userData.mentalHealthInfo.hasBipolarDisorder && <li>Bipolar Disorder</li>}
                  {userData.mentalHealthInfo.hasSchizophrenia && <li>Schizophrenia</li>}
                  {!userData.mentalHealthInfo.hasDepression &&
                    !userData.mentalHealthInfo.hasAnxiety &&
                    !userData.mentalHealthInfo.hasBipolarDisorder &&
                    !userData.mentalHealthInfo.hasSchizophrenia && <li>None reported</li>}
                </ul>
              </div>

              {userData.parental_role === 'Mother' && (
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300 text-xs xs:text-sm">
                    Pregnancy-related Information:
                  </p>
                  <ul className="ml-8 list-disc text-gray-600 dark:text-gray-400 text-xs xs:text-sm">
                    {userData.mentalHealthInfo.hadMaternalStress && (
                      <li>Experienced maternal stress during pregnancy</li>
                    )}
                    {userData.mentalHealthInfo.hadAutoimmuneDuringPregnancy && (
                      <li>Had autoimmune disorders during pregnancy</li>
                    )}
                    {userData.mentalHealthInfo.hadThyroidIssuesDuringPregnancy && (
                      <li>Had thyroid issues during pregnancy</li>
                    )}
                    {!userData.mentalHealthInfo.hadMaternalStress &&
                      !userData.mentalHealthInfo.hadAutoimmuneDuringPregnancy &&
                      !userData.mentalHealthInfo.hadThyroidIssuesDuringPregnancy && (
                        <li>No pregnancy health concerns reported</li>
                      )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {isEditing && (
            <div className="flex flex-col xs:flex-row justify-end space-y-3 xs:space-y-0 xs:space-x-4 mt-6 xs:mt-8">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form data to original user data
                  setFormData({
                    name: `${userData.firstName || ''}${userData.lastName && userData.lastName !== 'NA' && userData.lastName.trim() ? ` ${userData.lastName}` : ''}`.trim(),
                    email: userData.email || '',
                    phone: userData.phone || '',
                    address: userData.address || '',
                    location: userData.location || '', // Fixed: Empty instead of default
                    role: userData.parental_role || 'Parent',
                    dateOfBirth: userData.dateOfBirth
                      ? new Date(userData.dateOfBirth).toISOString().split('T')[0]
                      : '',
                    occupation: userData.occupation || '',
                    mentalHealthInfo: userData.mentalHealthInfo || {
                      hasMentalIllness: false,
                      mentalIllnessDetails: '',
                      hasDepression: false,
                      hasAnxiety: false,
                      hasBipolarDisorder: false,
                      hasSchizophrenia: false,
                      hadMaternalStress: false,
                      hadAutoimmuneDuringPregnancy: false,
                      hadThyroidIssuesDuringPregnancy: false,
                    },
                    notifications: formData.notifications,
                    preferences: formData.preferences,
                  });
                  setAvatarPreview(null);
                  setSelectedAvatar(null);
                }}
                className="w-full xs:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                type="submit"
                disabled={isSaving}
                isLoading={isSaving}
                className="w-full xs:w-auto"
              >
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </div>
    );
  };

  return (
    <div className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl xs:rounded-2xl overflow-hidden border border-white/20 dark:border-gray-700/30 shadow-lg hover:shadow-2xl transition-all duration-500">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/30 to-purple-50/50 dark:from-indigo-900/20 dark:via-gray-800/30 dark:to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Animated border glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 dark:from-indigo-600/10 dark:via-purple-600/10 dark:to-pink-600/10 rounded-xl xs:rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>

      <div className="relative border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="px-4 xs:px-6 py-4 xs:py-6 flex flex-col xs:flex-row justify-between items-start xs:items-center space-y-3 xs:space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg">
              <UserCircleIcon className="h-4 w-4 xs:h-5 xs:w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg xs:text-xl font-bold text-gray-900 dark:text-white">
                Parent Profile
              </h2>
              <p className="text-xs xs:text-sm text-gray-600 dark:text-gray-400">
                Manage your personal information
              </p>
            </div>
          </div>
          {!isEditing && (
            <div>
              <Button
                variant="gradient"
                onClick={() => setIsEditing(true)}
                aria-label="Edit your profile information"
                className="w-full xs:w-auto text-sm"
              >
                <PencilSquareIcon className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        <div className="relative px-2 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex relative">
            <button
              onClick={() => setActiveTab('profile')}
              className={`relative px-4 xs:px-6 py-3 xs:py-4 text-xs xs:text-sm font-bold border-b-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-t-lg group ${
                activeTab === 'profile'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
              }`}
              aria-selected={activeTab === 'profile'}
              role="tab"
            >
              <span className="relative z-10 flex items-center gap-2">
                <SparklesIcon className="h-3 w-3 xs:h-4 xs:w-4" />
                Personal Info
              </span>
              {activeTab === 'profile' && (
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-purple-100/50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-t-lg" />
              )}
            </button>

            {/* Feature-flagged tabs */}
            {featureFlags.notifications && (
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-3 xs:px-4 py-3 text-xs xs:text-sm font-medium border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-dark-primary/50 ${
                  activeTab === 'notifications'
                    ? 'border-primary text-primary dark:text-dark-primary dark:border-dark-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                aria-selected={activeTab === 'notifications'}
                role="tab"
              >
                Notifications
              </button>
            )}

            {featureFlags.security && (
              <button
                onClick={() => setActiveTab('security')}
                className={`px-3 xs:px-4 py-3 text-xs xs:text-sm font-medium border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-dark-primary/50 ${
                  activeTab === 'security'
                    ? 'border-primary text-primary dark:text-dark-primary dark:border-dark-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                aria-selected={activeTab === 'security'}
                role="tab"
              >
                Security
              </button>
            )}

            {featureFlags.accessibility && (
              <button
                onClick={() => setActiveTab('accessibility')}
                className={`px-3 xs:px-4 py-3 text-xs xs:text-sm font-medium border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-dark-primary/50 ${
                  activeTab === 'accessibility'
                    ? 'border-primary text-primary dark:text-dark-primary dark:border-dark-primary'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                aria-selected={activeTab === 'accessibility'}
                role="tab"
              >
                Accessibility
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative px-4 xs:px-6 py-6 xs:py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && <div key="profile">{renderProfileTab()}</div>}

          {/* Feature-flagged content */}
          {featureFlags.notifications && activeTab === 'notifications' && (
            <div key="notifications" className="space-y-6">
              <NotificationPreferences />
            </div>
          )}

          {featureFlags.security && activeTab === 'security' && (
            <div key="security">
              <h3 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Security Settings
              </h3>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm xs:text-base">
                  Security features are currently under development
                </p>
              </div>
            </div>
          )}

          {featureFlags.accessibility && activeTab === 'accessibility' && (
            <div key="accessibility" className="space-y-6">
              <h3 className="text-base xs:text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Accessibility Options
              </h3>
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p className="text-sm xs:text-base">
                  Accessibility features are currently under development
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedParentProfile;
