import api from './api';

/**
 * Service for handling assessment intake operations
 */
const IntakeService = {
  /**
   * Submit a new intake form
   * @param {Object} formData - The intake form data
   * @returns {Promise<Object>} Response containing the saved intake data with intakeId
   */
  async submitIntake(formData) {
    try {
      const response = await api.post('/api/intake', formData);
      return response.data;
    } catch (error) {
      console.error('Error submitting intake form:', error);
      throw error;
    }
  },

  /**
   * Retrieve intake data by ID
   * @param {string} intakeId - The ID of the intake to retrieve
   * @returns {Promise<Object>} The intake data
   */
  async getIntakeById(intakeId) {
    try {
      const response = await api.get(`/api/intake/${intakeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error retrieving intake with ID ${intakeId}:`, error);
      throw error;
    }
  },

  /**
   * Start an assessment using intake data
   * @param {string} intakeId - The ID of the intake to use for assessment
   * @param {string} assessmentType - The type of assessment to start (adhd, autism, dyslexia, general)
   * @param {string} language - Language preference for assessment questions (default: 'en')
   * @returns {Promise<Object>} Response containing the assessment session details
   */
  async startAssessment(intakeId, assessmentType, language = 'en') {
    try {
      console.log(
        'Starting assessment with intake ID:',
        intakeId,
        'and type:',
        assessmentType,
        'and language:',
        language
      );

      // First check if intakeId is valid
      if (!intakeId) {
        throw new Error('No intake ID provided. Cannot start assessment.');
      }

      const requestData = { intakeId, language };

      // Add assessment type to request if provided
      if (assessmentType) {
        requestData.assessmentType = assessmentType;
      }

      const response = await api.post('/api/start-assessment', requestData);

      console.log('Assessment started successfully. Response:', response.data);

      // Verify we got a sessionId back
      if (!response.data || !response.data.sessionId) {
        console.error('Missing sessionId in response:', response.data);
        throw new Error('Server response missing session ID. Please try again.');
      }

      return response.data;
    } catch (error) {
      console.error('Error starting assessment:', error);
      console.error('Error details:', error.response?.data || 'No additional error details');

      // Provide more specific error message based on status code
      if (error.response?.status === 404) {
        throw new Error('Intake form not found. Please complete the intake form first.');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to start this assessment.');
      } else if (error.response?.status === 400) {
        throw new Error(error.response.data?.message || 'Invalid request to start assessment.');
      } else if (!error.response) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw error;
    }
  },

  /**
   * List all intakes for the current user
   * @returns {Promise<Array>} Array of intake summary objects
   */
  async listIntakes() {
    try {
      const response = await api.get('/api/intake');
      return response.data;
    } catch (error) {
      console.error('Error listing intakes:', error);
      throw error;
    }
  },

  /**
   * Update an existing intake form
   * @param {string} intakeId - The ID of the intake to update
   * @param {Object} formData - The updated intake form data
   * @returns {Promise<Object>} The updated intake data
   */
  async updateIntake(intakeId, formData) {
    try {
      const response = await api.put(`/api/intake/${intakeId}`, formData);
      return response.data;
    } catch (error) {
      console.error(`Error updating intake with ID ${intakeId}:`, error);
      throw error;
    }
  },
};

export default IntakeService;
