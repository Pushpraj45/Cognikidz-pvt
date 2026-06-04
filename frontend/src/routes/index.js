import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChildProfileForm from '../components/ChildProfileForm';
import EmailVerification from '../components/EmailVerification';

// Define ProtectedRoute component inline since it's not exported from AppRoutes
const ProtectedRoute = ({ children, redirectPath = '/login' }) => {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
};

// Export routes array to be used in the main router configuration
const childRoutes = [
  {
    path: '/children',
    element: <Navigate to="/profile" replace />,
  },
  {
    path: '/children/add',
    element: (
      <ProtectedRoute>
        <ChildProfileForm isEdit={false} />
      </ProtectedRoute>
    ),
  },
  {
    path: '/children/:childId/edit',
    element: (
      <ProtectedRoute>
        <ChildProfileForm isEdit={true} />
      </ProtectedRoute>
    ),
  },
];

export default childRoutes;
