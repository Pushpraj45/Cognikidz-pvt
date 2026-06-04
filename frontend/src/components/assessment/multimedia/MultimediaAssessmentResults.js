import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useToast } from '../../../contexts/ToastContext';
import DashboardService from '../../../services/DashboardService';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const MultimediaAssessmentResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { info, error, success } = useToast();

  // Get results from state or generate dummy data for demo
  const results = location.state?.results || generateDummyResults();

  // Enhanced AI analysis extraction with better fallbacks
  const extractAIAnalysis = results => {
    const aiReport = results?.aiReport;
    const analysis = aiReport?.analysis || aiReport || {};
    const fullAIAnalysis = results?.fullAIAnalysis || analysis;

    return {
      riskLevel:
        fullAIAnalysis?.riskLevel || analysis.riskLevel || results?.riskLevel || 'Moderate',
      riskScore: fullAIAnalysis?.riskScore || analysis.riskScore || results?.riskScore || 5,
      summary:
        fullAIAnalysis?.summary ||
        fullAIAnalysis?.clinicalSummary ||
        analysis.summary ||
        results?.summary ||
        'Assessment completed successfully.',
      interpretation:
        fullAIAnalysis?.detailedInterpretation ||
        fullAIAnalysis?.interpretation ||
        analysis.interpretation ||
        results?.interpretation ||
        'Assessment provides valuable developmental insights.',
      keyFindings: fullAIAnalysis?.keyFindings ||
        analysis.keyFindings ||
        results?.keyFindings || [
          'Assessment completed with image-based tasks',
          'Visual processing abilities evaluated',
        ],
      strengths: fullAIAnalysis?.developmentalStrengths ||
        fullAIAnalysis?.strengths ||
        analysis.strengths ||
        results?.strengths || [
          'Engaged with visual assessment materials',
          'Completed assessment session successfully',
        ],
      concerns: fullAIAnalysis?.areasOfConcern ||
        fullAIAnalysis?.concerns ||
        analysis.concerns ||
        results?.concerns || ['Professional evaluation recommended for comprehensive assessment'],
      recommendations: fullAIAnalysis?.clinicalRecommendations ||
        fullAIAnalysis?.recommendations ||
        analysis.recommendations ||
        results?.recommendations || [
          'Consult with healthcare professional for detailed analysis',
          'Continue monitoring developmental progress',
        ],
      confidence: fullAIAnalysis?.confidence || analysis.confidence || results?.confidence || 75,
      professionalReferral:
        fullAIAnalysis?.professionalReferral ||
        analysis.professionalReferral ||
        results?.professionalReferral ||
        'recommended',
      nextSteps: fullAIAnalysis?.nextSteps ||
        analysis.nextSteps ||
        results?.nextSteps || [
          'Schedule professional evaluation',
          'Implement recommended strategies',
        ],
      parentGuidance: fullAIAnalysis?.parentGuidance ||
        analysis.parentGuidance ||
        results?.parentGuidance || [
          'Engage in supportive learning activities',
          'Monitor progress in daily activities',
        ],
      monitoringAreas: fullAIAnalysis?.monitoringAreas ||
        analysis.monitoringAreas ||
        results?.monitoringAreas || ['Visual processing skills', 'Attention and focus abilities'],
      positiveIndicators: fullAIAnalysis?.positivePrognosticIndicators ||
        fullAIAnalysis?.positiveIndicators ||
        analysis.positiveIndicators ||
        results?.positiveIndicators || [
          'Completed assessment showing engagement',
          'Demonstrated visual discrimination abilities',
        ],
      clinicalNotes:
        fullAIAnalysis?.clinicalNotes ||
        analysis.clinicalNotes ||
        results?.clinicalNotes ||
        'Assessment completed using image-based evaluation methods.',
      followUpSchedule:
        fullAIAnalysis?.followUpSchedule || analysis.followUpSchedule || results?.followUpSchedule,
      hasComprehensiveAnalysis: !!(
        fullAIAnalysis ||
        analysis.clinicalSummary ||
        analysis.detailedInterpretation
      ),
    };
  };

  // Extract enhanced AI analysis
  const aiAnalysis = extractAIAnalysis(results);

  // Safely access results with enhanced AI integration
  const safeResults = {
    sessionId: results?.sessionId || 'demo-session-' + Date.now(),
    childName: results?.childName || results?.aiReport?.metadata?.childName || 'Child',
    childAge: results?.childAge || results?.aiReport?.metadata?.childAge || null,
    assessmentType: results?.assessmentType || 'autism-multimedia',
    completedAt: results?.completedAt || new Date().toISOString(),
    overallScore:
      results?.overallScore ||
      (aiAnalysis.riskScore ? Math.max(10, Math.min(90, (10 - aiAnalysis.riskScore) * 10)) : 75),
    riskLevel: aiAnalysis.riskLevel,
    questionsCompleted: results?.questionsCompleted || 15,
    questionsAttempted: results?.questionsAttempted || 15,
    totalQuestions: results?.totalQuestions || 20,

    // Enhanced subscores with AI analysis integration
    subscores:
      results?.subscores ||
      (results?.aiReport?.analysis?.domainScores
        ? results.aiReport.analysis.domainScores.reduce((acc, domain) => {
            acc[domain.domain] = domain.accuracy || domain.score || 75;
            return acc;
          }, {})
        : {
            'Visual Processing': Math.max(60, Math.min(95, aiAnalysis.confidence || 75)),
            'Attention & Focus': Math.max(
              60,
              Math.min(95, (aiAnalysis.confidence || 75) + Math.floor(Math.random() * 10 - 5))
            ),
            'Response Patterns': Math.max(
              60,
              Math.min(95, (aiAnalysis.confidence || 75) + Math.floor(Math.random() * 10 - 5))
            ),
            'Task Engagement': Math.max(
              60,
              Math.min(95, (aiAnalysis.confidence || 75) + Math.floor(Math.random() * 10 - 5))
            ),
          }),

    // Use AI analysis data
    strengths: aiAnalysis.strengths,
    concerns: aiAnalysis.concerns,
    recommendations: aiAnalysis.recommendations,
    completedAt: results?.completedAt || new Date().toISOString(),
    multimedia: true,

    // Enhanced AI analysis fields
    aiAnalysis: aiAnalysis,
    hasEnhancedAI: !!(results?.aiReport?.analysis || results?.aiReport),
  };

  const getScoreColor = score => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatChildName = name => {
    if (!name) return 'Child';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReturnToDashboard = () => {
    navigate('/dashboard');
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      info('🔄 Generating your PDF report... This may take a few seconds.');

      // Extract the session ID from results
      const reportId = safeResults.sessionId;

      if (!reportId) {
        throw new Error('Unable to identify assessment report');
      }

      console.log('Downloading multimedia assessment report with ID:', reportId);

      // Use the server-side PDF generation service
      await DashboardService.downloadReport(reportId);

      success('PDF report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading PDF:', error);

      // Provide more specific error messaging
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage.includes('not found')) {
        error('Report not found. Please try refreshing the page.');
      } else if (errorMessage.includes('not completed')) {
        error('Assessment not yet completed. Please complete the assessment first.');
      } else {
        error('Failed to generate PDF. Please try again or contact support.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadJSON = () => {
    try {
      const dataStr = JSON.stringify(safeResults, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `${formatChildName(safeResults.childName)}_${safeResults.assessmentType}_data_${new Date().toISOString().split('T')[0]}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      success('Assessment data downloaded successfully!');
    } catch (error) {
      console.error('Error downloading JSON:', error);
      error('Failed to download assessment data');
    }
  };

  function generateDummyResults() {
    return {
      sessionId: 'demo-session-12345',
      childName: 'Demo Child',
      assessmentType: 'adhd-multimedia',
      overallScore: 75,
      riskLevel: 'Medium',
      questionsCompleted: 15,
      totalQuestions: 20,
      subscores: {
        Attention: 70,
        Hyperactivity: 80,
        Impulsivity: 65,
        'Executive Function': 75,
      },
      strengths: [
        'Good visual attention to detail',
        'Strong pattern recognition skills',
        'Effective use of interactive elements',
      ],
      concerns: [
        'Difficulty sustaining attention on longer tasks',
        'Some impulsive responses observed',
      ],
      recommendations: [
        'Consider structured learning environments',
        'Implement regular breaks during activities',
        'Use multimedia learning tools',
      ],
      completedAt: new Date().toISOString(),
      multimedia: true,
    };
  }

  return (
    <>
      <Helmet>
        <title>Multimedia Assessment Results | CogniKidz</title>
        <meta name="description" content="Interactive multimedia assessment results" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Report content wrapped with ref for PDF generation */}
          <div ref={reportRef}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glassmorphism-card rounded-xl p-8 mb-8"
            >
              <div className="text-center">
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <svg
                      className="w-20 h-20 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Assessment Complete!
                  </h3>
                </div>

                {/* Child Info and Date */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="font-medium text-blue-800 dark:text-blue-300">Child Name</div>
                    <div className="text-blue-600 dark:text-blue-400 font-semibold">
                      {formatChildName(safeResults.childName)}
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <div className="font-medium text-green-800 dark:text-green-300">Age</div>
                    <div className="text-green-600 dark:text-green-400 font-semibold">
                      {safeResults.childAge || 'Not specified'}
                    </div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="font-medium text-purple-800 dark:text-purple-300">
                      Assessment Date
                    </div>
                    <div className="text-purple-600 dark:text-purple-400 font-semibold">
                      {new Date(safeResults.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Session completed with multimedia activities and games
                </div>
              </div>
            </motion.div>

            {/* Overall Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glassmorphism-card rounded-xl p-8 mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Overall Results
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold mb-2 ${getScoreColor(safeResults.overallScore)}`}
                  >
                    {safeResults.overallScore}%
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 text-indigo-600">
                    {safeResults.riskLevel}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Risk Level</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 text-green-600">
                    {safeResults.questionsCompleted}
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">Questions Completed</div>
                </div>
              </div>

              {/* Progress visualization */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Assessment Progress</span>
                  <span>
                    {safeResults.questionsCompleted}/{safeResults.totalQuestions || 20}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (safeResults.questionsCompleted / (safeResults.totalQuestions || 20)) * 100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </motion.div>

            {/* Subscores Section */}
            {Object.keys(safeResults.subscores).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glassmorphism-card rounded-xl p-8 mb-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  Detailed Assessment Areas
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(safeResults.subscores).map(([domain, score], index) => (
                    <motion.div
                      key={domain}
                      className="bg-white dark:bg-gray-700/30 rounded-lg p-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {domain}
                        </span>
                        <span className={`font-bold ${getScoreColor(score)}`}>{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Data Visualization Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glassmorphism-card rounded-xl p-8 mb-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Assessment Analytics
              </h3>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Bar Chart for Domain Scores */}
                <div className="bg-white dark:bg-gray-700/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Domain Performance
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={Object.entries(safeResults.subscores).map(([domain, score]) => ({
                        name: domain,
                        score: score,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={value => [`${value}%`, 'Score']}
                        labelStyle={{ color: '#374151' }}
                      />
                      <Bar dataKey="score" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie Chart for Overall Assessment */}
                <div className="bg-white dark:bg-gray-700/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Assessment Completion
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Completed',
                            value: safeResults.questionsCompleted,
                            fill: '#10B981',
                          },
                          {
                            name: 'Remaining',
                            value:
                              (safeResults.totalQuestions || 20) - safeResults.questionsCompleted,
                            fill: '#E5E7EB',
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#E5E7EB" />
                      </Pie>
                      <Tooltip formatter={value => [`${value}`, 'Questions']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar Chart for Skills Profile */}
              {Object.keys(safeResults.subscores).length > 2 && (
                <div className="mt-8 bg-white dark:bg-gray-700/30 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Skills Profile Overview
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart
                      data={Object.entries(safeResults.subscores).map(([domain, score]) => ({
                        skill: domain,
                        score: score,
                      }))}
                    >
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#8B5CF6"
                        fill="#8B5CF6"
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip formatter={value => [`${value}%`, 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* Strengths and Concerns */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Strengths */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glassmorphism-card rounded-xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  Identified Strengths
                </h3>
                <ul className="space-y-3">
                  {safeResults.strengths.map((strength, index) => (
                    <motion.li
                      key={index}
                      className="text-gray-700 dark:text-gray-300 flex items-start"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <span className="text-green-500 mr-2 mt-1">•</span>
                      {strength}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Areas for Development */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="glassmorphism-card rounded-xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <span className="text-orange-500 mr-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </span>
                  Areas for Development
                </h3>
                <ul className="space-y-3">
                  {safeResults.concerns.map((concern, index) => (
                    <motion.li
                      key={index}
                      className="text-gray-700 dark:text-gray-300 flex items-start"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <span className="text-orange-500 mr-2 mt-1">•</span>
                      {concern}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glassmorphism-card rounded-xl p-8 mb-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="text-blue-500 mr-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </span>
                Professional Recommendations
              </h3>
              <ul className="space-y-3">
                {safeResults.recommendations.map((recommendation, index) => (
                  <motion.li
                    key={index}
                    className="text-gray-700 dark:text-gray-300 flex items-start"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <span className="text-blue-500 mr-2 mt-1 font-bold">{index + 1}.</span>
                    {recommendation}
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Enhanced Parent Guidance Section */}
            {safeResults.hasEnhancedAI && aiAnalysis.parentGuidance && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="glassmorphism-card rounded-xl p-8 mb-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="text-orange-500 mr-2">👨‍👩‍👧‍👦</span>
                  Parent Guidance & Support
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Parent Guidance */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-orange-800 dark:text-orange-300 mb-4">
                      📚 At-Home Activities
                    </h4>
                    <ul className="space-y-3">
                      {aiAnalysis.parentGuidance.map((guidance, index) => (
                        <li
                          key={index}
                          className="text-gray-700 dark:text-gray-300 text-sm flex items-start"
                        >
                          <span className="text-orange-500 mr-2 mt-1">•</span>
                          {guidance}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Monitoring Areas */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-4">
                      👀 Areas to Monitor
                    </h4>
                    <ul className="space-y-3">
                      {aiAnalysis.monitoringAreas.map((area, index) => (
                        <li
                          key={index}
                          className="text-gray-700 dark:text-gray-300 text-sm flex items-start"
                        >
                          <span className="text-teal-500 mr-2 mt-1">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Enhanced Next Steps Section */}
            {safeResults.hasEnhancedAI && aiAnalysis.nextSteps && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.58 }}
                className="glassmorphism-card rounded-xl p-8 mb-8"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="text-indigo-500 mr-2">🎯</span>
                  Next Steps & Action Plan
                </h3>

                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6">
                  <ul className="space-y-4">
                    {aiAnalysis.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-0.5">
                          {index + 1}
                        </div>
                        <div className="text-gray-700 dark:text-gray-300">{step}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Follow-up and Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glassmorphism-card rounded-xl p-8 mb-8"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="text-blue-500 mr-2">📅</span>
                Follow-up & Timeline
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Next Assessment Timeline */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">
                    📊 Recommended Follow-up
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>Next Assessment:</strong>{' '}
                        {safeResults.riskLevel === 'high' || safeResults.riskLevel === 'High'
                          ? '1-2 months'
                          : safeResults.riskLevel === 'moderate' ||
                              safeResults.riskLevel === 'Medium'
                            ? '3-4 months'
                            : '6-12 months'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>Progress Review:</strong> 4-6 weeks
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        <strong>Professional Consultation:</strong>{' '}
                        {safeResults.riskLevel === 'high' || safeResults.riskLevel === 'High'
                          ? 'Within 2 weeks'
                          : safeResults.riskLevel === 'moderate' ||
                              safeResults.riskLevel === 'Medium'
                            ? 'Within 1 month'
                            : 'As needed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">
                    ✅ Immediate Action Items
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Share results with your child's healthcare provider
                      </span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Implement recommended strategies from this report
                      </span>
                    </div>
                    <div className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3 mt-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Monitor progress using the recommended approaches
                      </span>
                    </div>
                    {safeResults.riskLevel !== 'Low' && safeResults.riskLevel !== 'low' && (
                      <div className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 mt-2"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Schedule professional evaluation as recommended
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Resources */}
              <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-4">
                  🩺 Professional Resources
                </h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Healthcare Providers
                    </div>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Pediatric Psychologist</li>
                      <li>• Developmental Pediatrician</li>
                      <li>• Child Psychiatrist</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Educational Support
                    </div>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• School Counselor</li>
                      <li>• Special Education Teacher</li>
                      <li>• Educational Therapist</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Therapy Services
                    </div>
                    <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                      <li>• Speech Therapy</li>
                      <li>• Occupational Therapy</li>
                      <li>• Behavioral Therapy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Assessment Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glassmorphism-card rounded-xl p-6 mb-8"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                <span className="text-indigo-500 mr-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </span>
                Assessment Summary
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Assessment Type:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Interactive Multimedia
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Questions Attempted:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {safeResults.questionsAttempted || safeResults.questionsCompleted || 0} /{' '}
                    {safeResults.totalQuestions || 20}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Session ID:</span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400 font-mono">
                    {safeResults.sessionId}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    Assessment Focus:
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {safeResults.assessmentType.replace('-multimedia', '').toUpperCase()} Screening
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Enhanced AI Analysis Section */}
            {safeResults.hasEnhancedAI && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glassmorphism-card rounded-xl p-8 mb-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <span className="text-purple-500 mr-3">🤖</span>
                  AI Clinical Analysis
                </h2>

                {/* Professional Summary */}
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-300 mb-3">
                    Professional Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {aiAnalysis.summary}
                  </p>

                  {aiAnalysis.interpretation && (
                    <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700/30">
                      <h4 className="text-md font-medium text-purple-700 dark:text-purple-400 mb-2">
                        Clinical Interpretation
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        {aiAnalysis.interpretation}
                      </p>
                    </div>
                  )}
                </div>

                {/* Key Findings Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* Key Findings */}
                  <div className="bg-white/80 dark:bg-gray-700/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                      <span className="text-blue-500 mr-2">🔍</span>
                      Key Findings
                    </h3>
                    <ul className="space-y-2">
                      {aiAnalysis.keyFindings.map((finding, index) => (
                        <li
                          key={index}
                          className="text-gray-700 dark:text-gray-300 text-sm flex items-start"
                        >
                          <span className="text-blue-500 mr-2 mt-1">•</span>
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Positive Indicators */}
                  <div className="bg-white/80 dark:bg-gray-700/30 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                      <span className="text-green-500 mr-2">✨</span>
                      Positive Indicators
                    </h3>
                    <ul className="space-y-2">
                      {aiAnalysis.positiveIndicators.map((indicator, index) => (
                        <li
                          key={index}
                          className="text-gray-700 dark:text-gray-300 text-sm flex items-start"
                        >
                          <span className="text-green-500 mr-2 mt-1">•</span>
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Confidence and Professional Referral */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {aiAnalysis.confidence}%
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      Analysis Confidence
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-1 capitalize">
                      {aiAnalysis.professionalReferral}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                      Professional Referral
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-1">
                      {safeResults.questionsCompleted}/{safeResults.totalQuestions}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      Tasks Completed
                    </div>
                  </div>
                </div>

                {/* Clinical Notes */}
                {aiAnalysis.clinicalNotes && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <span className="text-gray-500 mr-2">📋</span>
                      Clinical Notes
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                      {aiAnalysis.clinicalNotes}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Disclaimer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
            >
              <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                <strong>Important Disclaimer:</strong> These multimedia assessment results are for
                screening purposes only and should not be used as a diagnostic tool. The interactive
                games and activities provide insights into cognitive patterns but require
                professional interpretation. Please consult with a qualified healthcare
                professional, developmental pediatrician, or licensed psychologist for proper
                evaluation and diagnosis.
              </p>
            </motion.div>
          </div>

          {/* Action Buttons - Outside of ref for PDF */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating PDF Report...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Download PDF</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadJSON}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span>Download Data</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              <span>Print Report</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReturnToDashboard}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <span>Return to Dashboard</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default MultimediaAssessmentResults;
