# Cognikidz Assessment Pipeline - API Reference

## Overview

The Cognikidz Assessment Pipeline v2.0 provides a comprehensive API for conducting AI-powered developmental assessments. This document covers all available functions, their parameters, return values, and usage examples.

## Main Pipeline Functions

### `startAssessment(data)`

Initializes a new assessment session and generates the first question.

#### Parameters

```javascript
{
  assessmentType: string,     // 'autism', 'adhd', 'dyslexia', 'general'
  formData: {
    childName: string,        // Child's name
    childAge: number,         // Child's age in years
    concerns: string[],       // Array of primary concerns
    familyHistory: string,    // Family history information
    developmentalHistory: string, // Developmental milestones
    sensorySensitivities: string, // Sensory issues
    strengths: string,        // Areas of strength
    // ... additional form fields
  }
}
```

#### Returns

```javascript
{
  success: boolean,
  sessionId: string,          // Unique session identifier
  assessmentType: string,     // Type of assessment started
  metadata: object,           // Assessment metadata
  question: {
    id: string,               // Question identifier
    question: string,         // Question text
    type: string,             // Question type (SCALE, BINARY, etc.)
    options: string[],        // Available response options
    domain: string,           // Assessment domain
    difficulty: number        // Question difficulty (1-5)
  },
  questionMetadata: object,   // Additional question metadata
  progress: {
    currentQuestion: number,  // Current question number
    totalQuestions: number,   // Estimated total questions
    percentComplete: number   // Progress percentage
  },
  startedAt: string          // ISO timestamp
}
```

#### Example

```javascript
const result = await pipeline.startAssessment({
  assessmentType: 'autism',
  formData: {
    childName: 'Alex Johnson',
    childAge: 6,
    concerns: ['social interaction', 'communication'],
    familyHistory: 'Cousin has autism diagnosis',
    developmentalHistory: 'Speech delayed until age 3',
    sensorySensitivities: 'Sensitive to loud noises',
    strengths: 'Excellent memory, loves puzzles'
  }
});

console.log(result.sessionId); // "session_1234567890_abcd1234"
console.log(result.question.question); // "How often does Alex make eye contact..."
```

### `processResponse(sessionId, responseData)`

Processes a user response and generates the next question or completes the assessment.

#### Parameters - `processResponse(sessionId, responseData)`

```javascript
sessionId: string,           // Session identifier from startAssessment
responseData: {
  questionId: string,        // ID of the question being answered
  response: string,          // User's response
  timestamp: string          // Optional timestamp
}
```

#### Returns - `processResponse(sessionId, responseData)`

```javascript
{
  success: boolean,
  sessionId: string,
  question: object,          // Next question (if continuing)
  questionMetadata: object,  // Question metadata
  responseProcessing: {
    evaluation: string,      // Response evaluation
    riskIndicators: string[], // Identified risk indicators
    followUp: object         // Follow-up recommendations
  },
  progress: {
    currentQuestion: number,
    totalQuestions: number,
    percentComplete: number
  },
  continueAssessment: boolean, // Whether to continue
  isComplete: boolean,       // Whether assessment is complete
  summary: object            // Final summary (if complete)
}
```

#### Example - `processResponse(sessionId, responseData)`

```javascript
const response = await pipeline.processResponse(sessionId, {
  questionId: 'autism_question_1234567890',
  response: 'Sometimes'
});

if (response.continueAssessment) {
  console.log('Next question:', response.question.question);
} else {
  console.log('Assessment complete:', response.summary);
}
```

### `generateSummary(sessionId)`

Generates a comprehensive assessment summary and recommendations.

#### Parameters - `generateSummary(sessionId)`

```javascript
sessionId: string           // Session identifier
```

#### Returns - `generateSummary(sessionId)`

```javascript
{
  success: boolean,
  sessionId: string,
  summary: {
    overallRiskScore: number,     // Overall risk score (0-100)
    riskLevel: string,            // 'Low', 'Moderate', 'High'
    domainScores: {
      [domain]: {
        score: number,            // Domain-specific score
        riskLevel: string,        // Domain risk level
        keyFindings: string[]     // Key findings for domain
      }
    },
    keyFindings: string[],        // Overall key findings
    recommendations: {
      immediate: string[],        // Immediate recommendations
      shortTerm: string[],        // Short-term recommendations
      longTerm: string[]          // Long-term recommendations
    },
    followUpSchedule: {
      nextAssessment: string,     // Recommended next assessment
      timeframe: string,          // Timeframe for follow-up
      specialists: string[]       // Recommended specialists
    },
    chartsData: object,          // Data for charts/visualizations
    confidence: number,          // Assessment confidence (0-100)
    completedAt: string         // Completion timestamp
  }
}
```

#### Example - `generateSummary(sessionId)`

```javascript
const summary = await pipeline.generateSummary(sessionId);

console.log('Risk Level:', summary.summary.riskLevel);
console.log('Key Findings:', summary.summary.keyFindings);
console.log('Recommendations:', summary.summary.recommendations.immediate);
```

## Discovery Functions

### `getAvailableAssessmentTypes()`

Returns all available assessment types.

#### Returns - `getAvailableAssessmentTypes()`

```javascript
string[]  // ['autism', 'adhd', 'dyslexia', 'general']
```

### `getAgeAppropriateAssessments(ageInMonths)`

Returns assessment types appropriate for the given age.

