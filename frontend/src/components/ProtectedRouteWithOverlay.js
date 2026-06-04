import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthOverlay from './AuthOverlay';
import LogoLoader from './ui/LogoLoader';

const ProtectedRouteWithOverlay = ({ children, title, description, showLoadingSpinner = true }) => {
  const { isLoggedIn, isLoading } = useAuth();

  // Show loading while checking auth status
  if (isLoading && showLoadingSpinner) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex justify-center items-center">
        <LogoLoader size="large" message="Loading..." showMessage={true} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <AuthOverlay title={title} description={description}>
        {children}
      </AuthOverlay>
    );
  }

  return children;
};

export default ProtectedRouteWithOverlay;
