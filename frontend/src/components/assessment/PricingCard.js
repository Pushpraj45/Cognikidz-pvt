import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import TranslatedText from '../ui/TranslatedText';

const PricingCard = () => {
  const navigate = useNavigate();

  const handleIndividualPricing = () => {
    navigate('/pricing', { state: { pricingType: 'individual' } });
  };

  const handleComboPricing = () => {
    navigate('/pricing', { state: { pricingType: 'combo' } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="group cursor-pointer"
    >
      <div className="relative h-full">
        {/* Card glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-70 transition duration-500 dark:group-hover:opacity-100"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden h-full shadow-md group-hover:shadow-colored-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 group-hover:border-amber-500/50 dark:group-hover:border-amber-500/50">
          {/* Top wave/decoration */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md"></div>
                <div className="relative bg-amber-500/10 dark:bg-amber-500/20 w-16 h-16 rounded-full flex items-center justify-center z-10">
                  <div className="text-amber-600 dark:text-amber-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-8 h-8"
                    >
                      <path
                        d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.9 1 3 1.9 3 3V21C3 22.1 3.9 23 5 23H19C20.1 23 21 22.1 21 21V9ZM19 21H5V3H13V9H19V21Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  <TranslatedText>Pricing Options</TranslatedText>
                </h3>
                <p className="text-amber-600 dark:text-amber-400 text-sm">
                  <TranslatedText>Choose Your Plan</TranslatedText>
                </p>
              </div>
            </div>

            <p className="text-base text-gray-600 dark:text-gray-300 mb-5">
              <TranslatedText>
                Explore our flexible pricing options designed to meet your assessment needs. Choose
                individual assessments or save with our comprehensive combo packages.
              </TranslatedText>
            </p>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <CheckCircledIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <TranslatedText>Individual assessments for specific needs</TranslatedText>
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircledIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <TranslatedText>Combo packages for comprehensive evaluation</TranslatedText>
                </span>
              </li>
              <li className="flex items-start">
                <CheckCircledIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  <TranslatedText>Detailed reports and expert recommendations</TranslatedText>
                </span>
              </li>
            </ul>

            <div className="mt-auto space-y-3">
              <button
                onClick={handleIndividualPricing}
                className="w-full group/btn inline-flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-base px-6 py-3 rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <span className="font-medium">
                  <TranslatedText>Individual Pricing</TranslatedText>
                </span>
                <svg
                  className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <button
                onClick={handleComboPricing}
                className="w-full group/btn inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium text-base px-6 py-3 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
              >
                <span className="font-medium">
                  <TranslatedText>Combo Packages</TranslatedText>
                </span>
                <svg
                  className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PricingCard;
