import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate, useLocation } from 'react-router-dom';

const GoogleOAuthButton = ({ className = '', disabled = false }) => {
  const { googleLogin } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleGoogleSuccess = async credentialResponse => {
    try {
      await googleLogin(credentialResponse.credential);
      success('Successfully signed in with Google!');
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Google sign-in failed';
      showError(errorMessage);
    }
  };

  const handleGoogleError = () => {
    console.error('Google login failed');
    showError('Google sign-in was cancelled or failed');
  };

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div className="w-full max-w-sm">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          useOneTap={false}
          disabled={disabled}
          size="large"
          text="continue_with"
          shape="rectangular"
          theme="outline"
          style={{
            width: '100%',
            height: '44px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      </div>
    </div>
  );
};

export default GoogleOAuthButton;
