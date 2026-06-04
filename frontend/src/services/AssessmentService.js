import api from './api';

/**
 * Service for interacting with assessment API endpoints
 */
class AssessmentService {
  /**
   * Start a new assessment using an intake form
   * @param {string} intakeId The ID of the intake form
   * @param {string} assessmentType Optional type of assessment to create
   * @param {boolean} gameBasedAssessment Whether to use game-based assessment
   * @param {string} language Language preference for assessment questions
   * @returns {Promise<Object>} Assessment data with session ID and first question
   */
  async startAssessmentFromIntake(
    intakeId,
    assessmentType = null,
    gameBasedAssessment = false,
    language = 'en'
  ) {
    // 🔍 DEBUG: Log language parameter flow in AssessmentService
    console.log('🔍 [LANGUAGE DEBUG] AssessmentService Language Flow:', {
      service: 'AssessmentService',
      method: 'startAssessmentFromIntake',
      intakeId,
      assessmentType,
      gameBasedAssessment,
      language,
      languageType: typeof language,
      languageUndefined: language === undefined,
      languageNull: language === null,
      hasLanguage: language !== undefined && language !== null,
      languageValue: language
    });

    const payload = { intakeId, gameBasedAssessment, language };
    if (assessmentType) {
      payload.assessmentType = assessmentType;
    }

    // 🔍 DEBUG: Log the final payload being sent
    console.log('🔍 [LANGUAGE DEBUG] AssessmentService Payload:', {
      payload,
      payloadKeys: Object.keys(payload),
      hasLanguageInPayload: 'language' in payload,
      payloadLanguage: payload.language
    });

    const response = await api.post('/api/start-assessment', payload);
    return response.data;
  }

  /**
   * Configure assessment battery for a child
   * @param {string} childId Child's ID
   * @param {string} assessmentType Type of assessment (adhd, dyslexia, autism)
   * @param {number} ageMonths Child's age in months
   * @param {Array} concerns Array of concerns
   * @returns {Promise<Object>} Battery configuration
   */
  async configureBattery(childId, assessmentType, ageMonths, concerns = []) {
    const response = await api.post('/api/assessment/battery/configure', {
      childId,
      assessmentType,
      ageMonths,
      concerns,
    });
    return response.data;
  }

  /**
   * Start a battery-based assessment session
   * @param {string} childId Child's ID
   * @param {Object} batteryStructure Battery configuration
   * @param {string} intakeId Optional intake ID
   * @returns {Promise<Object>} Session data with first game
   */
  async startBatteryAssessment(childId, batteryStructure, intakeId = null) {
    const response = await api.post('/api/assessment/battery/start', {
      childId,
      batteryStructure,
      intakeId,
    });
    return response.data;
  }

  /**
   * Complete a game and get next action
   * @param {string} sessionId Assessment session ID
   * @param {string} gameId Game ID
   * @param {string} batteryId Battery ID
   * @param {Object} performanceData Game performance data
   * @param {string} childId Child ID (for individual games)
   * @returns {Promise<Object>} Next action and progress data
   */
  async completeGame(sessionId, gameId, batteryId, performanceData, childId = null) {
    try {
      const requestBody = {
        sessionId,
        gameId,
        batteryId,
        performanceData,
      };

      // Add childId for individual game sessions
      if (childId) {
        requestBody.childId = childId;
      }

      const response = await api.post('/api/assessment/game/complete', requestBody);
      return response.data;
    } catch (error) {
      // Error completing game
      throw error;
    }
  }

  /**
   * Get real-time assessment progress
   * @param {string} sessionId Assessment session ID
   * @returns {Promise<Object>} Progress data
   */
  async getAssessmentProgress(sessionId) {
    const response = await api.get(`/api/assessment/progress/${sessionId}`);
    return response.data;
  }

  /**
   * Get child's historical progress
   * @param {string} childId Child's ID
   * @returns {Promise<Object>} Child progress data
   */
  async getChildProgress(childId) {
    const response = await api.get(`/api/assessment/child-progress/${childId}`);
    return response.data;
  }

  /**
   * Submit real-time game performance data
   * @param {string} sessionId Assessment session ID
   * @param {string} gameId Game ID
   * @param {Object} realtimeData Real-time performance data
   * @returns {Promise<Object>} Acknowledgment and adaptive adjustments
   */
  async submitGameData(sessionId, gameId, realtimeData) {
    const response = await api.post('/api/assessment/game/data', {
      sessionId,
      gameId,
      performanceData: realtimeData,
    });
    return response.data;
  }

