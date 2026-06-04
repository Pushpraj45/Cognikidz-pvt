import React from 'react';

const AuthLayout = ({ children, title }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {title && (
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-text tracking-tight">{title}</h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
