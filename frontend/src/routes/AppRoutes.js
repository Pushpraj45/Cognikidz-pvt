import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/ui/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import ProtectedRouteWithOverlay from '../components/ProtectedRouteWithOverlay';
import AdminRoute from '../components/AdminRoute';
import PricingManagement from '../components/admin/PricingManagement';
import LandingPage from '../pages/LandingPage';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import EmailVerification from '../pages/EmailVerification';
import Blog from '../pages/Blog';
import ArticleDetail from '../components/blog/ArticleDetail';
import ArticleForm from '../components/blog/ArticleForm';
import SavedArticles from '../pages/SavedArticles';
import Support from '../pages/Support';
import Assessment from '../pages/Assessment';
// Import assessment components directly
import AssessmentComplete from '../components/assessment/AssessmentComplete';
import AssessmentPaused from '../components/assessment/AssessmentPaused';
import IntakePage from '../pages/IntakePage';

import Pricing from '../pages/Pricing';
import ParentProfilePage from '../pages/ParentProfilePage';
import ChildProfilePage from '../pages/ChildProfilePage';
import ReportsPage from '../pages/ReportsPage';
import ChildDetailsPage from '../pages/ChildDetailsPage';
import FeedbackPage from '../pages/FeedbackPage';
import FeedbackViewerPage from '../pages/FeedbackViewerPage';
import ProgressPage from '../pages/ProgressPage';
// import PrivateRoute from '../components/auth/PrivateRoute';
// import DataVisualization from '../components/dashboard/DataVisualization';
// import { Subscription } from '../components/subscription/Subscription';

// Import disorder-specific forms
import ADHDForm from '../components/assessment/forms/ADHDForm';
import AutismForm from '../components/assessment/forms/AutismForm';
import DyslexiaForm from '../components/assessment/forms/DyslexiaForm';
import GeneralForm from '../components/assessment/forms/GeneralForm';
import RequireAssessmentAccess from '../components/auth/RequireAssessmentAccess';
import RequireUsage from '../components/auth/RequireUsage';
// import { FADE_UP } from '../utils/animations';

// Import multimedia assessment components
import MultimediaAssessmentForm from '../components/assessment/multimedia/MultimediaAssessmentForm';
import MultimediaAssessmentSession from '../components/assessment/multimedia/MultimediaAssessmentSession';
import MultimediaAssessmentResults from '../components/assessment/multimedia/MultimediaAssessmentResults';
// Removing deleted game component imports
// import RhymeTimeChallenge from '../components/assessment/multimedia/games/RhymeTimeChallenge';
// import LetterMatchMaster from '../components/assessment/multimedia/games/LetterMatchMaster';
// import StoryTimeAdventure from '../components/assessment/multimedia/games/StoryTimeAdventure';

// Import LogoLoader component
import LogoLoader from '../components/ui/LogoLoader';

// Import game assessment routes
import gameAssessmentRoutes from './gameAssessmentRoutes';

// Import the new battery assessment manager
import BatteryAssessmentManager from '../components/assessment/BatteryAssessmentManager';
import AssessmentModeSelector from '../components/assessment/AssessmentModeSelector';

// Layout wrapper for page transitions
const PageTransition = ({ children }) => {
  // Temporarily disable page transitions to fix stacking issue
  return <div className="page-wrapper">{children}</div>;
};

