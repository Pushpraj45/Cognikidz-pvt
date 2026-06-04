import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LogoLoader from './ui/LogoLoader';

const AdminRoute = ({ children, redirectPath = '/dashboard' }) => {
  const { currentUser, isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex justify-center items-center">
        <LogoLoader size="large" message="Loading..." showMessage={true} />
      </div>
    );
  }

  if (!isLoggedIn || currentUser?.role !== 'admin') {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
};

export default AdminRoute;
