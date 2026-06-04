# Pipeline Testing & Quality Assurance

## Overview

This testing suite provides comprehensive coverage for the refactored modular assessment pipeline. The testing strategy includes unit tests, integration tests, performance benchmarks, and code quality analysis.

## Test Structure

```folder
tests/
├── unit/                          # Unit tests for individual modules
│   ├── scoring/
│   │   └── risk-calculator.test.js
│   ├── summary/
│   │   └── ai-service.test.js
│   ├── session/
│   │   ├── starter.test.js
│   │   ├── processor.test.js
│   │   └── completer.test.js
│   └── utils/
│       └── validators.test.js
├── integration/                   # Integration tests for workflows
│   └── orchestrator.test.js
├── mocks/                        # Mock data and services
│   ├── test-data.js
│   └── ai-service.mock.js
├── fixtures/                     # Test scenarios and data
│   └── sample-assessments.js
├── test-runner.js               # Main test runner and quality analyzer
└── README.md                    # This documentation
```

## Running Tests

### Run All Tests

```bash
# From the core directory
node tests/test-runner.js
```

### Run Individual Test Categories

```bash
# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration

# Specific module tests
npm test -- scoring/risk-calculator.test.js
```

### Performance Benchmarks

```bash
# Run performance tests with detailed metrics
node tests/test-runner.js --performance
```

## Test Categories

### 1. Unit Tests

#### Risk Calculator (`risk-calculator.test.js`)

- Tests risk score calculations
- Validates risk level categorization
- Checks risk factor analysis
- Performance and error handling

#### AI Service (`ai-service.test.js`)

- Tests AI integration and responses
- Validates response processing
- Checks error recovery and timeouts
- Performance under load

#### Session Management

- `starter.test.js`: Session initialization
- `processor.test.js`: Response processing
- `completer.test.js`: Assessment completion

### 2. Integration Tests

**Orchestrator (`orchestrator.test.js`)**

- Complete assessment workflows
- End-to-end ADHD, Autism, Dyslexia assessments
- Error handling and edge cases
- Performance and scalability
- State management
- Data validation and integrity

### 3. Test Fixtures

**Sample Assessments (`sample-assessments.js`)**

- High-risk ADHD scenario
- Moderate-risk Autism scenario
- Low-risk Dyslexia scenario
- Incomplete assessment handling
- Error scenarios
- Performance test data

## Quality Metrics

The test runner analyzes multiple quality dimensions:

### Code Quality

- **Lines of Code**: Module size analysis
- **Cyclomatic Complexity**: Code complexity measurement
- **Maintainability Index**: Overall maintainability score
- **Function Count**: Modularity assessment

### Test Coverage

- **Unit Test Coverage**: Individual module testing
- **Integration Coverage**: Workflow testing
- **Pass Rate**: Success rate of all tests

### Performance

- **Response Processing**: Time to process responses
- **Summary Generation**: AI summary generation time
- **Risk Calculation**: Risk scoring performance
- **Memory Usage**: Peak memory consumption

### Quality Scoring

The overall quality score is calculated as:

- **40%** Code Maintainability
- **40%** Test Pass Rate
- **20%** Performance Score

**Grade Scale:**

- A (90-100): Outstanding quality
- B (80-89): Good quality
- C (70-79): Fair quality
- D (60-69): Poor quality
- F (<60): Failing quality

## Mock Services

### AI Service Mock (`ai-service.mock.js`)

- Simulates OpenAI API responses
- Configurable delays and failures
- Different response types based on prompts
- Performance testing capabilities

### Test Data (`test-data.js`)

- Standardized mock data
- Child profiles and intake forms
- Assessment states and responses
- AI responses and validation data

## Quality Recommendations

The test runner provides automated recommendations:

### High Severity

- Modules with complexity > 20
- Maintainability < 60%
- Critical performance issues

### Medium Severity

- Large modules (>300 lines)
- Moderate performance issues
- Test coverage gaps

### Best Practices

- Keep modules under 300 lines
- Maintain complexity under 15
- Achieve >90% test pass rate
- Response times under 100ms

## Continuous Integration

### Pre-commit Checks

```bash
# Run before committing
npm run test:quality
```

### CI Pipeline Integration

```yaml
# GitHub Actions example
- name: Run Quality Tests
  run: |
    cd backend/pipeline/core
    node tests/test-runner.js
    if [ $? -ne 0 ]; then exit 1; fi
```

## Test Development Guidelines

### Writing Unit Tests

1. **Focus on single responsibility**
2. **Use descriptive test names**
3. **Test both happy and error paths**
4. **Mock external dependencies**
5. **Assert on specific outcomes**

### Writing Integration Tests

1. **Test complete workflows**
2. **Use realistic test data**
3. **Test error recovery**
4. **Validate state consistency**
5. **Check performance bounds**

### Adding New Tests

1. **Create test file in appropriate directory**
2. **Follow naming convention: `*.test.js`**
3. **Add to relevant test fixtures**
4. **Update documentation**
5. **Run quality analysis**

## Debugging Failed Tests

### Common Issues

- **Mock service not reset**: Call `mockService.reset()` in `beforeEach`
- **Async timing**: Use proper `await` for async operations
- **State pollution**: Ensure proper test isolation
- **Memory leaks**: Check for unclosed resources

### Debug Tools

```bash
# Verbose test output
npm test -- --verbose

# Debug specific test
node --inspect-brk tests/unit/scoring/risk-calculator.test.js
```

## Performance Benchmarks (WIP)

### Target Metrics

- **Response Processing**: <100ms average
- **Risk Calculation**: <50ms average
- **Summary Generation**: <2000ms average
- **Memory Usage**: <100MB peak
- **Concurrent Sessions**: Support 10+ simultaneous

### Load Testing

```bash
# Simulate high load
node tests/test-runner.js --load-test --sessions=50
```

## Quality Report

The test runner generates a detailed quality report:

```json
{
  "timestamp": "2024-12-27T10:30:00.000Z",
  "summary": {
    "qualityScore": 87,
    "grade": "B",
    "unitTests": { "passed": 45, "total": 50, "passRate": "90.0%" },
    "integrationTests": { "passed": 18, "total": 20, "passRate": "90.0%" }
  },
  "recommendations": [
    {
      "type": "complexity",
      "severity": "medium",
      "message": "Consider refactoring complex functions"
    }
  ]
}
```

## Future Enhancements

### Planned Improvements

1. **Visual test reports** with charts
2. **Code coverage integration** with nyc/istanbul
3. **Mutation testing** for test quality
4. **Automated performance regression detection**
5. **Integration with monitoring tools**

### Testing Roadmap

- [ ] Add visual regression tests
- [ ] Implement property-based testing
- [ ] Add chaos engineering tests
- [ ] Create performance baseline tracking
- [ ] Integrate with CI/CD pipeline

## Contributing

When contributing to the pipeline:

1. **Run tests locally** before submitting PR
2. **Add tests for new functionality**
3. **Maintain or improve quality score**
4. **Update documentation** as needed
5. **Follow testing conventions**

## Support

For questions about testing:

- Check existing test examples
- Review mock services documentation
- Run quality analysis for guidance
- Refer to integration test patterns
