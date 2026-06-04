// Models will be imported dynamically to avoid circular dependencies
let Assessment, ChildProfile;

/**
 * Report Generation Service
 * Determines when and what type of reports to generate using LLMs
 */
class ReportGenerator {
  
  /**
   * Main entry point: Check if reports should be generated after game completion
   * @param {string} childId - Child's ID
   * @param {string} gameId - Completed game ID  
   * @param {Object} gameData - Game performance data
   * @returns {Promise<Object>} Report generation decisions
   */
  async checkReportTriggers(childId, gameId, gameData) {
    try {
      console.log(`🎯 Checking report triggers for child ${childId}, game ${gameId}`);
      
      const triggers = await this.evaluateAllTriggers(childId, gameId, gameData);
      const reportActions = [];
      
      // Individual Game Milestone (every 3rd, 5th, 10th play)
      if (triggers.individualGameMilestone) {
        reportActions.push({
          type: 'mini-report',
          priority: 'low',
          trigger: 'individual-game-milestone',
          gameId: gameId,
          data: triggers.individualGameMilestone
        });
      }
      
      // Progressive Suite Completion
      if (triggers.progressiveSuiteCompleted) {
        reportActions.push({
          type: 'suite-progress-report', 
          priority: 'high',
          trigger: 'suite-completion',
          suiteType: triggers.progressiveSuiteCompleted.suiteType,
          data: triggers.progressiveSuiteCompleted
        });
      }
      
      // Complete Assessment Battery
      if (triggers.batteryCompleted) {
        reportActions.push({
          type: 'comprehensive-assessment-report',
          priority: 'critical',
          trigger: 'battery-completion',
          assessmentType: triggers.batteryCompleted.assessmentType,
          data: triggers.batteryCompleted
        });
      }
      
      // Significant Progress Detection
      if (triggers.significantProgress) {
        reportActions.push({
          type: 'progress-alert-report',
          priority: 'medium', 
          trigger: 'significant-progress',
          improvementArea: triggers.significantProgress.area,
          data: triggers.significantProgress
        });
      }
      
      // Concern Pattern Detection
      if (triggers.concernsDetected) {
        reportActions.push({
          type: 'concern-alert-report',
          priority: 'high',
          trigger: 'concerns-detected', 
          concernArea: triggers.concernsDetected.area,
          data: triggers.concernsDetected
        });
      }
      
      const result = {
        shouldGenerateReports: reportActions.length > 0,
        reportActions: reportActions.sort((a, b) => 
          this.getPriorityWeight(a.priority) - this.getPriorityWeight(b.priority)
        )
      };

      // If reports should be generated, process them
      if (result.shouldGenerateReports) {
        const childProfile = await ChildProfile.findById(childId);
        result.generatedReports = await this.processReportTriggers(result.reportActions, childProfile, gameData);
      }

      return result;
      
    } catch (error) {
      console.error('Error checking report triggers:', error);
      return { shouldGenerateReports: false, reportActions: [] };
    }
  }

  /**
   * Process detected triggers and generate reports using LLM
   */
  async processReportTriggers(reportActions, childProfile, performanceData) {
    const processedReports = [];
    
    for (const action of reportActions) {
      try {
        console.log(`📊 Processing ${action.type} trigger for ${childProfile.firstName}`);
        
        // Import LLM service dynamically to avoid circular dependencies
        const LLMReportService = require('./llm-report-service');
        const llmService = new LLMReportService();
        
        // Generate report using LLM
        const report = await llmService.generateReport(action, childProfile, performanceData);
        
        // Send email notification for high-priority reports
        if (report.priority === 'high' || report.priority === 'critical') {
          try {
            const EmailNotificationService = require('./email-notification-service');
            const emailResult = await EmailNotificationService.sendHighPriorityNotification(report);
            console.log(`📧 Email notification result:`, emailResult);
          } catch (emailError) {
            console.error('❌ Error sending email notification:', emailError);
            // Don't fail report generation if email fails
          }
        }
        
        processedReports.push({
          type: action.type,
          status: 'completed',
          trigger: action.trigger,
          priority: action.priority,
          reportId: report.reportId,
          emailSent: report.priority === 'high' || report.priority === 'critical',
          timestamp: new Date()
        });
        
        console.log(`✅ Successfully generated ${action.type} report: ${report.reportId}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${action.type} trigger:`, error);
        processedReports.push({
          type: action.type,
          status: 'failed',
          error: error.message,
          timestamp: new Date()
        });
      }
    }
    
    return processedReports;
  }
  
  /**
   * Initialize models dynamically to avoid circular dependencies
   */
  static initModels() {
    if (!Assessment) {
      Assessment = require('./model');
    }
    if (!ChildProfile) {
      ChildProfile = require('../childprofile/model');
    }
  }