  /**
   * Start a specific game within a battery
   * @param {string} sessionId Assessment session ID
   * @param {string} gameId Game ID
   * @param {string} batteryId Battery ID
   * @returns {Promise<Object>} Game configuration and settings
   */
  async startGame(sessionId, gameId, batteryId) {
    const response = await api.post('/api/assessment/game/start', {
      sessionId,
      gameId,
      batteryId,
    });
    return response.data;
  }

  /**
   * Handle scheduled break
   * @param {string} sessionId Assessment session ID
   * @param {string} breakType Type of break
   * @returns {Promise<Object>} Break activity and content
   */
  async handleBreak(sessionId, breakType) {
    const response = await api.post('/api/assessment/battery/break', {
      sessionId,
      breakType,
    });
    return response.data;
  }

  /**
   * Submit an answer and get the next question
   * @param {string} sessionId Assessment session ID
   * @param {string} questionId Question ID
   * @param {any} response User's response
   * @param {string} language Language preference for next question generation
   * @returns {Promise<Object>} Next question or completion status
   */
  async submitAnswer(sessionId, questionId, response, language = 'en') {
    try {
      console.log(`Submitting answer for session ${sessionId}, question ${questionId}, language: ${language}`);

      const startTime = Date.now();
      // Increase client timeout to 15 minutes to allow slow AI responses
      const timeout = 900000;

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              'Question generation timed out. This may indicate an issue with the AI service.'
            )
          );
        }, timeout);
      });

      // Create the API call promise with language support
      const apiPromise = api.post(`/api/assessment/${sessionId}/answer`, {
        questionId,
        response,
        language
      });

      // Race between timeout and API call
      const result = await Promise.race([apiPromise, timeoutPromise]);

      const endTime = Date.now();
      console.log(`Answer submitted successfully in ${endTime - startTime}ms`);

      if (!result.data.success) {
        throw new Error(result.data.message || 'Failed to process answer');
      }

      return result.data;
    } catch (error) {
      console.error('Error submitting answer:', error);

      // Handle specific error types
      if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
        throw new Error(
          'The question generation is taking longer than expected. We are retrying in the background. Please wait or try again shortly.'
        );
      }

      if (error.response?.status === 429) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }

      if (error.response?.status === 503) {
        throw new Error(
          'The AI service is temporarily unavailable. Please try again in a few minutes.'
        );
      }

      if (error.response?.data?.message) {
        // Check if it's an LLM failure
        if (
          error.response.data.message.includes('Question generation failed') ||
          error.response.data.message.includes('Failed to generate valid question')
        ) {
          throw new Error(
            'Our AI is having trouble generating the next question. This assessment cannot continue at the moment. Please try starting a new assessment or contact support.'
          );
        }
        throw new Error(error.response.data.message);
      }

      throw new Error(
        'An unexpected error occurred while processing your answer. Please try again.'
      );
    }
  }

  /**
   * Get assessment data for a session
   * @param {string} sessionId Assessment session ID
   * @returns {Promise<Object>} Assessment data
   */
  async getAssessment(sessionId) {
    try {
      console.log(`Fetching assessment data for session: ${sessionId}`);
      const response = await api.get(`/api/assessment/${sessionId}`);

      if (!response.data || !response.data.assessment) {
        console.error('Invalid response format from assessment API:', response.data);
        throw new Error('Invalid response from server. Assessment data not found.');
      }

      console.log('Retrieved assessment data:', response.data.assessment);

      const assessmentData = response.data.assessment;

      // Enhanced: Check if it's a game-based assessment
      if (assessmentData.batteryStructure?.isGameBased) {
        console.log('Detected game-based assessment');
        return {
          ...assessmentData,
          isGameBased: true,
        };
      }

      // If we received a limited access response, log this information
      if (assessmentData.isLimitedAccess) {
        console.log(
          'Received limited access assessment data. Questions availability:',
          assessmentData.questions ? `Yes (${assessmentData.questions.length} questions)` : 'No'
        );
      }

      // Validate that we have questions in the response
      if (!assessmentData.questions || assessmentData.questions.length === 0) {
        console.warn('No questions found in assessment data');
        if (assessmentData.isLimitedAccess) {
          console.log('Attempting to refresh assessment data with full authentication...');
          // We could try to get full assessment data here if needed
        }
      } else {
        console.log(`Found ${assessmentData.questions.length} questions in response`);
      }

      return response.data.assessment;
    } catch (error) {
      console.error('Error fetching assessment:', error);
      console.error('Error details:', error.response?.data || 'No response data');
      throw error;
    }
  }

  /**
   * Get assessment report for a completed assessment
   * @param {string} sessionId Assessment session ID
   * @returns {Promise<Object>} Assessment report
   */
  async getReport(sessionId) {
    const response = await api.get(`/api/assessment/${sessionId}/report`);
    return response.data.report;
  }

  /**
   * Pause an assessment session
   * @param {string} sessionId Assessment session ID
   * @returns {Promise<Object>} Status response
   */
  async pauseAssessment(sessionId) {
    const response = await api.post(`/api/assessment/${sessionId}/pause`);
    return response.data;
  }

  /**
   * Resume a paused assessment session
   * @param {string} sessionId Assessment session ID
   * @returns {Promise<Object>} Status with current question
   */
  async resumeAssessment(sessionId) {
    const response = await api.post(`/api/assessment/${sessionId}/resume`);
    return response.data;
  }

  /**
   * Get all assessments for the current user
   * @returns {Promise<Array>} List of assessments
   */
  async getUserAssessments() {
    const response = await api.get('/api/assessment/assessments');
    return response.data.assessments;
  }

  /**
   * Get all assessments for a specific child
   * @param {string} childId Child's ID
   * @param {string} assessmentType Optional filter by assessment type (text, image, game, all)
   * @returns {Promise<Array>} List of child's assessments
   */
  async getChildAssessments(childId, assessmentType = null) {
    let url = `/api/assessment/childAssessments/${childId}`;
    if (assessmentType && assessmentType !== 'all') {
      url += `?assessmentType=${assessmentType}`;
    }

    const response = await api.get(url);
    return response.data.assessments;
  }

  /**
   * Start a new assessment with detailed form data
   * @param {Object} data Assessment data with child and form data
   * @returns {Promise<Object>} Assessment data with session ID and first question
   */
  async startNewAssessment(data) {
    const response = await api.post('/api/assessment/start', data);
    return response.data;
  }

  /**
   * Get all assessments for the current user (all statuses)
   * @param {string} status Optional status filter
   * @returns {Promise<Array>} List of user assessments
   */
  async getAllUserAssessments(status = null) {
    try {
      console.log('Fetching all user assessments...');

      const config = {};
      if (status) {
        config.params = { status };
      }

      const response = await api.get('/api/assessment/assessments/user', config);

      if (!response.data || !response.data.assessments) {
        console.error('Invalid response format from user assessments API:', response.data);
        return [];
      }

      const assessments = response.data.assessments;
      console.log(`Retrieved ${assessments.length} user assessments`);

      return assessments;
    } catch (error) {
      console.error('Error fetching user assessments:', error);
      throw error;
    }
  }

  /**
   * Get detailed assessment history with questions and responses
   * @param {boolean} forceRefresh Whether to bypass cache and force a fresh fetch
   * @param {string} assessmentType Optional filter by assessment type (text, image, game, all)
   * @returns {Promise<Array>} List of detailed assessment history
   */
  async getAssessmentHistory(forceRefresh = false, assessmentType = null) {
    try {
      console.log('Fetching assessment history...');

      // Try the new user assessments endpoint first
      let url = '/api/assessment/assessments/user';
      const config = {};

      if (forceRefresh) {
        // Add cache-busting parameter when force refreshing
        config.params = { _t: Date.now() };
      }

      // Add assessment type filter if specified
      if (assessmentType && assessmentType !== 'all') {
        config.params = { ...config.params, assessmentType };
      }

      let response;
      try {
        response = await api.get(url, config);
        console.log(`Retrieved ${response.data.assessments.length} assessments from user endpoint`);
      } catch (userEndpointError) {
        console.warn('User endpoint failed, trying history endpoint:', userEndpointError.message);
        // Fallback to history endpoint
        url = '/api/assessment/assessments/history';
        response = await api.get(url, config);
        console.log(
          `Retrieved ${response.data.assessments.length} assessments from history endpoint`
        );
      }

      if (!response.data || !response.data.assessments) {
        console.error('Invalid response format from assessment API:', response.data);
        return [];
      }

      let assessments = response.data.assessments;

      // Filter to only completed assessments for history view
      assessments = assessments.filter(a => a.status === 'completed');
      console.log(`Filtered to ${assessments.length} completed assessments`);

      // Check if any assessments are completed but missing result data
      const incompleteData = assessments.filter(
        a => a.status === 'completed' && (!a.results || !a.results.summary)
      );

      if (incompleteData.length > 0) {
        console.log(
          `Found ${incompleteData.length} assessments with incomplete result data, fetching details...`
        );

        // Fetch complete data for these assessments
        const detailPromises = incompleteData.map(assessment =>
          this.getDetailedAssessment(assessment.sessionId).catch(err => {
            console.error(`Failed to fetch data for assessment ${assessment.sessionId}:`, err);
            return null;
          })
        );

        // Wait for all detail requests to complete
        const detailResults = await Promise.allSettled(detailPromises);

        // Update assessments with the fetched details
        detailResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const sessionId = incompleteData[index].sessionId;
            const idx = assessments.findIndex(a => a.sessionId === sessionId);

            if (idx >= 0) {
              assessments[idx] = {
                ...assessments[idx],
                ...result.value,
              };
              console.log(`Updated assessment ${sessionId} with complete data`);
            }
          }
        });
      }

      return assessments;
    } catch (error) {
      console.error('Error fetching assessment history:', error);

      // Attempt retry once with a delay
      try {
        console.log('Retrying assessment history fetch after error...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        const retryConfig = {};
        if (assessmentType && assessmentType !== 'all') {
          retryConfig.params = { assessmentType };
        }
        const retryResponse = await api.get('/api/assessment/assessments/user', retryConfig);
        const retryAssessments = retryResponse.data.assessments || [];
        return retryAssessments.filter(a => a.status === 'completed');
      } catch (retryError) {
        console.error('Retry also failed:', retryError);
        throw error;
      }
    }
  }

  /**
   * Fetch detailed assessment data for a specific assessment
   * @param {string} sessionId Assessment session ID
   * @returns {Promise<Object>} Detailed assessment data
   */
  async getDetailedAssessment(sessionId) {
    try {
      // First try the report endpoint
      const reportResponse = await api.get(`/api/assessment/${sessionId}/report`);

      if (reportResponse.data.success && reportResponse.data.report) {
        return {
          ...reportResponse.data.report,
          hasDetailedReport: true,
        };
      }

      // Fall back to the regular assessment endpoint
      const response = await api.get(`/api/assessment/${sessionId}`);

      if (response.data.success && response.data.assessment) {
        return response.data.assessment;
      }

      throw new Error('No valid assessment data found');
    } catch (error) {
      console.error(`Error fetching detailed assessment ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get assessment timeline data for a specific child (includes completed and scheduled assessments)
   * @param {string} childId Child's ID
   * @param {string} assessmentType Optional filter by assessment type (text, image, game, all)
   * @returns {Promise<Array>} Timeline data formatted for the timeline component
   */
  async getAssessmentTimeline(childId, assessmentType = null) {
    try {
      console.log(`Fetching assessment timeline for child: ${childId}`);

      let url = `/api/assessment/assessments/timeline/${childId}`;
      if (assessmentType && assessmentType !== 'all') {
        url += `?assessmentType=${assessmentType}`;
      }

      const response = await api.get(url);

      if (!response.data || !response.data.timeline) {
        console.error('Invalid response format from timeline API:', response.data);
        return [];
      }

      const timeline = response.data.timeline;
      console.log(`Retrieved ${timeline.length} timeline items for child ${childId}`);

      // Ensure all timeline items have the required fields for the timeline component
      const formattedTimeline = timeline.map(item => ({
        id: item.id,
        date: item.date,
        type: item.type,
        status: item.status,
        score: item.score,
        childName: item.childName,
        notes: item.notes || 'No notes available',
        reportUrl: item.reportUrl,
        progress: item.progress,
        isRecommendation: item.isRecommendation || false,
        originalAssessment: item.originalAssessment,
        assessmentCategory: item.assessmentCategory,
        sourceType: item.sourceType,
      }));

      return formattedTimeline;
    } catch (error) {
      console.error(`Error fetching assessment timeline for child ${childId}:`, error);
      throw error;
    }
  }

  /**
   * Get child's game performance data
   * @param {string} childId Child's ID
   * @returns {Promise<Object>} Game performance data
   */
  async getChildGamePerformance(childId) {
    try {
      const response = await api.get(`/api/assessment/child-game-performance/${childId}`);
      return response.data;
    } catch (error) {
      // Error fetching child game performance
      throw error;
    }
  }
}

const assessmentService = new AssessmentService();
export default assessmentService;
