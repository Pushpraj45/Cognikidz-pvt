import React, { useState } from 'react';
import InteractiveScaleOptions from './InteractiveScaleOptions';

const InteractiveScaleOptionsDemo = () => {
  const [selectedValue, setSelectedValue] = useState(null);
  const [selectedValue2, setSelectedValue2] = useState(null);

  const handleSelect = value => {
    setSelectedValue(value);
    console.log('Selected value:', value);
  };

  const handleSelect2 = value => {
    setSelectedValue2(value);
    console.log('Selected value 2:', value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Interactive Scale Options Demo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Beautiful, engaging number-based options for assessment questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Default Scale Options */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              Default Scale (Never → Always)
            </h2>
            <InteractiveScaleOptions
              options={['1', '2', '3', '4', '5']}
              optionLabels={['Never', 'Rarely', 'Sometimes', 'Often', 'Always']}
              selectedValue={selectedValue}
              onSelect={handleSelect}
            />
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selected:{' '}
                {selectedValue
                  ? `${selectedValue} - ${['Never', 'Rarely', 'Sometimes', 'Often', 'Always'][parseInt(selectedValue) - 1]}`
                  : 'None'}
              </p>
            </div>
          </div>

          {/* Custom Scale Options */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">
              Custom Scale (Poor → Excellent)
            </h2>
            <InteractiveScaleOptions
              options={['1', '2', '3', '4', '5']}
              optionLabels={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']}
              selectedValue={selectedValue2}
              onSelect={handleSelect2}
            />
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selected:{' '}
                {selectedValue2
                  ? `${selectedValue2} - ${['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][parseInt(selectedValue2) - 1]}`
                  : 'None'}
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Interactive Design
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Smooth animations, hover effects, and visual feedback for better user engagement
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Accessible
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Clear visual hierarchy, proper contrast, and intuitive interaction patterns
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                Customizable
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Easy to customize labels, colors, and behavior for different assessment types
              </p>
            </div>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-16 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
            Usage Examples
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Basic Usage
              </h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {`<InteractiveScaleOptions
  options={["1", "2", "3", "4", "5"]}
  optionLabels={["Never", "Rarely", "Sometimes", "Often", "Always"]}
  selectedValue={response}
  onSelect={handleResponse}
/>`}
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                Custom Labels
              </h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {`<InteractiveScaleOptions
  options={["1", "2", "3", "4", "5"]}
  optionLabels={["Poor", "Fair", "Good", "Very Good", "Excellent"]}
  selectedValue={rating}
  onSelect={handleRating}
/>`}
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
                With Styling
              </h3>
              <pre className="bg-gray-800 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                {`<InteractiveScaleOptions
  options={["1", "2", "3", "4", "5"]}
  optionLabels={["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]}
  selectedValue={agreement}
  onSelect={handleAgreement}
  className="max-w-3xl mx-auto"
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveScaleOptionsDemo;