  /**
   * Evaluate all possible triggers for report generation
   */
  async evaluateAllTriggers(childId, gameId, gameData) {
    ReportGenerator.initModels();
    
    const [gameHistory, suiteHistory, assessmentHistory, childProfile] = await Promise.all([
      this.getChildGameHistory(childId),
      this.getChildSuiteHistory(childId), 
      this.getChildAssessmentHistory(childId),
      ChildProfile.findById(childId)
    ]);
    
    return {
      individualGameMilestone: await this.checkIndividualGameMilestone(gameId, gameHistory),
      progressiveSuiteCompleted: await this.checkProgressiveSuiteCompletion(childId, suiteHistory),
      batteryCompleted: await this.checkBatteryCompletion(childId, assessmentHistory),
      significantProgress: await this.detectSignificantProgress(gameId, gameHistory, childProfile),
      concernsDetected: await this.detectConcerns(gameId, gameData, gameHistory, childProfile)
    };
  }
  
  /**
   * Check if individual game has reached a milestone (3rd, 5th, 10th play, etc.)
   */
  async checkIndividualGameMilestone(gameId, gameHistory) {
    const gamePerformance = gameHistory[gameId];
    if (!gamePerformance) return null;
    
    const { playCount, sessions } = gamePerformance;
    const milestones = [3, 5, 10, 15, 20, 30, 50];
    
    if (milestones.includes(playCount)) {
      return {
        playCount,
        milestone: playCount,
        trendData: this.calculateGameTrend(sessions),
        averageImprovement: this.calculateAverageImprovement(sessions)
      };
    }
    
    return null;
  }
  
