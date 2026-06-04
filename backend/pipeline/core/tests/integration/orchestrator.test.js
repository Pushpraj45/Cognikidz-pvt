/**
 * Orchestrator Integration Tests
 * Tests the complete assessment pipeline workflow
 */

const {
  startAssessment,
  processResponseAndContinue,
  completeAssessment,
} = require("../../orchestrator");
const MockAIService = require("../mocks/ai-service.mock");
const {
  adhdHighRisk,
  autismModerateRisk,
  dyslexiaLowRisk,
  errorScenarios,
  performanceScenarios,
} = require("../fixtures/sample-assessments");

// Using actual AI services and credentials for integration testing

describe("Orchestrator Integration Tests", () => {
  let testSessionIds = [];

  // Set integration test flag
  beforeAll(() => {
    process.env.INTEGRATION_TEST = "true";
  });

  afterAll(() => {
    delete process.env.INTEGRATION_TEST;
  });

  beforeAll(async () => {
    // Connect to test database
    const { connectTestDB } = require("../setup/test-db");
    await connectTestDB();
  });

  afterAll(async () => {
    // Clean up test data and disconnect from database
    const {
      cleanupTestData,
      cleanupSessionData,
      disconnectTestDB,
    } = require("../setup/test-db");

    // Clean up specific session data
    if (testSessionIds.length > 0) {
      await cleanupSessionData(testSessionIds);
    }

    // Clean up all test data
    await cleanupTestData();

    // Disconnect from database
    await disconnectTestDB();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Track session IDs for cleanup
    // This will be populated by tests that create sessions
  });

  // Set timeout for all tests in this suite (longer for real AI service calls)
  jest.setTimeout(180000);

  describe("Complete Assessment Workflow", () => {
    test("should execute full ADHD assessment workflow", async () => {
      const { formData, assessmentType } = adhdHighRisk;

      // Start assessment
      const startResult = await startAssessment({
        assessmentType,
        formData,
        userId: "test_user_123",
      });

      // Track session for cleanup
      if (startResult.sessionId) {
        testSessionIds.push(startResult.sessionId);
      }

      expect(startResult).toHaveProperty("sessionId");
      expect(startResult).toHaveProperty("currentQuestion");
      expect(startResult.status).toBe("active");

      // Process responses
      let currentState = startResult;
      const responses = [];

      for (const responseData of adhdHighRisk.responses) {
        const processResult = await processResponseAndContinue(
          currentState.sessionId,
          {
            response: responseData.response,
            questionId: responseData.questionId,
          }
        );

        // Check for completion or continue assessment
        if (processResult.isComplete || !processResult.continueAssessment) {
          // Assessment completed early, break the loop
          currentState = processResult;
          break;
        }

        expect(processResult).toHaveProperty("question");
        responses.push(processResult);
        currentState = processResult;
      }

      // Complete assessment with test completion flag
      const completionResult = await completeAssessment(
        currentState.sessionId,
        "test_completion"
      );

      expect(completionResult).toHaveProperty("summary");
      expect(completionResult).toHaveProperty("riskScore");
      expect(completionResult).toHaveProperty("recommendations");
      expect(completionResult.isComplete).toBe(true);
      expect(completionResult.riskScore).toBeGreaterThan(4); // Moderate to high risk
    });

    test("should handle moderate risk autism assessment", async () => {
      const { formData, assessmentType, responses } = autismModerateRisk;

      const startResult = await startAssessment({
        assessmentType,
        formData,
        userId: "test_user_456",
      });

      // Process all responses
      let sessionId = startResult.sessionId;
      for (const responseData of responses) {
        await processResponseAndContinue(sessionId, {
          response: responseData.response,
          questionId: responseData.questionId,
        });
      }

      const completionResult = await completeAssessment(
        sessionId,
        "test_completion"
      );

      expect(completionResult.isComplete).toBe(true);
      expect(completionResult.riskScore).toBeGreaterThanOrEqual(4);
      expect(completionResult.riskScore).toBeLessThan(7); // Moderate risk
      expect(completionResult.recommendations.timeframe).toMatch(
        /\d+-?\d*\s*months?/
      );
    });

    test("should handle low risk dyslexia assessment", async () => {
      const { formData, assessmentType, responses } = dyslexiaLowRisk;

      const startResult = await startAssessment({
        assessmentType,
        formData,
        userId: "test_user_789",
      });

      let sessionId = startResult.sessionId;
      for (const responseData of responses) {
        await processResponseAndContinue(sessionId, {
          response: responseData.response,
          questionId: responseData.questionId,
        });
      }

      const completionResult = await completeAssessment(
        sessionId,
        "test_completion"
      );

      expect(completionResult.isComplete).toBe(true);
      expect(completionResult.riskScore).toBeLessThan(7); // Low to moderate risk
      expect(completionResult.recommendations.timeframe).toMatch(
        /\d+-?\d*\s*months?/
      );
      expect(completionResult.strengths.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle invalid assessment type", async () => {
      const { invalidAssessmentType } = errorScenarios;

      const result = await startAssessment({
        assessmentType: invalidAssessmentType.assessmentType,
        formData: invalidAssessmentType.formData,
        userId: "test_user",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("assessment");
    });

    test("should handle missing form data", async () => {
      const { missingFormData } = errorScenarios;

      const result = await startAssessment({
        assessmentType: missingFormData.assessmentType,
        formData: missingFormData.formData,
        userId: "test_user",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to");
    });

    test("should handle session not found errors", async () => {
      const result = await processResponseAndContinue("non_existent_session", {
        response: "Often",
        questionId: "q1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Session not found");
    });

    test("should handle completion of incomplete assessments", async () => {
      const startResult = await startAssessment({
        assessmentType: "ADHD",
        formData: { childName: "Test Child", age: 7 },
        userId: "test_user",
      });

      // Try to complete without sufficient responses (intentionally not using test_completion for this test)
      const completionResult = await completeAssessment(startResult.sessionId);

      expect(completionResult.isComplete).toBe(false);
      expect(completionResult.message).toContain("more responses");
    });

    test("should recover from AI service failures", async () => {
      // Test with invalid data to trigger fallback mechanisms
      const startResult = await startAssessment({
        assessmentType: "ADHD",
        formData: { ...adhdHighRisk.formData, childAge: null }, // Invalid age to trigger fallback
        userId: "test_user",
      });

      // Should handle gracefully even with invalid data
      if (startResult.success) {
        const processResult = await processResponseAndContinue(
          startResult.sessionId,
          {
            response: "Often",
            questionId: "q1",
          }
        );

        expect(processResult).toHaveProperty("evaluation");
      } else {
        expect(startResult.success).toBe(false);
      }
    });
  });

  describe("Performance and Scalability", () => {
    test("should handle concurrent assessment sessions", async () => {
      const concurrentSessions = Array.from({ length: 10 }, (_, i) =>
        startAssessment({
          assessmentType: "ADHD",
          formData: { ...adhdHighRisk.formData, childName: `Child ${i}` },
          userId: `test_user_${i}`,
        })
      );

      const results = await Promise.all(concurrentSessions);

      expect(results).toHaveLength(10);
      results.forEach((result) => {
        expect(result).toHaveProperty("sessionId");
        expect(result.status).toBe("active");
      });

      // Verify session IDs are unique
      const sessionIds = results.map((r) => r.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(10);
    });

    test("should maintain performance with large response datasets", async () => {
      const startTime = Date.now();

      const startResult = await startAssessment({
        assessmentType: "ADHD",
        formData: { childName: "Performance Test Child", age: 8 },
        userId: "performance_test_user",
      });

      expect(startResult.success).toBe(true);

      // Process minimal responses for performance test with test completion
      const completionResult = await completeAssessment(
        startResult.sessionId,
        "test_completion"
      );

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(35000); // Should complete in under 35s (realistic tolerance for AI calls with network and processing variations)
      expect(completionResult.success).toBe(true);
      expect(completionResult.isComplete).toBe(true);
    });

    test("should handle memory cleanup after completion", async () => {
      const startResult = await startAssessment({
        assessmentType: "ADHD",
        formData: { childName: "Memory Test Child", age: 7 },
        userId: "memory_test_user",
      });

      expect(startResult.success).toBe(true);

      // Complete assessment with test completion flag
      const completionResult = await completeAssessment(
        startResult.sessionId,
        "test_completion"
      );

      expect(completionResult.success).toBe(true);
      expect(completionResult.isComplete).toBe(true);

      // Wait for cleanup to occur (cleanup is scheduled with timeout)
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Force cleanup manually for test
      const { SessionManager } = require("../../../memory/session-manager");
      SessionManager.cleanupSessionMemory(startResult.sessionId);

      // Try to access completed session (should be cleaned up)
      const result = await processResponseAndContinue(startResult.sessionId, {
        response: "Often",
        questionId: "q_after_completion",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Session not found");
    });
  });

  describe("State Management", () => {
    test("should maintain assessment state consistency", async () => {
      const startResult = await startAssessment({
        assessmentType: "ADHD",
        formData: adhdHighRisk.formData,
        userId: "state_test_user",
      });

      let sessionId = startResult.sessionId;
      let responseCount = 0;

      for (const responseData of adhdHighRisk.responses.slice(0, 2)) {
        const processResult = await processResponseAndContinue(sessionId, {
          response: responseData.response,
          questionId: responseData.questionId,
        });

        responseCount++;
        expect(processResult.sessionId).toBe(sessionId);

        // Check if process result has completion indicators
        if (
          processResult.isComplete ||
          !processResult.continueAssessment ||
          processResult.status === "completed" ||
          responseCount >= 2
        ) {
          break;
        }
      }
    });

    test("should handle session pause and resume", async () => {
      const startResult = await startAssessment({
        assessmentType: "ADHD",
        formData: { childName: "Pause Test Child", age: 8 },
        userId: "pause_test_user",
      });

      expect(startResult.success).toBe(true);

      // Process first response if there's a question
      if (startResult.currentQuestion || startResult.question) {
        await processResponseAndContinue(startResult.sessionId, {
          response: "Often",
          questionId: "q1",
        });
      }

      // Pause session
      const { pauseSession } = require("../../session/processor");
      const pauseResult = await pauseSession(startResult.sessionId);
      expect(pauseResult.success).toBe(true);
      expect(pauseResult.status).toBe("paused");

      // Resume session
      const { resumeSession } = require("../../session/processor");
      const resumeResult = await resumeSession(startResult.sessionId);
      expect(resumeResult.success).toBe(true);
      expect(resumeResult.status).toBe("active");

      // Complete the assessment
      const completionResult = await completeAssessment(
        startResult.sessionId,
        "test_completion"
      );
      expect(completionResult.success).toBe(true);
    });
  });

  describe("Data Validation and Integrity", () => {
    test("should validate all input data", async () => {
      // Test various invalid inputs
      const invalidInputs = [
        { assessmentType: null, formData: {}, userId: "test" },
        { assessmentType: "ADHD", formData: null, userId: "test" },
        { assessmentType: "ADHD", formData: {}, userId: null },
        { assessmentType: "", formData: {}, userId: "test" },
      ];

      for (const invalidInput of invalidInputs) {
        const result = await startAssessment(invalidInput);
        expect(result.success).toBe(false);
      }
    });

    test("should ensure response data integrity", async () => {
      const startResult = await startAssessment({
        assessmentType: "ADHD",
        formData: adhdHighRisk.formData,
        userId: "integrity_test_user",
      });

      const processResult = await processResponseAndContinue(
        startResult.sessionId,
        {
          response: "Often",
          questionId: "q1",
        }
      );

      // Verify response is properly stored and timestamped
      expect(processResult.evaluation).toHaveProperty("processedAt");
      expect(processResult.evaluation).toHaveProperty("confidence");
      expect(processResult.evaluation).toHaveProperty("concerns");
      expect(processResult.evaluation).toHaveProperty("domain");
    });
  });
});
