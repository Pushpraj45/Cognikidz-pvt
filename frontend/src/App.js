import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ReportsProvider } from './contexts/ReportsContext';
import ScrollAnimationController from './components/ui/ScrollAnimationController';
import ScrollToTop from './components/ui/ScrollToTop';
import MetaHead from './components/ui/MetaHead';
import GlobalTranslationWrapper from './components/ui/GlobalTranslationWrapper';
import TranslationLoader from './components/ui/TranslationLoader';
import { testEnvironment, testApiConnection } from './utils/envTest';
import './styles/glassmorphism.css';

function App() {
  // Debug environment and API connection
  React.useEffect(() => {
    testEnvironment();
    testApiConnection();
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <LanguageProvider>
              <ReportsProvider>
                <BrowserRouter>
                  <ScrollToTop />
                  <MetaHead />
                  <TranslationLoader />
                  <GlobalTranslationWrapper>
                    <div className="min-h-screen bg-background dark:bg-dark-background text-text dark:text-dark-text transition-colors duration-300">
                      <AppRoutes />
                      <ScrollAnimationController />
                      {/* React Hot Toast - for game notifications */}
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
                    </div>
                  </GlobalTranslationWrapper>
                </BrowserRouter>
              </ReportsProvider>
            </LanguageProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