  /**
   * Check if progressive suite was just completed
   */
  async checkProgressiveSuiteCompletion(childId, suiteHistory) {
    // Check for recent suite completion (within last 5 minutes)
    const recentSuites = suiteHistory.filter(suite => {
      const completedAt = new Date(suite.completedAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return completedAt > fiveMinutesAgo;
    });
    
    if (recentSuites.length > 0) {
      const latestSuite = recentSuites[0];
      return {
        suiteType: latestSuite.assessmentType,
        completionRate: latestSuite.completedGames / latestSuite.totalGames,
        totalScore: latestSuite.totalScore,
        gameResults: latestSuite.gameResults,
        duration: latestSuite.totalDuration
      };
    }
    
    return null;
  }
  
  /**
   * Check if full assessment battery was completed
   */
  async checkBatteryCompletion(childId, assessmentHistory) {
    // Check for recent battery completion (within last hour)
    const recentBatteries = assessmentHistory.filter(assessment => {
      const completedAt = new Date(assessment.completedAt);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return completedAt > oneHourAgo && assessment.status === 'completed';
    });
    
    if (recentBatteries.length > 0) {
      const latestBattery = recentBatteries[0];
      return {
        assessmentType: latestBattery.assessmentType,
        sessionId: latestBattery.sessionId,
        gamePerformances: latestBattery.gamePerformances,
        overallScore: latestBattery.results?.overallScore,
        totalTime: latestBattery.totalTime,
        recommendations: latestBattery.results?.recommendations
      };
    }
    
    return null;
  }
  
  /**
   * Detect significant improvement (>20% increase in accuracy or score)
   */
  async detectSignificantProgress(gameId, gameHistory, childProfile) {
    const gamePerformance = gameHistory[gameId];
    if (!gamePerformance || gamePerformance.sessions.length < 3) return null;
    
    const sessions = gamePerformance.sessions.slice(0, 5); // Last 5 sessions
    const improvement = this.calculateImprovementRate(sessions);
    
    // Significant improvement threshold: >20%
    if (improvement.accuracyImprovement > 20 || improvement.scoreImprovement > 20) {
      return {
        area: this.getGameDomain(gameId),
        improvementType: improvement.accuracyImprovement > improvement.scoreImprovement ? 'accuracy' : 'score',
        improvementPercentage: Math.max(improvement.accuracyImprovement, improvement.scoreImprovement),
        trendData: improvement.trend,
        gameId: gameId
      };
    }
    
    return null;
  }
  
  /**
   * Detect concerning patterns that need attention
   */
  async detectConcerns(gameId, gameData, gameHistory, childProfile) {
    const gamePerformance = gameHistory[gameId];
    if (!gamePerformance) return null;
    
    const { sessions, averageAccuracy, averageScore } = gamePerformance;
    const concerns = [];
    
    // Skip concern detection for test games (very short duration or immediate completion)
    const currentGame = typeof gameData === 'string' ? JSON.parse(gameData) : gameData;
    if (currentGame.totalTime < 5 || currentGame.completedAt === currentGame.startTime) {
      console.log(`⚠️ Skipping concern detection for test game ${gameId} (duration: ${currentGame.totalTime}s)`);
      return null;
    }
    
    // Only check concerns after minimum number of meaningful sessions
    if (sessions.length < 3) {
      console.log(`📊 Insufficient sessions (${sessions.length}) for concern detection in ${gameId}`);
      return null;
    }
    
    // Low accuracy pattern (<35% over 3+ sessions) - made more restrictive
    if (averageAccuracy < 35 && sessions.length >= 3) {
      const recentAccuracy = sessions.slice(0, 3).reduce((sum, s) => sum + (s.accuracy || 0), 0) / 3;
      if (recentAccuracy < 35) {
        concerns.push({
          type: 'low-accuracy',
          severity: 'medium',
          description: 'Consistently low accuracy scores may indicate need for additional support'
        });
      }
    }
    
    // Declining performance trend (stricter criteria)
    if (sessions.length >= 5) {
      const recentTrend = this.calculateGameTrend(sessions.slice(0, 3));
      if (recentTrend.direction === 'declining' && recentTrend.magnitude > 25) {
        concerns.push({
          type: 'declining-performance',
          severity: 'high',
          description: 'Performance appears to be declining over recent sessions'
        });
      }
    }
    
    // Excessive completion time for age group (more lenient)
    const avgTime = sessions.reduce((sum, s) => sum + (s.totalTime || 0), 0) / sessions.length;
    const expectedTime = this.getExpectedTimeForAge(gameId, childProfile.age);
    
    // Only flag if significantly over expected time AND accuracy is also low
    if (avgTime > expectedTime * 2 && averageAccuracy < 50) {
      concerns.push({
        type: 'excessive-time',
        severity: 'low',
        description: 'Taking longer than expected for age group with low accuracy'
      });
    }
    
    // Only generate concern alerts if there are significant issues
    if (concerns.length > 0) {
      console.log(`🚨 Concerns detected for ${gameId}:`, concerns);
      return {
        area: this.getGameDomain(gameId),
        concerns: concerns,
        gameId: gameId,
        recommendedActions: this.generateConcernRecommendations(concerns)
      };
    }
    
    console.log(`✅ No concerns detected for ${gameId} (accuracy: ${averageAccuracy}%, sessions: ${sessions.length})`);
    return null;
  }
  
  // Helper calculation methods
  
  calculateGameTrend(sessions) {
    if (sessions.length < 2) return { direction: 'insufficient-data', magnitude: 0 };
    
    const scores = sessions.map(s => s.score || 0);
    // Sessions are sorted newest first, so recent sessions come first
    const recentHalf = scores.slice(0, Math.ceil(scores.length / 2));
    const olderHalf = scores.slice(Math.ceil(scores.length / 2));
    
    const recentAvg = recentHalf.reduce((sum, score) => sum + score, 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, score) => sum + score, 0) / olderHalf.length;
    
    const change = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;
    
    return {
      direction: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
      magnitude: Math.abs(change),
      change: change
    };
  }
  
  calculateAverageImprovement(sessions) {
    if (sessions.length < 2) return 0;
    
    const improvements = [];
    for (let i = 1; i < sessions.length; i++) {
      const current = sessions[i - 1].score || 0;
      const previous = sessions[i].score || 0;
      if (previous > 0) {
        improvements.push(((current - previous) / previous) * 100);
      }
    }
    
    return improvements.length > 0 ? 
      improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length : 0;
  }
  
  calculateImprovementRate(sessions) {
    const recentSessions = sessions.slice(0, 3);
    const olderSessions = sessions.slice(3, 6);
    
    if (recentSessions.length < 2 || olderSessions.length < 2) {
      return { accuracyImprovement: 0, scoreImprovement: 0, trend: 'insufficient-data' };
    }
    
    const recentAvgAccuracy = recentSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / recentSessions.length;
    const olderAvgAccuracy = olderSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / olderSessions.length;
    
    const recentAvgScore = recentSessions.reduce((sum, s) => sum + (s.score || 0), 0) / recentSessions.length;
    const olderAvgScore = olderSessions.reduce((sum, s) => sum + (s.score || 0), 0) / olderSessions.length;
    
    return {
      accuracyImprovement: olderAvgAccuracy > 0 ? ((recentAvgAccuracy - olderAvgAccuracy) / olderAvgAccuracy) * 100 : 0,
      scoreImprovement: olderAvgScore > 0 ? ((recentAvgScore - olderAvgScore) / olderAvgScore) * 100 : 0,
      trend: 'improving'
    };
  }
  