#### Parameters - `getAgeAppropriateAssessments(ageInMonths)`

```javascript
ageInMonths: number         // Child's age in months
```

#### Returns - `getAgeAppropriateAssessments(ageInMonths)`

```javascript
string[]                   // Array of appropriate assessment types
```

### `getRecommendedAssessmentSequence(ageInMonths, concerns)`

Returns recommended assessment sequence based on age and concerns.

#### Parameters - `getRecommendedAssessmentSequence(ageInMonths, concerns)`

```javascript
ageInMonths: number,       // Child's age in months
concerns: string[]         // Array of concern areas
```

#### Returns - `getRecommendedAssessmentSequence(ageInMonths, concerns)`

```javascript
string[]                   // Recommended assessment sequence
```

## Validation Functions

### `validateAssessmentData(data)`

Validates assessment data before starting an assessment.

#### Parameters - `validateAssessmentData(data)`

```javascript
data: object              // Assessment data to validate
```

#### Returns - `validateAssessmentData(data)`

```javascript
{
  isValid: boolean,
  errors: string[]        // Array of validation errors (if any)
}
```

## Utility Functions

### `getStatus()`

Returns current pipeline status and loaded modules.

#### Returns - `getStatus()`

```javascript
{
  version: string,        // Pipeline version
  initialized: boolean,   // Whether pipeline is initialized
  modules: {
    [moduleName]: boolean // Module loading status
  }
}
```

### `cleanup()`

Performs cleanup of sessions and memory.

#### Returns - `cleanup()`

```javascript
Promise<void>
```

## Module Access

### `modules`

Direct access to pipeline modules for advanced usage.

#### Structure - `modules`

```javascript
{
  core: {
    modules: {
      questionGenerator: object,
      responseProcessor: object,
      assessmentOrchestrator: object
    }
  },
  config: {
    constants: object,
    aiConfig: object,
    memoryConfig: object,
    validateEnvironment: function,
    getLLMInstance: function
  },
  memory: {
    SessionManager: object,
    SimpleMemory: object,
    MemoryCleaner: object
  },
  prompts: {
    adhd: object,
    autism: object,
    dyslexia: object,
    general: object,
    inline: object,
    utilities: object
  },
  resources: {
    toolSelector: object,
    autismTools: object,
    adhdTools: object,
    dyslexiaTools: object
  },
  utils: {
    validators: object,
    formatters: object,
    parsers: object,
    domainCalculator: object,
    chartGenerator: object
  }
}
```

## Error Handling

### Common Error Types

#### Configuration Errors - `Configuration Errors`

```javascript
{
  success: false,
  error: 'Configuration validation failed',
  details: 'AZURE_OPENAI_API_KEY environment variable is required'
}
```

#### Session Errors - `Session Errors`

```javascript
{
  success: false,
  error: 'Session not found',
  details: 'Invalid session ID or expired session'
}
```

#### Validation Errors - `Validation Errors`

```javascript
{
  success: false,
  error: 'Invalid assessment data',
  details: ['childAge is required', 'assessmentType must be valid']
}
```

#### AI Service Errors - `AI Service Errors`

```javascript
{
  success: false,
  error: 'Failed to generate question',
  details: 'OpenAI API authentication failed'
}
```

## Best Practices

### 1. Error Handling - `Error Handling`

```javascript
try {
  const result = await pipeline.startAssessment(data);
  if (!result.success) {
    console.error('Assessment failed:', result.error);
    return;
  }
  // Process successful result
} catch (error) {
  console.error('Unexpected error:', error.message);
}
```

### 2. Session Management - `Session Management`

```javascript
// Always check if session exists before processing
const validation = pipeline.validateSessionId(sessionId);
if (!validation.isValid) {
  // Handle invalid session
  return;
}
```

### 3. Data Validation - `Data Validation`

```javascript
// Validate data before starting assessment
const validation = pipeline.validateAssessmentData(assessmentData);
if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
  return;
}
```

### 4. Cleanup - `Cleanup`

```javascript
// Perform cleanup when done
process.on('exit', async () => {
  await pipeline.cleanup();
});
```

## Rate Limits and Quotas

- **Concurrent Sessions**: Maximum 100 active sessions
- **Session Timeout**: 30 minutes of inactivity
- **API Calls**: Limited by Azure OpenAI quotas
- **Memory Usage**: Automatic cleanup every 5 minutes

## Testing

### Test Function - `Test Function`

```javascript
// Run comprehensive tests
const testResults = await require('./test').runAllTests();
```

### Manual Testing - `Manual Testing`

```javascript
// Test individual components
const status = pipeline.getStatus();
const types = pipeline.getAvailableAssessmentTypes();
const validation = pipeline.validateAssessmentData(testData);
```

## Migration from v1.x

### Key Changes

- Modular architecture replaces monolithic `graph.js`
- New `pipeline.startAssessment()` instead of `startAssessment()`
- Enhanced error handling and validation
- Improved memory management
- Comprehensive testing suite

### Migration Example

```javascript
// Old v1.x approach
const { startAssessment } = require('./graph');
const result = await startAssessment(intakeDoc);

// New v2.0 approach  
const pipeline = require('./index');
const result = await pipeline.startAssessment({
  assessmentType: 'autism',
  formData: extractFormData(intakeDoc)
});
```

---

For additional support, refer to the [main documentation](README.md) or run the test suite with `node test.js`.
