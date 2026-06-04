import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useToast } from '../../contexts/ToastContext';

const AddChildForm = ({ onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConsent, setShowConsent] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      birthdate: '',
      gender: '',
      consent: false,
    },
  });

  const formData = watch();

  // Date validation function for children (1-16 years)
  const validateDateOfBirth = dateString => {
    if (!dateString) return 'Date of birth is required';

    const birthDate = new Date(dateString);
    const today = new Date();

    if (isNaN(birthDate.getTime())) {
      return 'Please enter a valid date';
    }

    if (birthDate > today) {
      return 'Date of birth cannot be in the future';
    }

    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    const adjustedAge =
      monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;

    if (adjustedAge < 1) {
      return 'Child must be at least 1 year old';
    }

    if (adjustedAge > 16) {
      return 'Child cannot be more than 16 years old';
    }

    return true;
  };

  const onSubmit = async data => {
    if (!showConsent) {
      setShowConsent(true);
      return;
    }

    if (!data.consent) {
      toast.error('You must agree to the consent terms to continue');
      return;
    }

    setIsSubmitting(true);
    try {
      // Process the form data to match expected format
      const childData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim() || undefined, // Don't send empty string
        dateOfBirth: data.birthdate,
        gender: data.gender,
        parental_consent: true,
      };

      await onSuccess(childData);
      toast.success('Child profile created successfully!');
    } catch (error) {
      console.error('Error adding child:', error);
      toast.error('Failed to create child profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-lg shadow-sm p-6 border border-white/20 dark:border-gray-700/50">
      <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6">
        {showConsent ? 'Consent Agreement' : 'Add Child Profile'}
      </h2>

      {showConsent ? (
        <div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-md mb-6 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
              CogniKidz Parental Consent and Data Usage Agreement
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              By agreeing to this consent form, you permit CogniKidz to collect and process
              information about your child for the purpose of developmental screening assessments.
            </p>

            <h4 className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">
              Information We Collect
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              We collect basic profile information (name, age, gender) and responses to assessment
              questions regarding behavior, learning patterns, and developmental indicators.
            </p>

            <h4 className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">
              How We Use This Information
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              This information is used to:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-3">
              <li>Generate screening reports and recommendations</li>
              <li>Track developmental progress over time</li>
              <li>Provide personalized resources relevant to your child's needs</li>
            </ul>

            <h4 className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">
              Data Security
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              All information is encrypted and stored securely. We follow industry best practices to
              protect your child's data. We do not share individual data with third parties without
              explicit additional consent.
            </p>

            <h4 className="font-medium text-sm mb-1 text-gray-900 dark:text-gray-100">
              Your Rights
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">You have the right to:</p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-3">
              <li>Access the data we hold about your child</li>
              <li>Request corrections to inaccurate information</li>
              <li>Request deletion of your child's profile and data</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              For more details, please refer to our complete{' '}
              <a href="/privacy-policy" className="text-primary dark:text-primary hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-start">
              <input
                type="checkbox"
                className="mt-1 mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
                {...register('consent', {
                  required: 'You must agree to the consent terms to continue',
                })}
              />
              <span>
                <span className="block font-medium text-sm text-gray-900 dark:text-gray-100">
                  I confirm that:
                </span>
                <span className="block text-sm text-gray-600 dark:text-gray-400">
                  I am the parent or legal guardian of this child and I consent to the collection
                  and processing of their information as described in the agreement above.
                </span>
                {errors.consent && (
                  <span className="text-danger text-xs mt-1 block">{errors.consent.message}</span>
                )}
              </span>
            </label>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => setShowConsent(false)}>
              Back
            </Button>
            <Button
              type="button"
              disabled={!formData.consent}
              isLoading={isSubmitting}
              onClick={handleSubmit(onSubmit)}
            >
              Add Child
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              id="firstName"
              label="First Name"
              {...register('firstName', {
                required: 'First name is required',
                minLength: {
                  value: 2,
                  message: 'First name must be at least 2 characters',
                },
              })}
              error={errors.firstName?.message}
            />

            <Input
              id="lastName"
              label="Last Name (Optional)"
              {...register('lastName')}
              error={errors.lastName?.message}
              helpText="Leave empty if you prefer to use only first name"
            />

            <div className="md:col-span-2">
              <Input
                id="birthdate"
                type="date"
                label="Date of Birth"
                {...register('birthdate', {
                  required: 'Date of birth is required',
                  validate: validateDateOfBirth,
                })}
                error={errors.birthdate?.message}
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
            </div>

            {/* Improved Gender Selection - Removed "Prefer not to say" */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Gender
              </label>
              <div className="grid grid-cols-3 gap-4">
                {['male', 'female', 'other'].map(genderOption => (
                  <label
                    key={genderOption}
                    className={`relative flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.gender === genderOption
                        ? 'border-primary bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <input
                      type="radio"
                      className="absolute opacity-0"
                      value={genderOption}
                      {...register('gender', {
                        required: 'Please select a gender',
                      })}
                    />
                    <span
                      className={`text-sm font-medium capitalize ${
                        formData.gender === genderOption
                          ? 'text-primary dark:text-primary'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {genderOption}
                    </span>
                    {formData.gender === genderOption && (
                      <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.gender && <p className="mt-1 text-sm text-danger">{errors.gender.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-4 mt-8">
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddChildForm;
