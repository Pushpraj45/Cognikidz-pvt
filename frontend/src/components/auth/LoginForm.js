import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginForm = () => {
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-surface rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-text mb-6">Sign In</h2>

      <form className="space-y-4">
        <Input
          id="email"
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          required
        />

        <Input
          id="password"
          label="Password"
          type="password"
          placeholder="••••••••"
          showPasswordToggle={true}
          required
        />

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <div className="pt-2">
          <Button type="submit" fullWidth>
            Sign In
          </Button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;
