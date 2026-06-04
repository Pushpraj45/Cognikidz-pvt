const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8004';

class ChatService {
  constructor() {
    this.sessionId = null;
    // Ensure we have the correct base URL and add /api/chatbot
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    this.baseURL = `${baseUrl}/api/chatbot`;
  }

  /**
   * Send a message to the chatbot
   * @param {string} message - User message
   * @returns {Promise<Object>} - Bot response
   */
  async sendMessage(message) {
    try {
      const response = await fetch(`${this.baseURL}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: message.trim(),
          sessionId: this.sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Store session ID for context
        this.sessionId = data.data.sessionId;

        return {
          response: data.data.response,
          sessionId: data.data.sessionId,
          timestamp: data.data.timestamp,
          fallback: data.data.fallback || false,
        };
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat service error:', error);

      // Return fallback response for network errors
      return {
        response: this.getFallbackResponse(message),
        sessionId: 'fallback',
        timestamp: new Date().toISOString(),
        fallback: true,
        error: true,
      };
    }
  }

  /**
   * Check chatbot health status
   * @returns {Promise<Object>} - Health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.data : { status: 'unknown' };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get fallback response for offline/error scenarios
   * @param {string} message - User message
   * @returns {string} - Fallback response
   */
  getFallbackResponse(message) {
    const msg = message.toLowerCase();

    if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
      return "Hello! I'm here to help you learn about CogniKidz. While I'm having some technical difficulties, I can still provide basic information. What would you like to know?";
    }

    if (msg.includes('adhd')) {
      return "ADHD affects attention, hyperactivity, and impulse control. CogniKidz offers comprehensive ADHD assessments to help with early detection. You can get started by creating an account and adding your child's profile.";
    }

    if (msg.includes('autism')) {
      return 'Autism affects social communication and behavior. Our autism assessment can help identify potential signs early. Early detection leads to better outcomes and support options.';
    }

    if (msg.includes('dyslexia')) {
      return 'Dyslexia is a learning disorder affecting reading and language processing. Our dyslexia assessment evaluates various aspects of reading and provides personalized recommendations.';
    }

    if (msg.includes('assessment') || msg.includes('test')) {
      return "CogniKidz offers assessments for ADHD, Autism, and Dyslexia. To get started, create an account, add your child's profile, and select an assessment type. The process is guided and takes about 20-30 minutes.";
    }

    if (msg.includes('start') || msg.includes('begin')) {
      return "Getting started is easy! First, sign up for a free account, then create your child's profile, and choose an assessment type. Would you like me to guide you through any specific step?";
    }

    return "I'm here to help with information about CogniKidz and our assessment tools for ADHD, Autism, and Dyslexia. I'm currently experiencing some technical issues, but feel free to explore our website or contact our support team for assistance.";
  }

  /**
   * Reset session (start new conversation)
   */
  resetSession() {
    this.sessionId = null;
  }

  /**
   * Get current session ID
   * @returns {string|null} - Current session ID
   */
  getSessionId() {
    return this.sessionId;
  }
}

export default new ChatService();
