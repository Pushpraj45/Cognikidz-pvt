import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import PricingService from '../../services/PricingService';

const FREE_TYPES = new Set(['general-form']);

const RequireAssessmentAccess = ({ assessmentType, children }) => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        if (FREE_TYPES.has(assessmentType)) {
          setAllowed(true);
          return;
        }

        if (!isLoggedIn) {
          toast.error('Please login to continue');
          navigate('/login');
          return;
        }

        const res = await PricingService.checkUserAccess(assessmentType);
        if (res?.hasAccess) {
          setAllowed(true);
        } else {
          toast.error('Purchase required to access this assessment');
          navigate('/pricing', {
            state: { pricingType: 'individual', blockedAssessment: assessmentType },
          });
        }
      } catch (err) {
        console.error('Access check failed:', err);
        toast.error('Unable to verify access. Please try again.');
        navigate('/pricing', { state: { pricingType: 'individual' } });
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [assessmentType, isLoggedIn, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!allowed) return null;
  return children;
};

export default RequireAssessmentAccess;
