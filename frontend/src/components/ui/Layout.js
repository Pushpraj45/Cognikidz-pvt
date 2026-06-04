import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import ScrollProgressBar from './ScrollProgressBar';
import { Link } from 'react-router-dom';
import { TwitterLogoIcon, LinkedInLogoIcon } from '@radix-ui/react-icons';
import LegalModal from './LegalModal';
import TranslatedText from './TranslatedText';

// Instagram icon component since it's not in radix-ui
const InstagramIcon = ({ className }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.017 0C8.396 0 7.989.013 6.756.072 5.526.13 4.718.333 4.018.63a5.848 5.848 0 0 0-2.134 1.383A5.848 5.848 0 0 0 .501 4.147c-.297.7-.5 1.508-.558 2.738C-.057 7.989-.044 8.396-.044 12.017c0 3.621-.013 4.028.072 5.261.058 1.23.261 2.038.558 2.738a5.848 5.848 0 0 0 1.383 2.134 5.848 5.848 0 0 0 2.134 1.383c.7.297 1.508.5 2.738.558 1.233.059 1.64.072 5.261.072 3.621 0 4.028-.013 5.261-.072 1.23-.058 2.038-.261 2.738-.558a5.848 5.848 0 0 0 2.134-1.383 5.848 5.848 0 0 0 1.383-2.134c.297-.7.5-1.508.558-2.738.059-1.233.072-1.64.072-5.261 0-3.621.013-4.028-.072-5.261-.058-1.23-.261-2.038-.558-2.738a5.848 5.848 0 0 0-1.383-2.134A5.848 5.848 0 0 0 19.982.63c-.7-.297-1.508-.5-2.738-.558C16.011.013 15.604 0 12.017 0zM12.017 2.167c3.555 0 3.979.014 5.386.071 1.3.059 2.006.277 2.477.458a4.14 4.14 0 0 1 1.536.998 4.14 4.14 0 0 1 .998 1.536c.181.471.399 1.177.458 2.477.057 1.407.071 1.831.071 5.386 0 3.555-.014 3.979-.071 5.386-.059 1.3-.277 2.006-.458 2.477a4.14 4.14 0 0 1-.998 1.536 4.14 4.14 0 0 1-1.536.998c-.471.181-1.177.399-2.477.458-1.407.057-1.831.071-5.386.071-3.555 0-3.979-.014-5.386-.071-1.3-.059-2.006-.277-2.477-.458a4.14 4.14 0 0 1-1.536-.998 4.14 4.14 0 0 1-.998-1.536c-.181-.471-.399-1.177-.458-2.477-.057-1.407-.071-1.831-.071-5.386 0-3.555.014-3.979.071-5.386.059-1.3.277-2.006.458-2.477a4.14 4.14 0 0 1 .998-1.536 4.14 4.14 0 0 1 1.536-.998c.471-.181 1.177-.399 2.477-.458 1.407-.057 1.831-.071 5.386-.071zm0 3.683a6.167 6.167 0 1 0 0 12.334 6.167 6.167 0 0 0 0-12.334zm0 10.167a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.83-10.45a1.441 1.441 0 1 1-2.883 0 1.441 1.441 0 0 1 2.883 0z" />
  </svg>
);

// Footer component to be shared across pages
const Footer = () => {
  const [modalState, setModalState] = useState({ isOpen: false, type: null });

  const openModal = type => {
    setModalState({ isOpen: true, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  return (
    <>
      <footer className="relative overflow-hidden">
        {/* Glowing background effect */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -inset-[50%] bg-primary/20 rounded-full blur-3xl opacity-40 animate-slow-pulse"></div>
          <div className="absolute -right-[25%] -top-[25%] -bottom-[25%] w-1/2 bg-primary/20 rounded-full blur-3xl opacity-20 animate-slow-pulse-delay"></div>
          <div className="absolute -left-[25%] -bottom-[25%] w-1/2 bg-primary/30 rounded-full blur-3xl opacity-30 animate-slow-pulse"></div>
        </div>

        <div className="relative z-10 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-t border-white/20 dark:border-gray-800/20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <img src="/LOGO.png" alt="CogniKidz Logo" className="h-10 w-auto" />
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 dark:from-primary-400 dark:to-purple-400">
                    CogniKidz
                  </h3>
                </div>
                <p className="mb-4 max-w-md text-gray-700 dark:text-gray-300">
                  <TranslatedText k="footer.tagline" />
                </p>
                <div className="flex space-x-6">
                  <a
                    href="https://x.com/aman1011011"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                  >
                    <span className="sr-only">Twitter</span>
                    <TwitterLogoIcon className="h-6 w-6 scale-125" />
                  </a>
                  <a
                    href="https://www.instagram.com/devendra.sahu._?igsh=aGtpd3Q5dWhhbjkx"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                  >
                    <span className="sr-only">Instagram</span>
                    <InstagramIcon className="h-6 w-6" />
                  </a>
                  <a
                    href="https://www.linkedin.com/in/pushpraj-dubey-915aa4226/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                  >
                    <span className="sr-only">LinkedIn</span>
                    <LinkedInLogoIcon className="h-6 w-6 scale-125" />
                  </a>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  <TranslatedText k="footer.quick_links" />
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/assessments"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                    >
                      <TranslatedText k="nav.assessments" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/pricing"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                    >
                      <TranslatedText k="nav.pricing" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/blog"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                    >
                      <TranslatedText k="nav.resources" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                    >
                      <TranslatedText k="nav.contact" />
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faq"
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300"
                    >
                      <TranslatedText k="nav.faq" />
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  <TranslatedText k="footer.legal" />
                </h3>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => openModal('privacy')}
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300 text-left"
                    >
                      <TranslatedText k="footer.privacy" />
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openModal('terms')}
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300 text-left"
                    >
                      <TranslatedText k="footer.terms" />
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => openModal('cookies')}
                      className="text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors duration-300 text-left"
                    >
                      <TranslatedText k="footer.cookies" />
                    </button>
                  </li>
                </ul>
                <div className="mt-6 flex flex-wrap gap-2">
                  <div className="bg-gradient-to-r from-primary to-purple-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
                    HIPAA-Ready
                  </div>
                  <div className="bg-gradient-to-r from-primary to-purple-600 px-3 py-1 rounded-lg text-xs font-semibold text-white shadow-lg">
                    GDPR-Compliant
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/20 dark:border-gray-800/20 pt-8 text-center text-sm text-gray-700 dark:text-gray-300">
              <p>
                &copy; {new Date().getFullYear()} CogniKidz, Inc.{' '}
                <TranslatedText k="footer.all_rights" />
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      <LegalModal isOpen={modalState.isOpen} onClose={closeModal} type={modalState.type} />
    </>
  );
};

// Main Layout component that wraps all pages
const Layout = ({ children }) => {
  const location = useLocation();

  // Check if current path is a multimedia assessment session, results, or game (full-screen mode)
  const isFullScreenAssessment =
    location.pathname.includes('/assessment/multimedia/session/') ||
    location.pathname.includes('/assessment/multimedia/results') ||
    location.pathname.includes('/assessment/games/') ||
    location.pathname.startsWith('/assessment/games') ||
    (location.pathname.includes('/assessment/') && location.state?.triggerFullScreen);

  return (
    <div className="min-h-screen flex flex-col bg-background dark:bg-dark-background">
      {!isFullScreenAssessment && <Navbar />}
      {!isFullScreenAssessment && <ScrollProgressBar />}
      <main className="flex-grow">{children}</main>
      {!isFullScreenAssessment && <Footer />}
    </div>
  );
};

export default Layout;
