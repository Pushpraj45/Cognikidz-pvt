import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

const LegalModal = ({ isOpen, onClose, type }) => {
  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Privacy Policy',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Information We Collect
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We collect information you provide directly to us, such as when you create an
                  account, complete an assessment, or contact us for support.
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Personal information (name, email address, phone number)</li>
                  <li>Child information (age, assessment responses)</li>
                  <li>Usage data and analytics</li>
                  <li>Device and browser information</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  How We Use Your Information
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Provide and improve our assessment services</li>
                  <li>Generate personalized reports and recommendations</li>
                  <li>Communicate with you about your account and services</li>
                  <li>Ensure platform security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Data Security
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We implement industry-standard security measures to protect your information,
                  including encryption, secure servers, and regular security audits. All assessment
                  data is encrypted both in transit and at rest.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  HIPAA Compliance
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our platform adheres to HIPAA guidelines for the protection of health information.
                  We maintain appropriate safeguards to ensure the privacy and security of personal
                  health information.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Your Rights
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Download your data</li>
                  <li>Opt out of communications</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Contact Us
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  If you have questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:cognikidzcare@gmail.com" className="text-primary hover:underline">
                    cognikidzcare@gmail.com
                  </a>
                </p>
              </div>
            </div>
          ),
        };
      case 'terms':
        return {
          title: 'Terms of Service',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Acceptance of Terms
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  By accessing and using CogniKidz, you accept and agree to be bound by the terms
                  and provision of this agreement.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Use License
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Permission is granted to temporarily access CogniKidz for personal, non-commercial
                  transitory viewing only. This is the grant of a license, not a transfer of title,
                  and under this license you may not:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Modify or copy the materials</li>
                  <li>Use the materials for commercial purposes or for public display</li>
                  <li>Attempt to reverse engineer any software contained on the platform</li>
                  <li>Remove any copyright or proprietary notations from the materials</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Assessment Disclaimer
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our assessments are screening tools designed to identify potential areas of
                  concern. They are not diagnostic instruments and should not replace professional
                  medical or psychological evaluation. Always consult with qualified healthcare
                  professionals for diagnosis and treatment.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  User Account Responsibilities
                </h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Use the platform only for its intended purposes</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Limitation of Liability
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  CogniKidz shall not be liable for any damages arising from the use or inability to
                  use the platform, including but not limited to direct, indirect, incidental,
                  punitive, and consequential damages.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Modifications
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  CogniKidz may revise these terms at any time without notice. By using this
                  platform, you agree to be bound by the current version of these terms.
                </p>
              </div>
            </div>
          ),
        };
      case 'cookies':
        return {
          title: 'Cookie Policy',
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  What Are Cookies
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Cookies are small text files that are stored on your device when you visit our
                  website. They help us provide you with a better experience by remembering your
                  preferences and understanding how you use our platform.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Types of Cookies We Use
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-text dark:text-dark-text mb-2">
                      Essential Cookies
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      These cookies are necessary for the website to function and cannot be switched
                      off. They enable core functionality such as security, network management, and
                      accessibility.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-text dark:text-dark-text mb-2">
                      Performance Cookies
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      These cookies help us understand how visitors interact with our website by
                      collecting and reporting information anonymously.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-text dark:text-dark-text mb-2">
                      Functional Cookies
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      These cookies allow the website to remember choices you make and provide
                      enhanced, more personal features.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Managing Cookies
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  You can control and/or delete cookies as you wish. You can delete all cookies that
                  are already on your computer and you can set most browsers to prevent them from
                  being placed. However, if you do this, you may have to manually adjust some
                  preferences every time you visit a site.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Third-Party Cookies
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We may use third-party services that place cookies on your device to help us
                  analyze website usage and improve our services. These third parties have their own
                  privacy policies regarding their use of such cookies.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3 text-text dark:text-dark-text">
                  Updates to This Policy
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  We may update this Cookie Policy from time to time to reflect changes in
                  technology or legal requirements. Please check this page periodically for updates.
                </p>
              </div>
            </div>
          ),
        };
      default:
        return { title: '', content: null };
    }
  };

  const { title, content } = getContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Enhanced backdrop with blur and glassmorphism effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Glassmorphism background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-40 animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-accent/15 rounded-full blur-2xl opacity-50"></div>
          </div>

          {/* Modal content with glassmorphism */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden"
          >
            {/* Glassmorphism card */}
            <div className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
              {/* Header with glassmorphism */}
              <div className="flex items-center justify-between p-6 border-b border-white/20 dark:border-gray-700/30 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                <h2 className="text-2xl font-bold text-text dark:text-dark-text bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 dark:hover:bg-gray-700/20 rounded-full transition-all duration-200 backdrop-blur-sm border border-white/10 dark:border-gray-600/20"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Content with glassmorphism scrollbar */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] backdrop-blur-sm">
                <div className="glassmorphism-card rounded-xl p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md border border-white/20 dark:border-gray-700/20">
                  {content}
                </div>
              </div>

              {/* Footer with glassmorphism */}
              <div className="flex justify-end p-6 border-t border-white/20 dark:border-gray-700/30 backdrop-blur-sm bg-white/30 dark:bg-gray-800/30">
                <Button
                  onClick={onClose}
                  variant="primary"
                  className="backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;
