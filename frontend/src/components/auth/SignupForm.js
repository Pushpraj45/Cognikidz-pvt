import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';

const SignupForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');

  // Check password confirmation status for real-time feedback
  const getPasswordConfirmationStatus = () => {
    if (!confirmPassword) return null; // No feedback when confirm password is empty
    if (!password) return null; // No feedback when original password is empty
    return password === confirmPassword;
  };

  const passwordMatch = getPasswordConfirmationStatus();

  const onSubmit = async data => {
    try {
      setIsSubmitting(true);
      // Simulating API call
      console.log('Form data submitted:', data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Account created successfully! Please check your email for verification.');
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-surface rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-text mb-6">Create Your Account</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="name"
          label="Full Name"
          type="text"
          placeholder="John Doe"
          required
          {...register('name', {
            required: 'Name is required',
            minLength: {
              value: 2,
              message: 'Name should be at least 2 characters',
            },
          })}
          error={errors.name?.message}
        />

        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          required
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
          error={errors.email?.message}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          showPasswordToggle={true}
          required
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 8,
              message: 'Password must be at least 8 characters',
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
              message:
                'Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&)',
            },
          })}
          error={errors.password?.message}
        />

        <div>
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            showPasswordToggle={true}
            required
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: value => value === password || 'Passwords do not match',
            })}
            error={errors.confirmPassword?.message}
          />

          {/* Real-time password confirmation feedback */}
          {passwordMatch !== null && (
            <div className="mt-2">
              {passwordMatch ? (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <TranslatedText>Password matches</TranslatedText>
                </p>
              ) : (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <TranslatedText>Password doesn't match</TranslatedText>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="pt-2">
          <Button type="submit" fullWidth isLoading={isSubmitting}>
            <TranslatedText>Create Account</TranslatedText>
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          <TranslatedText>Already have an account?</TranslatedText>{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            <TranslatedText>Sign in</TranslatedText>
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignupForm;