  getPriorityWeight(priority) {
    const weights = { 'low': 4, 'medium': 3, 'high': 2, 'critical': 1 };
    return weights[priority] || 5;
  }
  
  getGameDomain(gameId) {
    const domains = {
      'focus-finder': 'Attention & Focus',
      'impulse-freeze': 'Impulse Control', 
      'memory-trail': 'Working Memory',
      'hyper-hop': 'Motor Control',
      'task-twister': 'Executive Function',
      'letter-sound-matching': 'Phonological Processing',
      'memory-match': 'Visual Memory',
      'rhyming-pairs': 'Phonological Awareness',
      'word-completion': 'Language Processing'
    };
    return domains[gameId] || 'Cognitive Skills';
  }
  
  getExpectedTimeForAge(gameId, age) {
    // Base time expectations in seconds by game type
    const baseTimes = {
      'focus-finder': 120,
      'impulse-freeze': 90,
      'memory-trail': 180,
      'hyper-hop': 150,
      'task-twister': 200
    };
    
    const baseTime = baseTimes[gameId] || 150;
    
    // Age adjustments
    if (age < 6) return baseTime * 1.5;
    if (age < 8) return baseTime * 1.2;
    if (age > 12) return baseTime * 0.8;
    
    return baseTime;
  }
  
  generateConcernRecommendations(concerns) {
    const recommendations = [];
    
    concerns.forEach(concern => {
      switch (concern.type) {
        case 'low-accuracy':
          recommendations.push('Consider providing additional practice sessions');
          recommendations.push('Break down tasks into smaller, manageable steps');
          break;
        case 'declining-performance':
          recommendations.push('Schedule a break from assessments'); 
          recommendations.push('Consult with educational specialist');
          break;
        case 'excessive-time':
          recommendations.push('Provide more time for task completion');
          recommendations.push('Consider accommodations for processing speed');
          break;
      }
    });
    
    return recommendations;
  }
  
  // Data fetching helpers
  
  async getChildGameHistory(childId) {
    const assessments = await Assessment.find({ 
      childId: childId,
      'gamePerformances.0': { $exists: true }
    }).sort({ completedAt: -1 });
    
    const gamePerformances = {};
    
    assessments.forEach(assessment => {
      if (assessment.gamePerformances) {
        assessment.gamePerformances.forEach(gamePerf => {
          const gameId = gamePerf.gameId;
          
          if (!gamePerformances[gameId]) {
            gamePerformances[gameId] = {
              gameId: gameId,
              playCount: 0,
              totalScore: 0,
              totalAccuracy: 0,
              averageScore: 0,
              averageAccuracy: 0,
              sessions: []
            };
          }
          
          gamePerformances[gameId].playCount++;
          gamePerformances[gameId].totalScore += (gamePerf.score || 0);
          gamePerformances[gameId].totalAccuracy += (gamePerf.accuracy || 0);
          
          gamePerformances[gameId].sessions.push({
            score: gamePerf.score || 0,
            accuracy: gamePerf.accuracy || 0,
            completedAt: gamePerf.completedAt,
            totalTime: gamePerf.totalTime || 0
          });
        });
      }
    });
    
    // Calculate averages and sort sessions
    Object.keys(gamePerformances).forEach(gameId => {
      const game = gamePerformances[gameId];
      game.averageScore = game.playCount > 0 ? Math.round(game.totalScore / game.playCount) : 0;
      game.averageAccuracy = game.playCount > 0 ? Math.round(game.totalAccuracy / game.playCount) : 0;
      game.sessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    });
    
    return gamePerformances;
  }
  
  async getChildSuiteHistory(childId) {
    // Fetch progressive suite results
    try {
      const suiteAssessments = await Assessment.find({
        childId: childId,
        'gameSpecificData.suiteContext': { $exists: true }
      }).sort({ completedAt: -1 });
      
      return suiteAssessments.map(assessment => ({
        assessmentType: assessment.assessmentType,
        completedAt: assessment.completedAt,
        totalScore: assessment.gamePerformances?.reduce((sum, game) => sum + (game.score || 0), 0) || 0,
        completedGames: assessment.gamePerformances?.length || 0,
        totalGames: assessment.gamePerformances?.length || 0,
        totalDuration: assessment.totalTime || 0,
        gameResults: assessment.gamePerformances || []
      }));
    } catch (error) {
      console.error('Error fetching suite history:', error);
      return [];
    }
  }
  
  async getChildAssessmentHistory(childId) {
    return await Assessment.find({ 
      childId: childId,
      status: 'completed'
    }).sort({ completedAt: -1 });
  }
}

module.exports = new ReportGenerator(); 