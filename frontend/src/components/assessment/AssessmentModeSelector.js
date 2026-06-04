import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaGamepad, FaClipboardList, FaBrain, FaEye, FaBook } from 'react-icons/fa';

const AssessmentModeSelector = ({ childData, assessmentType }) => {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState(null);

  const assessmentModes = {
    traditional: {
      title: 'Traditional Assessment',
      description: 'Question-based assessment with AI-powered adaptive questioning',
      icon: FaClipboardList,
      duration: '20-35 minutes',
      features: [
        'AI-adaptive questions',
        'Detailed analysis',
        'Comprehensive report',
        'Professional insights',
      ],
      path: '/assessment',
    },
    battery: {
      title: 'Game-Based Battery',
      description: 'Interactive games designed to assess specific cognitive domains',
      icon: FaGamepad,
      duration: '25-40 minutes',
      features: [
        'Engaging game activities',
        'Real-time progress tracking',
        'Behavioral analysis',
        'Multi-domain assessment',
      ],
      path: '/assessment/battery',
    },
  };

  const domainInfo = {
    adhd: {
      title: 'ADHD Assessment',
      icon: FaBrain,
      color: 'from-blue-500 to-indigo-600',
      domains: ['Attention', 'Impulse Control', 'Executive Function'],
      gameExamples: ['Focus Finder', 'Impulse Freeze', 'Memory Trail'],
    },
    dyslexia: {
      title: 'Dyslexia Assessment',
      icon: FaBook,
      color: 'from-green-500 to-emerald-600',
      domains: ['Phonological Processing', 'Visual Processing', 'Reading Fluency'],
      gameExamples: ['Letter Sound Matching', 'Word Completion', 'Visual Tracking'],
    },
    autism: {
      title: 'Autism Assessment',
      icon: FaEye,
      color: 'from-purple-500 to-violet-600',
      domains: ['Social Communication', 'Behavioral Patterns', 'Sensory Processing'],
      gameExamples: ['Social Scenarios', 'Pattern Recognition', 'Sensory Games'],
    },
  };

  const currentDomain = domainInfo[assessmentType] || domainInfo.adhd;

  const handleModeSelect = mode => {
    setSelectedMode(mode);
  };

  const handleStartAssessment = () => {
    if (!selectedMode) return;

    const queryParams = new URLSearchParams({
      childId: childData._id,
      type: assessmentType,
    });

    if (selectedMode === 'battery') {
      navigate(`/assessment/battery?${queryParams.toString()}`);
    } else {
      // Navigate to traditional assessment
      navigate(`/assessment?${queryParams.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${currentDomain.color} text-white mb-4`}
          >
            <currentDomain.icon className="text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentDomain.title}</h1>
          <p className="text-lg text-gray-600">
            Choose your assessment approach for {childData.firstName}
          </p>
        </motion.div>

        {/* Domain Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Assessment Domains</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {currentDomain.domains.map((domain, index) => (
              <div key={domain} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{domain}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {currentDomain.gameExamples[index]}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {Object.entries(assessmentModes).map(([key, mode]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + (key === 'battery' ? 0.1 : 0) }}
              className={`bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                selectedMode === key ? 'ring-4 ring-blue-500 shadow-xl' : 'hover:shadow-xl'
              }`}
              onClick={() => handleModeSelect(key)}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div
                    className={`p-3 rounded-lg ${
                      selectedMode === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <mode.icon className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">{mode.title}</h3>
                    <p className="text-sm text-gray-500">{mode.duration}</p>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{mode.description}</p>

                <div className="space-y-2">
                  {mode.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <div
                        className={`w-2 h-2 rounded-full mr-3 ${
                          selectedMode === key ? 'bg-blue-500' : 'bg-gray-400'
                        }`}
                      />
                      {feature}
                    </div>
                  ))}
                </div>

                {selectedMode === key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-blue-50 rounded-lg"
                  >
                    <div className="text-sm text-blue-800 font-medium">
                      ✓ Selected Assessment Mode
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      Click "Start Assessment" to begin
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Special highlight for battery mode */}
              {key === 'battery' && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2">
                  <div className="text-white text-sm font-medium text-center">
                    🎮 New Interactive Experience
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Game Preview for Battery Mode */}
        {selectedMode === 'battery' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              What to Expect in Game-Based Assessment
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-medium text-gray-900">Interactive Games</div>
                <div className="text-sm text-gray-600 mt-1">
                  Engaging activities that feel like playing games
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">📊</div>
                <div className="font-medium text-gray-900">Real-time Tracking</div>
                <div className="text-sm text-gray-600 mt-1">
                  Progress monitoring and adaptive difficulty
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-3xl mb-2">🏆</div>
                <div className="font-medium text-gray-900">Achievement System</div>
                <div className="text-sm text-gray-600 mt-1">
                  Rewards and celebrations for motivation
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Child Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment for:</h3>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {childData.firstName?.charAt(0) || 'C'}
            </div>
            <div className="ml-4">
              <div className="font-medium text-gray-900">
                {childData.firstName} {childData.lastName}
              </div>
              <div className="text-sm text-gray-600">
                Age: {Math.floor((childData.age || 96) / 12)} years old
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center space-x-4"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Dashboard
          </button>
          <button
            onClick={handleStartAssessment}
            disabled={!selectedMode}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              selectedMode
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedMode ? 'Start Assessment' : 'Select Assessment Mode'}
          </button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6 text-sm text-gray-500"
        >
          Need help choosing? The game-based assessment is more engaging for children, while the
          traditional assessment provides detailed clinical insights.
        </motion.div>
      </div>
    </div>
  );
};

export default AssessmentModeSelector;
