import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import AssessmentService from '../../services/AssessmentService';

/**
 * Enhanced Game Wrapper
 * Wraps existing game components to add battery assessment functionality
 * while maintaining backward compatibility with standalone game mode
 */
const EnhancedGameWrapper = ({
  children,
  gameId,
  sessionId,
  batteryId = null,
  onGameComplete,
  assessmentMode = 'standalone', // 'standalone' or 'battery'
  childData = null,
  adaptiveSettings = null,
}) => {
  // Performance tracking state
  const [performanceData, setPerformanceData] = useState({
    startTime: Date.now(),
    responseTimes: [],
    clicks: [],
    errors: [],
    helpRequests: 0,
    breaks: 0,
    score: 0,
    accuracy: 0,
    completionRate: 0,
  });

  // Real-time tracking state
  const [realTimeTracking, setRealTimeTracking] = useState({
    isTracking: false,
    lastUpdateTime: Date.now(),
    behavioralEvents: [],
  });

  // Initialize performance tracking
  useEffect(() => {
    if (assessmentMode === 'battery') {
      setRealTimeTracking(prev => ({
        ...prev,
        isTracking: true,
        lastUpdateTime: Date.now(),
      }));
    }
  }, [assessmentMode]);

  // Track mouse movements and clicks (for engagement analysis)
  const trackInteraction = useCallback(
    event => {
      if (!realTimeTracking.isTracking) return;

      const currentTime = Date.now();
      const interaction = {
        type: event.type,
        x: event.clientX,
        y: event.clientY,
        timestamp: currentTime,
        target: event.target.className || event.target.tagName,
      };

      setPerformanceData(prev => ({
        ...prev,
        clicks: [...prev.clicks, interaction],
      }));

      // Detect distraction patterns
      if (event.type === 'click' && !event.target.closest('.game-area')) {
        trackBehavioralEvent('distraction', 'click_outside_game_area');
      }
    },
    [realTimeTracking.isTracking]
  );

  // Track behavioral events
  const trackBehavioralEvent = useCallback(
    (eventType, details) => {
      const behavioralEvent = {
        type: eventType,
        details,
        timestamp: Date.now(),
        gameContext: gameId,
      };

      setRealTimeTracking(prev => ({
        ...prev,
        behavioralEvents: [...prev.behavioralEvents, behavioralEvent],
      }));
    },
    [gameId]
  );

  // Track response times
  const trackResponseTime = useCallback((responseTime, isCorrect = true) => {
    setPerformanceData(prev => ({
      ...prev,
      responseTimes: [...prev.responseTimes, responseTime],
      errors: isCorrect
        ? prev.errors
        : [
            ...prev.errors,
            {
              timestamp: Date.now(),
              responseTime,
              type: 'incorrect_response',
            },
          ],
    }));
  }, []);

  // Track help requests
  const trackHelpRequest = useCallback(() => {
    setPerformanceData(prev => ({
      ...prev,
      helpRequests: prev.helpRequests + 1,
    }));
    trackBehavioralEvent('help_request', 'user_requested_help');
  }, [trackBehavioralEvent]);

  // Update performance metrics
  const updatePerformance = useCallback(updates => {
    setPerformanceData(prev => ({
      ...prev,
      ...updates,
      duration: (Date.now() - prev.startTime) / 1000, // in seconds
    }));
  }, []);

  // Calculate engagement score
  const calculateEngagementScore = useCallback(() => {
    const totalTime = (Date.now() - performanceData.startTime) / 1000;
    const activeTime =
      totalTime -
      realTimeTracking.behavioralEvents.filter(e => e.type === 'distraction').length * 2; // Assume 2 seconds lost per distraction

    const engagementScore = Math.max(0, Math.min(1, activeTime / totalTime));
    return engagementScore;
  }, [performanceData.startTime, realTimeTracking.behavioralEvents]);

  // Handle game completion
  const handleGameComplete = useCallback(
    async gameResults => {
      const finalPerformanceData = {
        ...performanceData,
        ...gameResults,
        duration: (Date.now() - performanceData.startTime) / 1000,
        engagementScore: calculateEngagementScore(),
        behavioralMetrics: {
          responseTimes: performanceData.responseTimes,
          timeToFirstResponse: performanceData.responseTimes[0] || 0,
          performanceOverTime: calculatePerformanceOverTime(),
          breakRequests: performanceData.breaks,
          errorAnalysis: {
            totalErrors: performanceData.errors.length,
            errorTypes: analyzeErrorTypes(),
            falsePositives: 0, // Would be calculated based on game specifics
            falseNegatives: 0,
          },
          engagementData: {
            clickPatterns: performanceData.clicks,
            helpRequests: performanceData.helpRequests,
            distractionEvents: realTimeTracking.behavioralEvents.filter(
              e => e.type === 'distraction'
            ).length,
            frustrationIndicators: realTimeTracking.behavioralEvents.filter(
              e => e.type === 'frustration'
            ).length,
          },
        },
      };

      if (assessmentMode === 'battery' && sessionId && batteryId) {
        // Submit to battery assessment system
        try {
          await onGameComplete(finalPerformanceData);
        } catch (error) {
          console.error('Error submitting battery game results:', error);
        }
      } else {
        // Handle standalone game completion
        if (onGameComplete) {
          onGameComplete(finalPerformanceData);
        }
      }
    },
    [
      performanceData,
      calculateEngagementScore,
      assessmentMode,
      sessionId,
      batteryId,
      onGameComplete,
    ]
  );

  // Calculate performance over time segments
  const calculatePerformanceOverTime = useCallback(() => {
    const segments = [];
    const segmentDuration = 30000; // 30 seconds per segment
    const startTime = performanceData.startTime;
    const currentTime = Date.now();

    for (let i = 0; i < Math.ceil((currentTime - startTime) / segmentDuration); i++) {
      const segmentStart = startTime + i * segmentDuration;
      const segmentEnd = Math.min(segmentStart + segmentDuration, currentTime);

      const segmentResponses = performanceData.responseTimes.filter(rt => {
        const responseTime = rt.timestamp || startTime + rt; // Handle different formats
        return responseTime >= segmentStart && responseTime < segmentEnd;
      });

      const segmentAccuracy =
        segmentResponses.length > 0
          ? segmentResponses.filter(r => r.correct !== false).length / segmentResponses.length
          : 0;

      segments.push({
        timeSegment: i + 1,
        score: segmentAccuracy * 10, // Convert to 0-10 scale
        accuracy: segmentAccuracy,
      });
    }

    return segments;
  }, [performanceData]);

  // Analyze error types
  const analyzeErrorTypes = useCallback(() => {
    const errorTypes = {};
    performanceData.errors.forEach(error => {
      const type = error.type || 'unknown';
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    return Object.entries(errorTypes).map(([type, count]) => ({
      type,
      count,
      timestamps: performanceData.errors.filter(e => e.type === type).map(e => e.timestamp),
    }));
  }, [performanceData.errors]);

  // Submit real-time data periodically
  useEffect(() => {
    if (assessmentMode !== 'battery' || !sessionId) return;

    const interval = setInterval(async () => {
      try {
        const realtimeData = {
          gameId,
          currentScore: performanceData.score,
          currentAccuracy: performanceData.accuracy,
          responseTimes: performanceData.responseTimes.slice(-5), // Last 5 responses
          engagementScore: calculateEngagementScore(),
          recentBehavioralEvents: realTimeTracking.behavioralEvents.slice(-3), // Last 3 events
        };

        await AssessmentService.submitGameData(sessionId, gameId, realtimeData);
      } catch (error) {
        console.warn('Error submitting real-time data:', error);
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [
    assessmentMode,
    sessionId,
    gameId,
    performanceData.score,
    performanceData.accuracy,
    performanceData.responseTimes,
    calculateEngagementScore,
    realTimeTracking.behavioralEvents,
  ]);

  // Add event listeners for interaction tracking
  useEffect(() => {
    if (assessmentMode === 'battery') {
      document.addEventListener('click', trackInteraction);
      document.addEventListener('mousemove', trackInteraction);

      return () => {
        document.removeEventListener('click', trackInteraction);
        document.removeEventListener('mousemove', trackInteraction);
      };
    }
  }, [assessmentMode, trackInteraction]);

  // Enhanced game props
  const enhancedGameProps = {
    // Original props
    sessionId,
    childData,

    // Enhanced tracking functions
    onScoreUpdate: score => updatePerformance({ score }),
    onAccuracyUpdate: accuracy => updatePerformance({ accuracy }),
    onResponseTime: trackResponseTime,
    onHelpRequest: trackHelpRequest,
    onGameComplete: handleGameComplete,

    // Performance tracking
    trackBehavioralEvent,
    updatePerformance,

    // Current performance data (for adaptive difficulty)
    currentPerformance: {
      score: performanceData.score,
      accuracy: performanceData.accuracy,
      averageResponseTime:
        performanceData.responseTimes.length > 0
          ? performanceData.responseTimes.reduce((sum, rt) => sum + rt, 0) /
            performanceData.responseTimes.length
          : 0,
      engagementLevel: calculateEngagementScore(),
    },

    // Assessment mode info
    assessmentMode,
    batteryId,
    adaptiveSettings,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="enhanced-game-wrapper relative"
    >
      {/* Performance overlay for debugging (only in development) */}
      {process.env.NODE_ENV === 'development' && assessmentMode === 'battery' && (
        <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
          <div>Score: {performanceData.score}</div>
          <div>Accuracy: {(performanceData.accuracy * 100).toFixed(1)}%</div>
          <div>Engagement: {(calculateEngagementScore() * 100).toFixed(1)}%</div>
          <div>Responses: {performanceData.responseTimes.length}</div>
          <div>Errors: {performanceData.errors.length}</div>
          <div>Help: {performanceData.helpRequests}</div>
        </div>
      )}

      {/* Game content with enhanced props */}
      {React.cloneElement(children, enhancedGameProps)}
    </motion.div>
  );
};

export default EnhancedGameWrapper;