const AppRoutes = () => {
  const { isLoggedIn, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-dark-background flex justify-center items-center">
        <LogoLoader size="large" message="Loading..." showMessage={true} />
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'relative', 
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      <PageTransition>
        <Layout key={location.pathname}>
          <Routes location={location}>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />

          {/* Demo Mode Route - accessible without login */}
          <Route path="/dashboard-demo" element={<Dashboard demoMode={true} />} />

          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login />}
          />

          <Route
            path="/signup"
            element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Signup />}
          />

          {/* Auth related routes */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<EmailVerification />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/email-verification" element={<EmailVerification />} />

          {/* Public Pages */}
          <Route path="/support" element={<Support />} />
          <Route path="/faq" element={<Navigate to="/support" replace />} />
          <Route path="/contact" element={<Navigate to="/support" replace />} />
          <Route
            path="/blog"
            element={
              <ProtectedRouteWithOverlay
                title="Unlock Our Resources"
                description="Access expert articles, tips, and insights from child development specialists. Join our community to get the guidance you need."
              >
                <Blog />
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/blog/:articleId"
            element={
              <ProtectedRouteWithOverlay
                title="Premium Content"
                description="This article contains valuable insights for parents. Create your free account to read the full content and access our resource library."
              >
                <ArticleDetail />
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/saved-articles"
            element={
              <ProtectedRouteWithOverlay
                title="Saved Articles"
                description="Access your saved articles, bookmarks, and personalized content library. Login to manage your learning materials."
              >
                <SavedArticles />
              </ProtectedRouteWithOverlay>
            }
          />

          <Route path="/pricing" element={<Pricing />} />

          {/* Feedback Routes - Public Access */}
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/feedback-responses" element={<FeedbackViewerPage />} />

          {/* Intake & Assessment Routes */}
          <Route
            path="/intake"
            element={
              <ProtectedRouteWithOverlay
                title="Child Assessment Intake"
                description="Start your child's assessment journey with our comprehensive intake process. Login to begin the evaluation."
              >
                <IntakePage />
              </ProtectedRouteWithOverlay>
            }
          />

          {/* Consolidated Assessment Routes */}
          <Route
            path="/assessment/paused"
            element={
              <ProtectedRouteWithOverlay
                title="Resume Assessment"
                description="Continue your child's assessment from where you left off. Your progress has been saved."
              >
                <Assessment>
                  <AssessmentPaused />
                </Assessment>
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment/complete"
            element={
              <ProtectedRouteWithOverlay
                title="Assessment Complete"
                description="View your child's assessment results and personalized recommendations."
              >
                <Assessment>
                  <AssessmentComplete />
                </Assessment>
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment-complete/:sessionId"
            element={
              <ProtectedRouteWithOverlay
                title="Assessment Results"
                description="Your assessment is complete! Login to view detailed results and get personalized recommendations for your child."
              >
                <Assessment>
                  <AssessmentComplete />
                </Assessment>
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment/:sessionId"
            element={
              <ProtectedRouteWithOverlay
                title="Continue Assessment"
                description="Continue with your child's assessment session. Your responses help us provide better insights."
              >
                <Assessment />
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment"
            element={
              <ProtectedRouteWithOverlay
                title="Child Development Assessment"
                description="Get professional insights into your child's development with our comprehensive assessment tools. Create your account to get started."
              >
                <Assessment />
              </ProtectedRouteWithOverlay>
            }
          />

          {/* Reports Routes */}
          <Route
            path="/reports/:reportId"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          {/* Multimedia Assessment Form Routes */}
          <Route
            path="/assessment/autism-multimedia/form/:childId"
            element={
              <ProtectedRouteWithOverlay
                title="Autism Multimedia Assessment"
                description="Interactive video and game-based autism assessment with social scenarios and emotion recognition activities."
              >
                <MultimediaAssessmentForm assessmentType="autism-multimedia" />
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment/adhd-multimedia/form/:childId"
            element={
              <ProtectedRouteWithOverlay
                title="ADHD Interactive Assessment"
                description="Interactive attention games and reaction time tests designed specifically for ADHD evaluation."
              >
                <MultimediaAssessmentForm assessmentType="adhd-multimedia" />
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment/dyslexia-multimedia/form/:childId"
            element={
              <ProtectedRouteWithOverlay
                title="Dyslexia Interactive Assessment"
                description="Interactive reading games and phonics activities for comprehensive dyslexia evaluation."
              >
                <MultimediaAssessmentForm assessmentType="dyslexia-multimedia" />
              </ProtectedRouteWithOverlay>
            }
          />

          {/* Multimedia Assessment Session Routes */}
          <Route
            path="/assessment/multimedia/:sessionId"
            element={
              <ProtectedRouteWithOverlay
                title="Multimedia Interactive Assessment"
                description="Continue with your multimedia assessment session."
              >
                <MultimediaAssessmentSession />
              </ProtectedRouteWithOverlay>
            }
          />

          {/* Multimedia Assessment Session - Full Screen (No Overlay) */}
          <Route
            path="/assessment/multimedia/session/:sessionId"
            element={
              <ProtectedRoute>
                <MultimediaAssessmentSession />
              </ProtectedRoute>
            }
          />

          {/* Multimedia Assessment Results Route */}
          <Route
            path="/assessment/multimedia/results"
            element={
              <ProtectedRoute>
                <MultimediaAssessmentResults />
              </ProtectedRoute>
            }
          />

          {/* New Assessment Form Routes */}
          <Route
            path="/assessment/adhd/form/:childId"
            element={
              <ProtectedRouteWithOverlay
                title="ADHD Assessment"
                description="Take our specialized ADHD assessment to better understand your child's attention and behavior patterns."
              >
                <RequireAssessmentAccess assessmentType="adhd-form">
                  <RequireUsage
                    resourceType="assessment"
                    resourceKey="adhd-form"
                    assessmentType="adhd-form"
                  >
                    <ADHDForm />
                  </RequireUsage>
                </RequireAssessmentAccess>
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment/autism/form/:childId"
            element={
              <ProtectedRouteWithOverlay
                title="Autism Spectrum Assessment"
                description="Our autism assessment helps identify key developmental patterns and provides valuable insights."
              >
                <RequireAssessmentAccess assessmentType="autism-form">
                  <RequireUsage
                    resourceType="assessment"
                    resourceKey="autism-form"
                    assessmentType="autism-form"
                  >
                    <AutismForm />
                  </RequireUsage>
                </RequireAssessmentAccess>
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment/dyslexia/form/:childId"
            element={
              <ProtectedRouteWithOverlay
                title="Dyslexia Assessment"
                description="Evaluate reading and learning patterns with our comprehensive dyslexia assessment tool."
              >
                <RequireAssessmentAccess assessmentType="dyslexia-form">
                  <RequireUsage
                    resourceType="assessment"
                    resourceKey="dyslexia-form"
                    assessmentType="dyslexia-form"
                  >
                    <DyslexiaForm />
                  </RequireUsage>
                </RequireAssessmentAccess>
              </ProtectedRouteWithOverlay>
            }
          />
          <Route
            path="/assessment/general/form/:childId"
            element={
              <ProtectedRouteWithOverlay
                title="General Development Assessment"
                description="Get a comprehensive overview of your child's development across multiple areas."
              >
                <RequireAssessmentAccess assessmentType="general-form">
                  <RequireUsage
                    resourceType="assessment"
                    resourceKey="general-form"
                    assessmentType="general-form"
                  >
                    <GeneralForm />
                  </RequireUsage>
                </RequireAssessmentAccess>
              </ProtectedRouteWithOverlay>
            }
          />

          {/* Blog Routes - Protected */}
          <Route
            path="/blog/new"
            element={
              <ProtectedRoute>
                <ArticleForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/blog/edit/:articleId"
            element={
              <ProtectedRoute>
                <ArticleForm isEditing={true} />
              </ProtectedRoute>
            }
          />

          {/* Blog Routes - Admin Only */}
          <Route
            path="/blog/pending"
            element={
              <AdminRoute>
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold mb-4">No Pending Articles</h2>
                  <p className="text-gray-600">All articles are published immediately.</p>
                </div>
              </AdminRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/pricing"
            element={
              <AdminRoute>
                <PricingManagement />
              </AdminRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/parent-profile"
            element={
              <ProtectedRoute>
                <ParentProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Child Profile Routes */}
          <Route
            path="/add-child"
            element={
              <ProtectedRoute>
                <ChildProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-child/:childId"
            element={
              <ProtectedRoute>
                <ChildProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/child/:childId"
            element={
              <ProtectedRoute>
                <ChildDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/children"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Game Assessment Routes */}
          <Route path="/assessment/games/*" element={<Routes>{gameAssessmentRoutes}</Routes>} />

          {/* Assessment Mode Selector */}
          <Route path="/assessment/select" element={<AssessmentModeSelector />} />

          {/* Add battery assessment route (insert this with other assessment routes) */}
          <Route path="/assessment/battery" element={<BatteryAssessmentManager />} />

          {/* Progress Page Route */}
          <Route path="/progress" element={<ProgressPage />} />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Layout>
      </PageTransition>
    </div>
  );
};

export default AppRoutes;
