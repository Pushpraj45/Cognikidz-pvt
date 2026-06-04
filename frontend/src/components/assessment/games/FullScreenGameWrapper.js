import React, { useRef, useEffect, useState } from 'react';
import { FullScreenProvider } from '../../../contexts/FullScreenContext';
import FullScreenButton from '../../../components/ui/FullScreenButton';
import { Toaster } from 'react-hot-toast';
import PricingService from '../../../services/PricingService';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import LogoLoader from '../../ui/LogoLoader';

const FullScreenGameWrapper = ({ children, gameName = 'Game' }) => {
  const gameRef = useRef(null);
  const [targetElement, setTargetElement] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Update target element when ref is available
  useEffect(() => {
    if (gameRef.current) {
      setTargetElement(gameRef.current);
    }
  }, [gameRef.current]);

  useEffect(() => {
    const run = async () => {
      try {
        // Derive disorder from route
        const path = location.pathname.toLowerCase();
        const disorder = path.includes('/adhd/')
          ? 'adhd'
          : path.includes('/dyslexia/')
            ? 'dyslexia'
            : 'general';
        const resourceKey = `${disorder}/${gameName.replace(/\s+/g, '-').toLowerCase()}`;
        // Check then increment usage
        const check = await PricingService.checkUsage({
          resourceType: 'game',
          resourceKey,
          assessmentType: `${disorder}-game`,
        });
        if (!check?.allowed) {
          toast.error('Game attempts exhausted. Please purchase to continue.');
          navigate('/pricing', { state: { pricingType: 'individual' } });
          return;
        }
        const inc = await PricingService.incrementUsage({
          resourceType: 'game',
          resourceKey,
          assessmentType: `${disorder}-game`,
        });
        if (!inc?.allowed) {
          toast.error('Game attempts exhausted. Please purchase to continue.');
          navigate('/pricing', { state: { pricingType: 'individual' } });
          return;
        }
        setAllowed(true);
      } catch (e) {
        console.error('Game usage gating failed:', e);
        toast.error('Unable to verify game access.');
        navigate('/pricing');
      }
    };
    run();
  }, [gameName, location.pathname, navigate]);

  return allowed ? (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Main Game Container - Full Page */}
      <div ref={gameRef} className="min-h-screen glass-card overflow-auto relative">
        <FullScreenProvider autoEnter={true} targetElement={targetElement}>
          {/* Full Screen Button */}
          <FullScreenButton position="top-right" variant="primary" size="medium" showLabel={true} />

          <div className="h-full flex flex-col min-h-screen">{children}</div>

          {/* Toast container for full screen games */}
          <Toaster
            position="top-right"
            containerStyle={{
              zIndex: 99999,
            }}
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                fontSize: '14px',
                fontWeight: '500',
                zIndex: 99999,
              },
              success: {
                style: {
                  background: '#D1FAE5',
                  color: '#047857',
                  border: '1px solid #10B981',
                },
              },
              error: {
                style: {
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #F59E0B',
                },
              },
            }}
          />
        </FullScreenProvider>
      </div>
    </div>
  ) : (
    <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center">
      <LogoLoader size="large" message="Preparing game..." showMessage={true} />
    </div>
  );
};

export default FullScreenGameWrapper;
