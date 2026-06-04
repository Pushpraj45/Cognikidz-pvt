import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import PricingService from '../../services/PricingService';

const RequireUsage = ({ resourceType, resourceKey, assessmentType, children }) => {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        if (!isLoggedIn) {
          toast.error('Please login to continue');
          navigate('/login');
          return;
        }

        // Temporarily disable usage checks due to API issues
        // Only check if user has access to the assessment
        try {
          const access = await PricingService.checkUserAccess(assessmentType);
          if (access?.success && access?.hasAccess) {
            console.log('User has access, allowing entry');
            setAllowed(true);
            return;
          } else {
            toast.error('Purchase required to access this assessment');
            navigate('/pricing', { state: { pricingType: 'individual' } });
            return;
          }
        } catch (accessErr) {
          console.error('Access check failed:', accessErr);
          toast.error('Unable to verify access. Please try again.');
          navigate('/pricing');
          return;
        }
      } catch (err) {
        console.error('Usage check failed:', err);
        toast.error('Unable to verify usage. Please try again.');
        navigate('/pricing');
      } finally {
        setChecking(false);
      }
    };
    run();
  }, [resourceType, resourceKey, assessmentType, isLoggedIn, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">Preparing assessment...</p>
        </div>
      </div>
    );
  }
  if (!allowed) return null;
  return children;
};

export default RequireUsage;
