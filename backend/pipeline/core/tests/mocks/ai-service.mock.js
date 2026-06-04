/**
 * AI Service Mock
 * Simulates OpenAI API responses for testing
 */

const { mockAIResponse } = require('./test-data');

class MockAIService {
  constructor() {
    this.callCount = 0;
    this.lastPrompt = null;
    this.shouldFail = false;
    this.delay = 0;
  }

  /**
   * Mock OpenAI chat completion
   */
  async createChatCompletion(options) {
    this.callCount++;
    this.lastPrompt = options.messages;

    // Simulate delay if specified
    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    // Simulate failure if specified
    if (this.shouldFail) {
      throw new Error('Mock AI service failure');
    }

    // Return mock response based on content
    const content = this.generateMockContent(options);
    
    return {
      ...mockAIResponse,
      choices: [{
        message: {
          content
        }
      }]
    };
  }

  /**
   * Generate appropriate mock content based on prompt
   */
  generateMockContent(options) {
    const messages = options.messages || [];
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || '';

    // Different responses based on prompt content
    if (prompt.includes('generate summary report')) {
      return this.getMockSummaryReport();
    }
    
    if (prompt.includes('evaluate response')) {
      return this.getMockResponseEvaluation();
    }

    if (prompt.includes('risk assessment')) {
      return this.getMockRiskAssessment();
    }

    // Default response
    return mockAIResponse.choices[0].message.content;
  }

  getMockSummaryReport() {
    return `# Assessment Summary Report for Alex Johnson

## Assessment Overview
Alex Johnson, age 7, has completed an ADHD assessment with comprehensive evaluation. Based on the responses, there are indicators that warrant professional consultation and monitoring.

## Strengths and Positive Indicators
- Creative thinking and problem-solving abilities
- Good social interaction with peers
- Responds well to positive reinforcement
- Shows engagement in hands-on learning activities

## Areas Requiring Attention
- Attention to detail needs improvement
- Organizational skills require development
- May benefit from structured routines
- Consider classroom accommodations

## Specific Recommendations
- Implement visual schedules and reminders
- Provide movement breaks during learning
- Consider consultation with school counselor
- Monitor progress with structured activities

## Follow-Up Schedule
- Schedule follow-up assessment in 3 months
- Monitor classroom behavior weekly
- Implement recommended strategies for 6 weeks`;
  }

  getMockResponseEvaluation() {
    return JSON.stringify({
      confidence: 0.8,
      concerns: ['Attention difficulties'],
      strengths: ['Good communication'],
      domain: 'Attention',
      riskIndicators: {
        riskScore: 0.6,
        indicators: ['attention_concern']
      }
    });
  }

  getMockRiskAssessment() {
    return JSON.stringify({
      overallRisk: 'moderate',
      riskScore: 6,
      primaryConcerns: ['Attention', 'Organization'],
      recommendedActions: ['Professional consultation', 'Classroom accommodations']
    });
  }

  /**
   * Test utilities
   */
  reset() {
    this.callCount = 0;
    this.lastPrompt = null;
    this.shouldFail = false;
    this.delay = 0;
  }

  setFailure(shouldFail = true) {
    this.shouldFail = shouldFail;
  }

  setDelay(ms) {
    this.delay = ms;
  }

  getCallCount() {
    return this.callCount;
  }

  getLastPrompt() {
    return this.lastPrompt;
  }
}

module.exports = MockAIService; 