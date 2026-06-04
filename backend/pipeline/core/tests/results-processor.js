/**
 * Jest Results Processor
 * Custom test results processing and reporting
 */

const fs = require('fs');
const path = require('path');

class PipelineTestResultsProcessor {
  constructor(results) {
    this.results = results;
    this.reportDir = path.join(__dirname, 'reports');
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  process() {
    console.log('\n📊 Processing test results...');
    
    const summary = this.generateSummary();
    const performance = this.analyzePerformance();
    const coverage = this.processCoverage();
    const quality = this.calculateQualityMetrics();
    
    this.generateDetailedReport({ summary, performance, coverage, quality });
    this.generateConsoleOutput(summary);
    
    return this.results;
  }

  generateSummary() {
    const { testResults, numFailedTests, numPassedTests, numTotalTests } = this.results;
    
    const summary = {
      total: numTotalTests,
      passed: numPassedTests,
      failed: numFailedTests,
      passRate: numTotalTests > 0 ? ((numPassedTests / numTotalTests) * 100).toFixed(1) : 0,
      suites: testResults.length,
      duration: this.results.startTime ? Date.now() - this.results.startTime : 0,
    };

    // Categorize by test type
    summary.byType = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 },
    };

    testResults.forEach(suite => {
      const type = this.getTestType(suite.testFilePath);
      summary.byType[type].total += suite.numPassingTests + suite.numFailingTests;
      summary.byType[type].passed += suite.numPassingTests;
      summary.byType[type].failed += suite.numFailingTests;
    });

    return summary;
  }

  getTestType(testFilePath) {
    if (testFilePath.includes('/unit/')) return 'unit';
    if (testFilePath.includes('/integration/')) return 'integration';
    if (testFilePath.includes('/performance/')) return 'performance';
    return 'unit'; // default
  }

  analyzePerformance() {
    const slowTests = [];
    const fastestTests = [];
    let totalDuration = 0;

    this.results.testResults.forEach(suite => {
      suite.testResults.forEach(test => {
        totalDuration += test.duration || 0;
        
        if (test.duration > 1000) { // Slow tests > 1s
          slowTests.push({
            name: test.fullName,
            duration: test.duration,
            file: suite.testFilePath,
          });
        }
        
        if (test.duration < 50 && test.status === 'passed') { // Fast tests < 50ms
          fastestTests.push({
            name: test.fullName,
            duration: test.duration,
            file: suite.testFilePath,
          });
        }
      });
    });

    return {
      totalDuration,
      averageDuration: totalDuration / (this.results.numTotalTests || 1),
      slowTests: slowTests.sort((a, b) => b.duration - a.duration).slice(0, 5),
      fastestTests: fastestTests.sort((a, b) => a.duration - b.duration).slice(0, 5),
    };
  }

  processCoverage() {
    if (!this.results.coverageMap) {
      return { available: false };
    }

    // Basic coverage processing
    return {
      available: true,
      summary: this.results.coverageMap.getCoverageSummary(),
      // Add more detailed coverage analysis here if needed
    };
  }

  calculateQualityMetrics() {
    const { testResults } = this.results;
    
    let totalAssertions = 0;
    let flaky = 0;
    let reliable = 0;

    testResults.forEach(suite => {
      suite.testResults.forEach(test => {
        totalAssertions += test.numExpectations || 0;
        
        // Simple heuristic for test reliability
        if (test.status === 'passed' && test.duration < 1000) {
          reliable++;
        } else if (test.status === 'failed' && test.failureMessages.length > 0) {
          // Check for potential flakiness indicators
          const hasTimeoutError = test.failureMessages.some(msg => 
            msg.includes('timeout') || msg.includes('async')
          );
          if (hasTimeoutError) flaky++;
        }
      });
    });

    return {
      totalAssertions,
      averageAssertionsPerTest: totalAssertions / (this.results.numTotalTests || 1),
      reliability: {
        reliable,
        flaky,
        score: reliable / (reliable + flaky || 1) * 100,
      },
    };
  }

  generateDetailedReport(data) {
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'jest',
      version: '1.0.0',
      ...data,
      raw: {
        numTotalTests: this.results.numTotalTests,
        numPassedTests: this.results.numPassedTests,
        numFailedTests: this.results.numFailedTests,
        numRuntimeErrorTestSuites: this.results.numRuntimeErrorTestSuites,
      },
    };

    const reportPath = path.join(this.reportDir, 'detailed-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📝 Detailed report saved: ${reportPath}`);
  }

  generateConsoleOutput(summary) {
    console.log('\n🎯 PIPELINE TEST RESULTS');
    console.log('=' .repeat(50));
    
    // Overall summary
    console.log(`📊 Overall: ${summary.passed}/${summary.total} tests passed (${summary.passRate}%)`);
    console.log(`⏱️  Duration: ${summary.duration}ms`);
    console.log(`📁 Test Suites: ${summary.suites}`);
    
    // By type
    console.log('\n📋 By Type:');
    Object.entries(summary.byType).forEach(([type, stats]) => {
      if (stats.total > 0) {
        const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
        console.log(`  ${type.padEnd(12)}: ${stats.passed}/${stats.total} (${passRate}%)`);
      }
    });
    
    // Quality grade
    const grade = this.getQualityGrade(parseFloat(summary.passRate));
    console.log(`\n🏆 Quality Grade: ${grade}`);
    
    // Status message
    if (summary.failed === 0) {
      console.log('🎉 All tests passed! Pipeline is ready.');
    } else {
      console.log(`⚠️  ${summary.failed} test(s) failed. Review and fix issues.`);
    }
    
    console.log('=' .repeat(50));
  }

  getQualityGrade(passRate) {
    if (passRate >= 95) return 'A+ (Excellent)';
    if (passRate >= 90) return 'A (Very Good)';
    if (passRate >= 80) return 'B (Good)';
    if (passRate >= 70) return 'C (Fair)';
    if (passRate >= 60) return 'D (Poor)';
    return 'F (Failing)';
  }
}

module.exports = (results) => {
  const processor = new PipelineTestResultsProcessor(results);
  return processor.process();
}; 