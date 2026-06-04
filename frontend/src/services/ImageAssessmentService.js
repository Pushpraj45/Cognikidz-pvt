import api from './api';

/**
 * Image Assessment Service
 * Handles all image-based assessment API calls
 */
class ImageAssessmentService {
  /**
   * Start a new image assessment session
   * @param {Object} options - Assessment options
   * @param {String} options.assessmentType - Assessment type (autism, adhd, etc.)
   * @param {Number} options.totalQuestions - Number of questions
   * @param {String} options.childId - Child ID (optional)
   * @param {Object} options.settings - Assessment settings
   * @returns {Promise} - Assessment session data
   */
  async startAssessment({
    assessmentType = 'autism',
    totalQuestions = 20,
    childId,
    settings = {},
  }) {
    try {
      // Validate required parameters
      if (!childId) {
        throw new Error('Child ID is required to start an image assessment');
      }

      const payload = {
        assessmentType,
        totalQuestions,
        childId,
        settings,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
      };

      const response = await api.post('/api/assessment/image/start', payload);
      return response.data.data;
    } catch (error) {
      console.error('Error starting image assessment:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Submit a response to an image assessment question
   * @param {String} sessionId - Session ID
   * @param {Object} response - Response data
   * @param {String} response.setId - Image set ID
   * @param {String} response.selectedImage - Selected image (positive/negative)
   * @param {Number} response.responseTime - Response time in milliseconds
   * @returns {Promise} - Next question or completion data
   */
  async submitResponse(sessionId, response) {
    try {
      const apiResponse = await api.post(`/api/assessment/image/${sessionId}/response`, response);
      return apiResponse.data.data;
    } catch (error) {
      console.error('Error submitting image assessment response:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get current assessment session
   * @param {String} sessionId - Session ID
   * @returns {Promise} - Session data
   */
  async getSession(sessionId) {
    try {
      const response = await api.get(`/api/assessment/image/${sessionId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting image assessment session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Pause an assessment session
   * @param {String} sessionId - Session ID
   * @returns {Promise} - Success status
   */
  async pauseSession(sessionId) {
    try {
      const response = await api.post(`/api/assessment/image/${sessionId}/pause`);
      return response.data;
    } catch (error) {
      console.error('Error pausing image assessment session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Resume a paused assessment session
   * @param {String} sessionId - Session ID
   * @returns {Promise} - Session data
   */
  async resumeSession(sessionId) {
    try {
      const response = await api.post(`/api/assessment/image/${sessionId}/resume`);
      return response.data.data;
    } catch (error) {
      console.error('Error resuming image assessment session:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get assessment results
   * @param {String} sessionId - Session ID
   * @returns {Promise} - Assessment results
   */
  async getResults(sessionId) {
    try {
      const response = await api.get(`/api/assessment/image/${sessionId}/results`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting image assessment results:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate assessment report
   * @param {String} sessionId - Session ID
   * @param {String} format - Report format (json/pdf)
   * @param {String} type - Report type (basic/ai)
   * @returns {Promise} - Report data
   */
  async generateReport(sessionId, format = 'json', type = 'basic') {
    try {
      const response = await api.get(
        `/api/assessment/image/${sessionId}/report?format=${format}&type=${type}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error generating image assessment report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate AI-powered assessment report
   * @param {String} sessionId - Session ID
   * @returns {Promise} - AI report data
   */
  async generateAIReport(sessionId) {
    try {
      const response = await this.generateReport(sessionId, 'json', 'ai');
      return response;
    } catch (error) {
      console.error('Error generating AI assessment report:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get assessment history
   * @param {Object} options - Query options
   * @param {Number} options.page - Page number
   * @param {Number} options.limit - Items per page
   * @param {String} options.assessmentType - Filter by assessment type
   * @returns {Promise} - Assessment history
   */
  async getHistory({ page = 1, limit = 10, assessmentType = null } = {}) {
    try {
      let url = `/api/assessment/image/history?page=${page}&limit=${limit}`;
      if (assessmentType) {
        url += `&assessmentType=${assessmentType}`;
      }

      const response = await api.get(url);
      return response.data.data;
    } catch (error) {
      console.error('Error getting image assessment history:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Validate assessment configuration
   * @param {Object} config - Assessment configuration
   * @returns {Object} - Validation result
   */
  validateAssessmentConfig(config) {
    const errors = [];

    if (!config.assessmentType) {
      errors.push('Assessment type is required');
    }

    if (!['autism', 'adhd', 'dyslexia'].includes(config.assessmentType)) {
      errors.push('Invalid assessment type');
    }

    if (config.totalQuestions && (config.totalQuestions < 15 || config.totalQuestions > 50)) {
      errors.push('Total questions must be between 15 and 50 for comprehensive assessment');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculate assessment progress
   * @param {Number} currentQuestion - Current question number
   * @param {Number} totalQuestions - Total questions
   * @returns {Object} - Progress data
   */
  calculateProgress(currentQuestion, totalQuestions) {
    const percentage = Math.round((currentQuestion / totalQuestions) * 100);
    return {
      current: currentQuestion,
      total: totalQuestions,
      percentage,
      remaining: totalQuestions - currentQuestion,
      isComplete: currentQuestion >= totalQuestions,
    };
  }

  /**
   * Format assessment results for display
   * @param {Object} results - Raw assessment results
   * @returns {Object} - Formatted results
   */
  formatResults(results) {
    return {
      score: {
        accuracy: `${results.accuracyRate}%`,
        correct: results.correctAnswers,
        incorrect: results.incorrectAnswers,
        total: results.totalQuestions,
      },
      performance: {
        avgResponseTime: `${(results.averageResponseTime / 1000).toFixed(1)}s`,
        riskLevel: results.riskLevel,
        interpretation: results.interpretation,
      },
      domains:
        results.domainScores?.map(domain => ({
          name: this.formatDomainName(domain.domain),
          accuracy: `${domain.accuracy}%`,
          correct: domain.correct,
          total: domain.total,
        })) || [],
      recommendations: results.recommendations || [],
    };
  }

  /**
   * Format domain names for display
   * @param {String} domain - Domain name
   * @returns {String} - Formatted domain name
   */
  formatDomainName(domain) {
    const domainNames = {
      social_interaction: 'Social Interaction',
      communication: 'Communication',
      behavior_patterns: 'Behavior Patterns',
      sensory_response: 'Sensory Response',
      emotional_recognition: 'Emotional Recognition',
      eye_contact: 'Eye Contact',
      facial_expressions: 'Facial Expressions',
    };

    return domainNames[domain] || domain.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get risk level color for UI
   * @param {String} riskLevel - Risk level
   * @returns {String} - CSS color class
   */
  getRiskLevelColor(riskLevel) {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      moderate: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-red-600 bg-red-50 border-red-200',
    };

    return colors[riskLevel] || colors.low;
  }

  /**
   * Handle API errors
   * @param {Error} error - API error
   * @returns {Error} - Formatted error
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Network error
      return new Error('Network error. Please check your connection.');
    } else {
      // Other error
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  /**
   * Save assessment state to localStorage
   * @param {String} sessionId - Session ID
   * @param {Object} state - Assessment state
   */
  saveAssessmentState(sessionId, state) {
    try {
      const key = `imageAssessment_${sessionId}`;
      localStorage.setItem(
        key,
        JSON.stringify({
          ...state,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.warn('Failed to save assessment state:', error);
    }
  }

  /**
   * Load assessment state from localStorage
   * @param {String} sessionId - Session ID
   * @returns {Object|null} - Saved state or null
   */
  loadAssessmentState(sessionId) {
    try {
      const key = `imageAssessment_${sessionId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const state = JSON.parse(saved);
        // Check if state is not too old (24 hours)
        if (Date.now() - state.timestamp < 24 * 60 * 60 * 1000) {
          return state;
        }
      }
    } catch (error) {
      console.warn('Failed to load assessment state:', error);
    }
    return null;
  }

  /**
   * Clear assessment state from localStorage
   * @param {String} sessionId - Session ID
   */
  clearAssessmentState(sessionId) {
    try {
      const key = `imageAssessment_${sessionId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to clear assessment state:', error);
    }
  }
}

const imageAssessmentServiceInstance = new ImageAssessmentService();
export default imageAssessmentServiceInstance;
