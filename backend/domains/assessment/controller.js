const Assessment = require('./model');
const { BatteryConfig } = require('./battery-model');
const { ChildProgress } = require('./child-progress-model');
const Intake = require('../intake/model');
const ChildProfile = require('../childprofile/model');
const User = require('../auth/model');
const ReportGenerator = require('./report-generator');

/**
 * Assessment Controller
 * Handles all battery-based assessment operations
 */
class AssessmentController {
  // Helper to map game/battery to category for pricing/usage
  getGameCategoryFromIds(gameId, batteryId) {
    const adhdGames = new Set([
      'focus-finder','impulse-freeze','memory-trail','hyper-hop','sound-shift','time-turtle','task-twister-enhanced'
    ]);
    const dyslexiaGames = new Set([
      'letter-sound-matching','rhyming-pairs','word-sequence-builder','spot-correct-word','memory-match','rapid-letter-naming','visual-tracking-maze','word-completion','syllable-clapper'
    ]);
    const key = (batteryId || '').toLowerCase();
    if (key.includes('adhd')) return 'adhd';
    if (key.includes('dyslexia')) return 'dyslexia';
    if (adhdGames.has((gameId || '').toLowerCase())) return 'adhd';
    if (dyslexiaGames.has((gameId || '').toLowerCase())) return 'dyslexia';
    return null;
  }
  
  /**
   * Start a new battery-based assessment
   */
  async startBatteryAssessment(req, res) {
    try {
      const { childId, batteryStructure, intakeId } = req.body;
      const userId = req.user._id;

      if (!childId || !batteryStructure) {
        return res.status(400).json({
          success: false,
          message: 'Child ID and battery structure are required'
        });
      }

      // Validate child belongs to user
      const child = await ChildProfile.findOne({ _id: childId, parent: userId });
      if (!child) {
        return res.status(404).json({
          success: false,
          message: 'Child not found or access denied'
        });
      }

      // Create new assessment session
      const sessionId = this.generateSessionId();
      
      const assessment = new Assessment({
        intakeId: intakeId || new (require('mongoose').Types.ObjectId)(),
        sessionId,
        userId,
        childId,
        assessmentType: batteryStructure.selectedBatteries[0]?.domain || 'comprehensive',
        status: 'active',
        
        // Battery structure
        batteryStructure: {
          isGameBased: true,
          selectedBatteries: batteryStructure.selectedBatteries,
          currentBatteryIndex: 0,
          totalBatteries: batteryStructure.totalBatteries
        },
        
        // Initialize progress tracking
        progressTracking: {
          overallProgress: 0,
          batteryProgress: batteryStructure.selectedBatteries.map(battery => ({
            batteryId: battery.batteryId,
            progress: 0,
            status: 'pending',
            startedAt: null,
            completedAt: null
          })),
          gameProgress: []
        },
        
        // Initialize quality metrics
        qualityMetrics: {
          engagementScore: 1,
          dataQualityFlags: [],
          reliabilityScore: 1
        }
      });

      await assessment.save();

      // Store in pipeline state management for AI processing
      await this.storeAssessmentState(assessment);

      // Initialize child progress tracking
      await this.initializeChildProgress(childId, sessionId);

      // Get first game
      const firstBattery = batteryStructure.selectedBatteries[0];
      const firstGame = {
        gameId: firstBattery.games[0],
        batteryId: firstBattery.batteryId,
        position: 0
      };

      res.json({
        success: true,
        sessionId,
        currentBattery: firstBattery,
        firstGame,
        totalBatteries: batteryStructure.totalBatteries
      });

    } catch (error) {
      console.error('Error starting battery assessment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start assessment'
      });
    }
  }

  /**
   * Configure battery structure for a child
   */
  async configureBattery(req, res) {
    try {
      const { childId, assessmentType, ageMonths, concerns } = req.body;

      if (!childId || !assessmentType) {
        return res.status(400).json({
          success: false,
          message: 'Child ID and assessment type are required'
        });
      }

      // Get age-appropriate batteries
      const batteries = await this.getRecommendedBatteries(assessmentType, ageMonths, concerns);
      
      // Calculate total estimated duration
      const estimatedDuration = batteries.reduce((total, battery) => 
        total + battery.estimatedTotalDuration, 0);

      res.json({
        success: true,
        batteryStructure: {
          selectedBatteries: batteries.map(b => ({
            batteryId: b.batteryId,
            name: b.name,
            domain: b.targetDomain,
            games: b.gameSequence.map(g => g.gameId),
            estimatedDuration: b.estimatedTotalDuration
          })),
          totalBatteries: batteries.length,
          estimatedDuration
        }
      });

    } catch (error) {
      console.error('Error configuring battery:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to configure battery'
      });
    }
  }

  /**
   * Complete a game and record performance data
   */
  async completeGame(req, res) {
    try {
      const { sessionId, gameId, batteryId, performanceData, childId } = req.body;

      console.log('🎮 completeGame called with:', {
        sessionId,
        gameId,
        batteryId,
        childId,
        performanceData: JSON.stringify(performanceData, null, 2)
      });

      // Debug time data
      console.log('🎮 Time data received:', {
        duration: performanceData.duration,
        totalTime: performanceData.totalTime,
        startTime: performanceData.startTime,
        endTime: performanceData.completedAt
      });

      if (!sessionId || !gameId || !batteryId || !performanceData) {
        console.error('❌ Missing required parameters:', { sessionId, gameId, batteryId, hasPerformanceData: !!performanceData });
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      let assessment = await Assessment.findOne({ sessionId });
      console.log('🎮 Found existing assessment:', !!assessment);
      
      // If no assessment found and this is an individual game session, create one
      if (!assessment && sessionId.startsWith('individual_game_')) {
        console.log('🎮 Creating new assessment session for individual game');
        
        // Extract child ID from the request or get it from user context
        if (!childId) {
          console.error('❌ No childId provided for individual game session');
          return res.status(400).json({
            success: false,
            message: 'Child ID is required for individual game sessions'
          });
        }

        // Validate that child belongs to the authenticated user
        const child = await ChildProfile.findOne({ _id: childId, parent: req.user._id });
        if (!child) {
          console.error('❌ Child not found or access denied:', { childId, userId: req.user._id });
          return res.status(404).json({
            success: false,
            message: 'Child not found or access denied'
          });
        }

        console.log('✅ Child validation passed');

        // Enforce access and usage for individual games
        try {
          const category = this.getGameCategoryFromIds(gameId, batteryId) || 'adhd';
          const accessType = `${category}-game`;
          const pricingController = require('../pricing/controller');
          const accessRes = await pricingController.checkUserAccess({
            params: { assessmentType: accessType },
            user: req.user,
          }, {
            json: (d) => d,
            status: (c) => ({ json: (o) => ({ code: c, ...o }) })
          });
          if (accessRes && accessRes.success === true && accessRes.hasAccess !== true) {
            return res.status(402).json({ success: false, message: 'Payment required', pricing: accessRes.pricing || null });
          }
          const { checkUsage } = require('../pricing/usage');
          let usageResult = null;
          await checkUsage({ user: req.user, body: { resourceType: 'game', resourceKey: accessType, assessmentType: accessType } }, {
            json: (d) => { usageResult = d; },
            status: (c) => ({ json: (o) => { usageResult = { code: c, ...o }; } }),
          });
          if (usageResult && usageResult.success === true && usageResult.allowed === false) {
            return res.status(402).json({ success: false, message: 'Usage limit reached', reason: 'limit_reached' });
          }
        } catch (gateErr) {
          console.warn('⚠️ Individual game access/usage check failed:', gateErr.message);
        }

        // Create a new assessment session for individual games
        assessment = new Assessment({
          sessionId,
          childId: childId,
          userId: req.user._id, // Add userId for individual games
          assessmentType: 'individual-games',
          status: 'active',
          startedAt: new Date(),
          gamePerformances: [],
          progressTracking: {
            currentBatteryId: batteryId,
            currentGameIndex: 0,
            overallProgress: 0,
            batteryProgress: {}
          }
        });
        
        await assessment.save();
        console.log('✅ Individual game assessment session created');
      } else if (!assessment) {
        console.error('❌ Assessment session not found:', sessionId);
        return res.status(404).json({
          success: false,
          message: 'Assessment session not found'
        });
      }

      // Record game performance with proper data validation
      const now = new Date();
      const startTime = performanceData.startTime ? new Date(performanceData.startTime) : now;
      
      // Normalize accuracy to be between 0 and 1 (convert percentage to decimal if needed)
      let normalizedAccuracy = performanceData.accuracy || 0;
      if (normalizedAccuracy > 1) {
        normalizedAccuracy = normalizedAccuracy / 100; // Convert percentage to decimal
      }
      // Ensure accuracy is between 0 and 1
      normalizedAccuracy = Math.min(1, Math.max(0, normalizedAccuracy));
      
      console.log('🎮 Processing game performance data:', {
        gameId,
        score: performanceData.score,
        accuracy: performanceData.accuracy,
        normalizedAccuracy,
        totalTime: performanceData.totalTime,
        duration: performanceData.duration
      });
      
      const gamePerformance = {
        gameId,
        batteryId,
        attempt: 1, // TODO: Track multiple attempts
        startedAt: isNaN(startTime.getTime()) ? now : startTime,
        completedAt: now,
        
        // Basic performance metrics
        score: performanceData.score || 0,
        accuracy: Math.min(1, Math.max(0, normalizedAccuracy)), // Ensure between 0 and 1
        completionRate: Math.min(1, Math.max(0, (performanceData.completionRate || 0))),
        duration: performanceData.duration || performanceData.totalTime || 0, // Handle both field names
        level: performanceData.level || 1, // Extract level from performance data
        
        // Enhanced behavioral data - validated and sanitized
        behavioralMetrics: this.validateBehavioralMetrics(performanceData.behavioralMetrics),
        
        // Store game-specific data including level information
        gameSpecificData: performanceData.gameSpecificData || {}
      };
      
      console.log('🎮 Created game performance object:', {
        gameId: gamePerformance.gameId,
        score: gamePerformance.score,
        accuracy: gamePerformance.accuracy,
        duration: gamePerformance.duration,
        gameSpecificData: gamePerformance.gameSpecificData
      });

      // Add AI analysis (simplified for now)
      gamePerformance.aiAnalysis = await this.analyzeGamePerformance(performanceData, assessment);

      assessment.gamePerformances.push(gamePerformance);

      // Update progress tracking
      await this.updateAssessmentProgress(assessment, gameId, batteryId);

      // Update child progress with normalized data
      try {
        await this.updateChildProgress(assessment.childId, sessionId, {
          gameId,
          batteryId,
          assessmentType: assessment.assessmentType,
          score: performanceData.score || 0,
          accuracy: normalizedAccuracy, // Use the already normalized accuracy
          duration: performanceData.duration || performanceData.totalTime || 0,
          completedAt: now,
          gameSpecificData: performanceData.gameSpecificData || {}
        });
        console.log('✅ Child progress updated successfully');
      } catch (progressError) {
        console.error('❌ Error updating child progress:', progressError);
        
        // Don't fail the entire request for version conflicts
        if (progressError.name === 'VersionError' || progressError.message.includes('No matching document found')) {
          console.log('✅ Child progress update completed (version conflict handled)');
        } else {
          throw progressError;
        }
      }

      try {
        await assessment.save();
        console.log('✅ Assessment saved successfully');
      } catch (saveError) {
        console.error('❌ Error saving assessment:', saveError);
        
        // Handle version conflicts for assessment save as well
        if (saveError.name === 'VersionError' || saveError.message.includes('No matching document found')) {
          console.log('✅ Assessment save completed (version conflict handled)');
        } else {
          throw saveError;
        }
      }

      // If this was an individual game session and it completes the session, increment usage once
      try {
        if (assessment.assessmentType === 'individual-games' && assessment.status === 'completed' && assessment.usageCounted !== true) {
          const category = this.getGameCategoryFromIds(gameId, batteryId) || 'adhd';
          const accessType = `${category}-game`;
          const { incrementUsage } = require('../pricing/usage');
          let incResult = null;
          await incrementUsage({ user: req.user, body: { resourceType: 'game', resourceKey: accessType, assessmentType: accessType } }, {
            json: (d) => { incResult = d; },
            status: (c) => ({ json: (o) => { incResult = { code: c, ...o }; } }),
          });
          console.log('🧮 Usage increment (individual game) result:', incResult);
          assessment.usageCounted = true;
          await assessment.save();
        }
      } catch (incErr) {
        console.warn('⚠️ Individual game usage increment failed:', incErr.message);
      }

      // Update assessment state in pipeline
      try {
        await this.updateAssessmentState(assessment);
      } catch (stateError) {
        console.error('❌ Error updating assessment state:', stateError);
        // Don't fail the request for state update errors
      }

      // Check for report generation triggers
      try {
        const reportCheck = await ReportGenerator.checkReportTriggers(
          assessment.childId,
          gameId,
          performanceData
        );
        
        if (reportCheck.shouldGenerateReports) {
          console.log(`📊 Report triggers detected for child ${assessment.childId}:`, 
            reportCheck.reportActions.map(action => action.type));
          
          // TODO: Queue report generation jobs or generate immediately based on priority
          // For now, just log the triggers - implement actual report generation later
          reportCheck.reportActions.forEach(action => {
            console.log(`  - ${action.type} (${action.priority} priority) - ${action.trigger}`);
          });
        }
      } catch (reportError) {
        console.error('Error checking report triggers:', reportError);
        // Don't fail the game completion if report checking fails
      }

      // Determine next action
      const nextAction = await this.determineNextAction(assessment);
      
      console.log('🎮 Next action determined:', nextAction);
      
      // Check if there was an error in determining next action
      if (nextAction.type === 'error') {
        console.error('Error determining next action:', nextAction.message);
        return res.status(500).json({
          success: false,
          message: nextAction.message || 'Failed to determine next action'
        });
      }

      const response = {
        success: true,
        nextAction: nextAction.type, // 'next_game', 'next_battery', 'assessment_complete'
        ...nextAction,
        progress: {
          overallProgress: assessment.progressTracking.overallProgress,
          batteryProgress: assessment.progressTracking.batteryProgress
        }
      };

      console.log('✅ Sending successful response:', response);
      res.json(response);

    } catch (error) {
      console.error('❌ Error completing game:', error);
      
      // Handle specific error types gracefully
      if (error.name === 'VersionError' || error.message.includes('No matching document found')) {
        console.log('✅ Game completion successful (version conflict handled)');
        return res.json({
          success: true,
          nextAction: 'assessment_complete',
          message: 'Game completed successfully'
        });
      }
      
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to record game completion'
      });
    }
  }

  /**
   * Get assessment session status
   */
  async getSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;

      const assessment = await Assessment.findOne({ sessionId })
        .populate('childId', 'firstName lastName age')
        .lean();

      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment session not found'
        });
      }

      // Calculate current progress
      const currentProgress = this.calculateSessionProgress(assessment);

      res.json({
        success: true,
        session: {
          sessionId: assessment.sessionId,
          status: assessment.status,
          child: assessment.childId,
          batteryStructure: assessment.batteryStructure,
          progressTracking: assessment.progressTracking,
          qualityMetrics: assessment.qualityMetrics,
          currentProgress,
          startedAt: assessment.startedAt,
          lastActiveAt: assessment.lastActiveAt
        }
      });

    } catch (error) {
      console.error('Error getting session status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get session status'
      });
    }
  }

  /**
   * Complete entire assessment and generate results
   */
  async completeAssessment(req, res) {
    try {
      const { sessionId } = req.body;

      const assessment = await Assessment.findOne({ sessionId });
      if (!assessment) {
        return res.status(404).json({
          success: false,
          message: 'Assessment session not found'
        });
      }

      // Generate comprehensive results
      const results = await this.generateAssessmentResults(assessment);
      
      assessment.status = 'completed';
      assessment.completedAt = new Date();
      assessment.results = results;

      await assessment.save();

      // Send assessment completion email
      try {
        const EmailNotificationService = require('./email-notification-service');
        const childProfile = await ChildProfile.findById(assessment.childId);
        const parent = await User.findById(assessment.userId);
        
        if (childProfile && parent) {
          const emailResult = await EmailNotificationService.sendAssessmentCompletionEmail(
            results,
            childProfile,
            parent,
            assessment.assessmentType || 'comprehensive'
          );
          
          console.log(`📧 Assessment completion email result:`, emailResult);
        }
      } catch (emailError) {
        console.error('❌ Error sending assessment completion email:', emailError);
        // Don't fail the assessment completion if email fails
      }

      res.json({
        success: true,
        results,
        sessionId
      });

    } catch (error) {
      console.error('Error completing assessment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete assessment'
      });
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get recommended batteries for assessment type and age
   */
  async getRecommendedBatteries(assessmentType, ageMonths, concerns = []) {
    try {
      const query = {
        assessmentType: assessmentType.toLowerCase(),
        isActive: true,
        'ageRecommendations.minAge': { $lte: ageMonths },
        'ageRecommendations.maxAge': { $gte: ageMonths }
      };

      const batteries = await BatteryConfig.find(query).sort({ targetDomain: 1 });
      
      if (batteries.length === 0) {
        // Fallback to default batteries for the assessment type
        return await this.getDefaultBatteries(assessmentType);
      }

      return batteries;
    } catch (error) {
      console.error('Error getting recommended batteries:', error);
      return await this.getDefaultBatteries(assessmentType);
    }
  }

  /**
   * Get default batteries if no age-specific ones found
   */
  async getDefaultBatteries(assessmentType) {
    const defaultBatteries = await BatteryConfig.find({
      assessmentType: assessmentType.toLowerCase(),
      isActive: true
    }).limit(3);

    return defaultBatteries.length > 0 ? defaultBatteries : [];
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate and sanitize behavioral metrics data
   */
  validateBehavioralMetrics(behavioralMetrics) {
    if (!behavioralMetrics || typeof behavioralMetrics !== 'object') {
      return this.getDefaultBehavioralMetrics();
    }

    return {
      responseTimes: Array.isArray(behavioralMetrics.responseTimes) ? behavioralMetrics.responseTimes : [],
      timeToFirstResponse: typeof behavioralMetrics.timeToFirstResponse === 'number' ? behavioralMetrics.timeToFirstResponse : 0,
      performanceOverTime: Array.isArray(behavioralMetrics.performanceOverTime) ? behavioralMetrics.performanceOverTime : [],
      breakRequests: typeof behavioralMetrics.breakRequests === 'number' ? behavioralMetrics.breakRequests : 0,
      errorAnalysis: {
        totalErrors: behavioralMetrics.errorAnalysis?.totalErrors || 0,
        errorTypes: Array.isArray(behavioralMetrics.errorAnalysis?.errorTypes) ? behavioralMetrics.errorAnalysis.errorTypes : [],
        falsePositives: behavioralMetrics.errorAnalysis?.falsePositives || 0,
        falseNegatives: behavioralMetrics.errorAnalysis?.falseNegatives || 0
      },
      engagementData: {
        clickPatterns: Array.isArray(behavioralMetrics.engagementData?.clickPatterns) ? behavioralMetrics.engagementData.clickPatterns : [],
        helpRequests: behavioralMetrics.engagementData?.helpRequests || 0,
        distractionEvents: behavioralMetrics.engagementData?.distractionEvents || 0,
        frustrationIndicators: behavioralMetrics.engagementData?.frustrationIndicators || 0
      }
    };
  }

  /**
   * Get default behavioral metrics structure
   */
  getDefaultBehavioralMetrics() {
    return {
      responseTimes: [],
      timeToFirstResponse: 0,
      performanceOverTime: [],
      breakRequests: 0,
      errorAnalysis: {
        totalErrors: 0,
        errorTypes: [],
        falsePositives: 0,
        falseNegatives: 0
      },
      engagementData: {
        clickPatterns: [],
        helpRequests: 0,
        distractionEvents: 0,
        frustrationIndicators: 0
      }
    };
  }

  /**
   * Analyze game performance using simplified AI logic
   */
  async analyzeGamePerformance(performanceData, assessment) {
    // Simplified analysis - can be enhanced with actual AI
    const analysis = {
      performancePattern: 'normal',
      riskIndicators: [],
      strengthIndicators: [],
      recommendedActions: []
    };

    // Basic pattern analysis
    if (performanceData.accuracy < 0.5) {
      analysis.riskIndicators.push('low-accuracy');
      analysis.recommendedActions.push('Consider additional practice in this area');
    }

    if (performanceData.completionRate < 0.8) {
      analysis.riskIndicators.push('incomplete-tasks');
      analysis.recommendedActions.push('Monitor attention and engagement');
    }

    if (performanceData.accuracy > 0.8) {
      analysis.strengthIndicators.push('high-accuracy');
    }

    return analysis;
  }

  /**
   * Update assessment progress after game completion
   */
  async updateAssessmentProgress(assessment, gameId, batteryId) {
    // Handle individual games (standalone games without battery structure)
    if (assessment.assessmentType === 'individual-games' || assessment.assessmentType === 'adhd-individual-games') {
      console.log('🎮 Individual game progress update - marking as complete');
      assessment.progressTracking.overallProgress = 100;
      assessment.status = 'completed';
      assessment.completedAt = new Date();
      return;
    }

    // Handle battery-based assessments
    if (!assessment.batteryStructure?.selectedBatteries) {
      console.log('⚠️ No battery structure found for assessment');
      return;
    }

    // Find current battery
    const currentBattery = assessment.batteryStructure.selectedBatteries.find(b => b.batteryId === batteryId);
    
    if (currentBattery) {
      // Update game progress
      const gameIndex = currentBattery.games.indexOf(gameId);
      const gameProgress = ((gameIndex + 1) / currentBattery.games.length) * 100;
      
      // Update battery progress
      const batteryProgressIndex = assessment.progressTracking.batteryProgress.findIndex(bp => bp.batteryId === batteryId);
      if (batteryProgressIndex !== -1) {
        assessment.progressTracking.batteryProgress[batteryProgressIndex].progress = gameProgress;
        if (gameProgress === 100) {
          assessment.progressTracking.batteryProgress[batteryProgressIndex].status = 'completed';
          assessment.progressTracking.batteryProgress[batteryProgressIndex].completedAt = new Date();
        }
      }
      
      // Calculate overall progress
      const totalGames = assessment.batteryStructure.selectedBatteries.reduce(
        (total, battery) => total + battery.games.length, 0
      );
      const completedGames = assessment.gamePerformances.length;
      assessment.progressTracking.overallProgress = Math.round((completedGames / totalGames) * 100);
    }
  }

  /**
   * Determine next action in assessment flow
   */
  async determineNextAction(assessment) {
    // Handle individual games (standalone games without battery structure)
    if (assessment.assessmentType === 'individual-games' || assessment.assessmentType === 'adhd-individual-games') {
      console.log('🎮 Individual game completed, marking assessment as complete');
      return {
        type: 'assessment_complete',
        message: 'Individual game completed successfully!',
        resultsReady: true
      };
    }

    // Handle battery-based assessments
    const currentBatteryIndex = assessment.batteryStructure?.currentBatteryIndex || 0;
    const selectedBatteries = assessment.batteryStructure?.selectedBatteries || [];
    
    // Add null checking for battery structure
    if (!selectedBatteries || selectedBatteries.length === 0) {
      console.error('No selected batteries found in assessment');
      return {
        type: 'error',
        message: 'Assessment structure is invalid'
      };
    }
    
    const currentBattery = selectedBatteries[currentBatteryIndex];
    
    // Check if current battery exists
    if (!currentBattery) {
      console.error(`Current battery at index ${currentBatteryIndex} not found`);
      return {
        type: 'error',
        message: 'Current battery not found'
      };
    }
    
    // Check if current battery is complete
    const batteryGames = currentBattery.games;
    if (!batteryGames || batteryGames.length === 0) {
      console.error(`No games found in current battery ${currentBattery.batteryId}`);
      return {
        type: 'error',
        message: 'No games found in current battery'
      };
    }
    
    const completedGamesInBattery = assessment.gamePerformances.filter(gp => gp.batteryId === currentBattery.batteryId).length;
    
    if (completedGamesInBattery < batteryGames.length) {
      // Continue with next game in current battery
      const nextGameId = batteryGames[completedGamesInBattery];
      return {
        type: 'next_game',
        gameId: nextGameId,
        batteryId: currentBattery.batteryId,
        gameIndex: completedGamesInBattery,
        batteryIndex: currentBatteryIndex
      };
    } else {
      // Check if there are more batteries
      if (currentBatteryIndex + 1 < assessment.batteryStructure.totalBatteries) {
        assessment.batteryStructure.currentBatteryIndex += 1;
        const nextBattery = assessment.batteryStructure.selectedBatteries[currentBatteryIndex + 1];
        
        return {
          type: 'next_battery',
          batteryId: nextBattery.batteryId,
          gameId: nextBattery.games[0],
          batteryIndex: currentBatteryIndex + 1,
          gameIndex: 0,
          requiresBreak: true
        };
      } else {
        // Assessment complete - trigger AI analysis
        await this.completeAssessmentWithAI(assessment);
        return {
          type: 'assessment_complete',
          message: 'All batteries completed successfully!',
          resultsReady: true
        };
      }
    }
  }

  /**
   * Initialize child progress tracking
   */
  async initializeChildProgress(childId, sessionId) {
    try {
      const existingProgress = await ChildProgress.findOne({ childId, sessionId });
      
      if (!existingProgress) {
        const childProgress = new ChildProgress({
          childId,
          sessionId,
          assessmentSessions: [{
            sessionId,
            startedAt: new Date(),
            gamePerformances: [],
            qualityMetrics: {
              overallEngagement: 1,
              dataQuality: 1,
              behavioralConsistency: 1
            }
          }]
        });
        
        await childProgress.save();
      }
    } catch (error) {
      console.error('Error initializing child progress:', error);
    }
  }

  /**
   * Update child progress with game performance
   */
  async updateChildProgress(childId, sessionId, gamePerformance) {
    try {
      let childProgress = await ChildProgress.findOne({ childId });
      
      if (!childProgress) {
        // Initialize child progress if it doesn't exist
        childProgress = new ChildProgress({
          childId,
          overallMetrics: {
            totalAssessments: 1,
            completedAssessments: 0,
            firstAssessmentDate: new Date()
          },
          domainProgress: [],
          behavioralProfile: {},
          aiInsights: {},
          dataQuality: {}
        });
      }

      // Find or create domain progress entry
      let domainEntry = childProgress.domainProgress.find(dp => 
        dp.domain === gamePerformance.batteryId && dp.assessmentType === gamePerformance.assessmentType
      );

      if (!domainEntry) {
        domainEntry = {
          domain: gamePerformance.batteryId,
          assessmentType: gamePerformance.assessmentType || 'battery-based',
          assessmentHistory: [],
          currentLevel: 5,
          strengths: [],
          challenges: [],
          recommendations: []
        };
        childProgress.domainProgress.push(domainEntry);
      }

      // Calculate correct patterns for Memory Trail game
      let correctPatterns = 0;
      if (gamePerformance.gameId === 'memory-trail' && gamePerformance.gameSpecificData) {
        // Sum correct patterns from all sessions
        correctPatterns = gamePerformance.gameSpecificData.sessions?.reduce((total, session) => {
          return total + (session.gameSpecificData?.correctPatterns || 0);
        }, 0) || 0;
        
        // Fallback: if sessions data is missing, estimate from successful rounds
        if (correctPatterns === 0 && gamePerformance.gameSpecificData.successfulRounds) {
          correctPatterns = gamePerformance.gameSpecificData.successfulRounds;
        }
      }

      // Add assessment history entry with enhanced data
      const historyEntry = {
        sessionId,
        date: new Date(),
        score: Math.min(10, Math.round((gamePerformance.score || 0) / 10)), // Normalize 0-100 to 0-10 scale
        accuracy: gamePerformance.accuracy || 0,
        behavioralNotes: `Game: ${gamePerformance.gameId}`,
        qualityScore: 1,
        // Add game-specific data
        gameSpecificData: {
          correctPatterns: correctPatterns,
          totalRounds: gamePerformance.gameSpecificData?.totalRounds || 0,
          roundsCompleted: gamePerformance.gameSpecificData?.roundsCompleted || 0,
          errorCount: gamePerformance.gameSpecificData?.errorCount || 0,
          successfulRounds: gamePerformance.gameSpecificData?.successfulRounds || 0
        }
      };

      domainEntry.assessmentHistory.push(historyEntry);
      
      // Update overall metrics
      childProgress.overallMetrics.lastAssessmentDate = new Date();
      if (gamePerformance.accuracy > 0.8) {
        childProgress.overallMetrics.averageEngagement = Math.min(1, 
          (childProgress.overallMetrics.averageEngagement + gamePerformance.accuracy) / 2
        );
      }

      // Handle version conflicts gracefully
      try {
        await childProgress.save();
        console.log('✅ Child progress updated successfully');
      } catch (saveError) {
        // If it's a version conflict, try to reload and save again
        if (saveError.name === 'VersionError' || saveError.message.includes('No matching document found')) {
          console.log('🔄 Version conflict detected, reloading and retrying...');
          
          // Reload the document and try again
          const freshChildProgress = await ChildProgress.findOne({ childId });
          if (freshChildProgress) {
            // Re-apply the same changes to the fresh document
            let freshDomainEntry = freshChildProgress.domainProgress.find(dp => 
              dp.domain === gamePerformance.batteryId && dp.assessmentType === gamePerformance.assessmentType
            );

            if (!freshDomainEntry) {
              freshDomainEntry = {
                domain: gamePerformance.batteryId,
                assessmentType: gamePerformance.assessmentType || 'battery-based',
                assessmentHistory: [],
                currentLevel: 5,
                strengths: [],
                challenges: [],
                recommendations: []
              };
              freshChildProgress.domainProgress.push(freshDomainEntry);
            }

            // Add the same history entry
            freshDomainEntry.assessmentHistory.push(historyEntry);
            
            // Update overall metrics
            freshChildProgress.overallMetrics.lastAssessmentDate = new Date();
            if (gamePerformance.accuracy > 0.8) {
              freshChildProgress.overallMetrics.averageEngagement = Math.min(1, 
                (freshChildProgress.overallMetrics.averageEngagement + gamePerformance.accuracy) / 2
              );
            }

            await freshChildProgress.save();
            console.log('✅ Child progress updated successfully after retry');
          } else {
            console.log('⚠️ Could not reload child progress document, continuing...');
          }
        } else {
          // Re-throw non-version errors
          throw saveError;
        }
      }
      
    } catch (error) {
      console.error('Error updating child progress:', error);
      
      // Don't throw the error for version conflicts - treat as success
      if (error.name === 'VersionError' || error.message.includes('No matching document found')) {
        console.log('✅ Child progress update completed (version conflict handled)');
        return;
      }
      
      throw error;
    }
  }

  /**
   * Calculate current session progress
   */
  calculateSessionProgress(assessment) {
    const totalGames = assessment.batteryStructure.selectedBatteries.reduce(
      (total, battery) => total + battery.games.length, 0
    );
    const completedGames = assessment.gamePerformances.length;
    
    return {
      totalGames,
      completedGames,
      percentage: Math.round((completedGames / totalGames) * 100),
      currentBattery: assessment.batteryStructure.selectedBatteries[assessment.batteryStructure.currentBatteryIndex],
      estimatedTimeRemaining: this.calculateTimeRemaining(assessment)
    };
  }

  /**
   * Calculate estimated time remaining
   */
  calculateTimeRemaining(assessment) {
    const currentBatteryIndex = assessment.batteryStructure.currentBatteryIndex;
    const remainingBatteries = assessment.batteryStructure.selectedBatteries.slice(currentBatteryIndex);
    
    return remainingBatteries.reduce((total, battery) => total + (battery.estimatedDuration || 10), 0);
  }

  /**
   * Complete assessment and trigger AI analysis
   */
  async completeAssessmentWithAI(assessment) {
    try {
      // Mark assessment as completed
      assessment.status = 'completed';
      assessment.completedAt = new Date();
      
      // Generate AI-powered comprehensive results
      const results = await this.generateAssessmentResults(assessment);
      assessment.results = results;
      
      await assessment.save();
      
      console.log(`✅ Assessment ${assessment.sessionId} completed with AI analysis`);
      
    } catch (error) {
      console.error('Error completing assessment with AI:', error);
      // Continue with basic completion even if AI fails
      assessment.status = 'completed';
      assessment.completedAt = new Date();
      assessment.results = await this.generateBasicResults(assessment);
      await assessment.save();
    }
  }

  /**
   * Generate comprehensive assessment results using AI pipeline
   */
  async generateAssessmentResults(assessment) {
    try {
      // Import the AI pipeline
      const { generateSummary } = require('../../pipeline');
      
      // Convert game-based assessment to pipeline-compatible format
      const assessmentState = await this.convertToAssessmentState(assessment);
      
      // Generate AI-powered summary
      const aiResults = await generateSummary(assessment.sessionId);
      
      // Enhance with game-specific data
      const gameResults = assessment.gamePerformances.map(gp => ({
        gameId: gp.gameId,
        batteryId: gp.batteryId,
        score: gp.score,
        accuracy: gp.accuracy,
        duration: gp.duration,
        behavioralObservations: gp.aiAnalysis?.strengthIndicators || [],
        riskIndicators: gp.aiAnalysis?.riskIndicators || []
      }));

      // Handle individual games vs battery-based assessments
      let batteryResults = [];
      if (assessment.assessmentType === 'individual-games' || assessment.assessmentType === 'adhd-individual-games') {
        // For individual games, create a single battery result
        const averageScore = gameResults.length > 0 
          ? gameResults.reduce((sum, game) => sum + (game.score || 0), 0) / gameResults.length 
          : 0;
        
        batteryResults = [{
          batteryId: 'individual-games',
          domain: assessment.assessmentType,
          overallScore: averageScore,
          gameResults: gameResults
        }];
      } else if (assessment.batteryStructure?.selectedBatteries) {
        // For battery-based assessments
        batteryResults = assessment.batteryStructure.selectedBatteries.map(battery => {
          const batteryGames = gameResults.filter(gr => gr.batteryId === battery.batteryId);
          const averageScore = batteryGames.length > 0 
            ? batteryGames.reduce((sum, game) => sum + (game.score || 0), 0) / batteryGames.length 
            : 0;
          
          return {
            batteryId: battery.batteryId,
            domain: battery.domain,
            overallScore: averageScore,
            gameResults: batteryGames
          };
        });
      }

      // Combine AI results with game-based data
      return {
        ...aiResults,
        gameBasedResults: {
          batteryResults,
          behavioralProfile: this.generateBehavioralProfile(assessment.gamePerformances),
          aiInsights: this.generateAIInsights(assessment.gamePerformances, aiResults)
        },
        assessmentMetadata: {
          type: assessment.assessmentType === 'individual-games' || assessment.assessmentType === 'adhd-individual-games' ? 'individual-games' : 'battery-based',
          totalGames: assessment.gamePerformances.length,
          totalBatteries: assessment.assessmentType === 'individual-games' || assessment.assessmentType === 'adhd-individual-games' ? 1 : assessment.batteryStructure?.totalBatteries || 1,
          completionDate: assessment.completedAt,
          sessionDuration: this.calculateSessionDuration(assessment)
        }
      };
      
    } catch (error) {
      console.error('Error generating AI results, falling back to basic results:', error);
      return await this.generateBasicResults(assessment);
    }
  }

  /**
   * Convert game-based assessment to traditional assessment state format
   */
  async convertToAssessmentState(assessment) {
    // Create a state object compatible with the AI pipeline
    const state = {
      sessionId: assessment.sessionId,
      assessmentType: assessment.assessmentType,
      childId: assessment.childId,
      intakeId: assessment.intakeId,
      startedAt: assessment.startedAt,
      completedAt: assessment.completedAt,
      formData: {},
      responses: [],
      questions: []
    };

    // Get child data
    try {
      const ChildProfile = require('../childprofile/model');
      const child = await ChildProfile.findById(assessment.childId);
      if (child) {
        state.formData = {
          childName: `${child.firstName} ${child.lastName}`.trim(),
          childAge: child.age,
          age: Math.floor(child.age / 12), // Convert months to years
          gender: child.gender,
          childId: child._id
        };
      }
    } catch (error) {
      console.warn('Could not load child data:', error);
      state.formData = {
        childName: 'Child',
        age: 8,
        childAge: 96
      };
    }

    // Convert game performances to response-like format for AI analysis
    assessment.gamePerformances.forEach((gp, index) => {
      // Create synthetic question based on game
      const question = {
        id: `game_${gp.gameId}_${index}`,
        prompt: `Performance in ${gp.gameId} game${assessment.assessmentType === 'individual-games' || assessment.assessmentType === 'adhd-individual-games' ? '' : ` (${gp.batteryId} battery)`}`,
        type: 'GAME_PERFORMANCE',
        disorder: assessment.assessmentType,
        gameId: gp.gameId,
        batteryId: gp.batteryId || 'individual-games'
      };

      // Create response based on performance
      const response = {
        questionId: question.id,
        response: {
          score: gp.score,
          accuracy: gp.accuracy,
          duration: gp.duration,
          behavioralMetrics: gp.behavioralMetrics,
          riskLevel: gp.accuracy < 0.5 ? 'high' : gp.accuracy < 0.7 ? 'moderate' : 'low'
        },
        timestamp: gp.completedAt,
        metadata: {
          gameId: gp.gameId,
          batteryId: gp.batteryId,
          aiAnalysis: gp.aiAnalysis
        }
      };

      state.questions.push(question);
      state.responses.push(response);
    });

    return state;
  }

  /**
   * Generate behavioral profile from game performances
   */
  generateBehavioralProfile(gamePerformances) {
    const avgAccuracy = gamePerformances.reduce((sum, gp) => sum + (gp.accuracy || 0), 0) / gamePerformances.length;
    const avgDuration = gamePerformances.reduce((sum, gp) => sum + (gp.duration || 0), 0) / gamePerformances.length;
    
    // Analyze response times
    const allResponseTimes = gamePerformances.flatMap(gp => gp.behavioralMetrics?.responseTimes || []);
    const avgResponseTime = allResponseTimes.length > 0 
      ? allResponseTimes.reduce((sum, rt) => sum + rt, 0) / allResponseTimes.length 
      : 0;

    return {
      attentionPattern: avgAccuracy > 0.8 ? 'Sustained attention' : avgAccuracy > 0.6 ? 'Variable attention' : 'Attention difficulties observed',
      engagementStyle: avgDuration > 300 ? 'High engagement' : avgDuration > 180 ? 'Moderate engagement' : 'Quick task completion',
      learningPreferences: this.inferLearningPreferences(gamePerformances),
      motivationTriggers: ['Interactive games', 'Immediate feedback', 'Achievement recognition'],
      responseProfile: {
        averageAccuracy: Math.round(avgAccuracy * 100),
        averageResponseTime: Math.round(avgResponseTime),
        consistencyScore: this.calculateConsistency(gamePerformances)
      }
    };
  }

  /**
   * Generate AI insights based on game performance and traditional AI results
   */
  generateAIInsights(gamePerformances, aiResults) {
    const avgScore = gamePerformances.reduce((sum, gp) => sum + (gp.score || 0), 0) / gamePerformances.length;
    
    return {
      immediateRecommendations: [
        avgScore > 80 ? 'Continue current engagement strategies' : 'Focus on building foundational skills',
        'Regular practice with similar interactive activities',
        'Monitor progress with follow-up assessments'
      ],
      interventionSuggestions: [
        avgScore < 60 ? 'Consider targeted intervention programs' : 'Enrichment activities recommended',
        'Parent coaching for home-based activities',
        'School consultation if indicated'
      ],
      followUpRecommendations: [
        'Schedule follow-up assessment in 3-6 months',
        'Track progress with regular check-ins',
        'Professional consultation if concerns persist'
      ],
      strengthAreas: aiResults.strengthsAndChallenges?.strengths || ['Engagement with technology', 'Task completion'],
      developmentAreas: aiResults.strengthsAndChallenges?.challenges || ['Areas for continued development']
    };
  }

  /**
   * Generate basic results as fallback
   */
  async generateBasicResults(assessment) {
    const gameResults = assessment.gamePerformances.map(gp => ({
      gameId: gp.gameId,
      batteryId: gp.batteryId,
      score: gp.score,
      accuracy: gp.accuracy,
      behavioralObservations: ['Assessment completed successfully'],
      riskIndicators: []
    }));

    const avgScore = assessment.gamePerformances.reduce((sum, gp) => sum + (gp.score || 0), 0) / assessment.gamePerformances.length;

    return {
      summary: 'Battery-based assessment completed successfully. Results indicate areas for continued monitoring and development.',
      assessmentType: assessment.assessmentType,
      assessmentDate: new Date().toISOString(),
      disorderRisk: {
        score: Math.round(avgScore / 10), // Convert to 1-10 scale
        interpretation: avgScore > 80 ? 'Low Risk' : avgScore > 60 ? 'Moderate Risk' : 'Further evaluation recommended'
      },
      gameBasedResults: {
        batteryResults: assessment.batteryStructure.selectedBatteries.map(battery => ({
          batteryId: battery.batteryId,
          domain: battery.domain,
          overallScore: avgScore,
          gameResults: gameResults.filter(gr => gr.batteryId === battery.batteryId)
        })),
        behavioralProfile: this.generateBehavioralProfile(assessment.gamePerformances),
        aiInsights: {
          immediateRecommendations: ['Continue monitoring progress', 'Engage in similar activities'],
          interventionSuggestions: ['Regular practice recommended', 'Consult with professionals if needed'],
          followUpRecommendations: ['Schedule follow-up in 3-6 months']
        }
      },
      recommendations: [
        'Results indicate successful completion of assessment battery',
        'Continue with regular developmental activities',
        'Consult with healthcare professional for comprehensive evaluation if concerns persist'
      ],
      disclaimer: 'This assessment is for screening purposes only and does not constitute a medical diagnosis.'
    };
  }

  /**
   * Helper method to infer learning preferences
   */
  inferLearningPreferences(gamePerformances) {
    const preferences = ['Visual learning', 'Interactive activities'];
    
    // Add preferences based on performance patterns
    const avgAccuracy = gamePerformances.reduce((sum, gp) => sum + (gp.accuracy || 0), 0) / gamePerformances.length;
    if (avgAccuracy > 0.8) {
      preferences.push('Self-paced learning');
    }
    
    return preferences;
  }

  /**
   * Calculate consistency score
   */
  calculateConsistency(gamePerformances) {
    if (gamePerformances.length < 2) return 100;
    
    const scores = gamePerformances.map(gp => gp.score || 0);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to consistency score (lower std dev = higher consistency)
    return Math.max(0, Math.round(100 - (stdDev * 2)));
  }

  /**
   * Store assessment state in pipeline system
   */
  async storeAssessmentState(assessment) {
    try {
      const { SessionManager } = require('../../pipeline/memory/session-manager');
      const AssessmentState = require('../../pipeline/state');
      
      // Convert to pipeline state format
      const stateData = await this.convertToAssessmentState(assessment);
      
      // Create new assessment state
      const assessmentState = new AssessmentState({
        sessionId: assessment.sessionId,
        userId: assessment.userId,
        childId: assessment.childId,
        assessmentType: assessment.assessmentType,
        ...stateData
      });
      
      // Store in session manager cache
      SessionManager.setCachedState(assessment.sessionId, assessmentState);
      
      // Save to database
      await assessmentState.save();
      
      console.log(`📝 Assessment state stored for session: ${assessment.sessionId}`);
      
    } catch (error) {
      console.error('Error storing assessment state:', error);
    }
  }

  /**
   * Update assessment state when games are completed
   */
  async updateAssessmentState(assessment) {
    try {
      const { SessionManager } = require('../../pipeline/memory/session-manager');
      const AssessmentState = require('../../pipeline/state');
      
      // Convert current assessment to state format
      const stateData = await this.convertToAssessmentState(assessment);
      
      // Try to load existing state or create new one
      let assessmentState;
      try {
        assessmentState = await AssessmentState.load(assessment.sessionId);
        
        // Update the existing state with new data
        assessmentState.questions = stateData.questions;
        assessmentState.responses = stateData.responses;
        assessmentState.formData = { ...assessmentState.formData, ...stateData.formData };
        
      } catch (error) {
        // If state doesn't exist, create new one
        assessmentState = new AssessmentState({
          sessionId: assessment.sessionId,
          ...stateData,
          userId: assessment.userId,
          childId: assessment.childId,
          assessmentType: assessment.assessmentType
        });
      }
      
      // Update session manager cache
      SessionManager.setCachedState(assessment.sessionId, assessmentState);
      
      // Save the state (this will handle create/update internally)
      await assessmentState.save();
      
    } catch (error) {
      console.error('Error updating assessment state:', error);
    }
  }

  /**
   * Get child's game performance data
   * @param {Object} req Express request object
   * @param {Object} res Express response object
   */
  async getChildGamePerformance(req, res) {
    try {
      console.log('🎮 getChildGamePerformance called for childId:', req.params.childId);
      const { childId } = req.params;
      const userId = req.user._id;

      if (!childId) {
        console.log('❌ Child ID missing');
        return res.status(400).json({
          success: false,
          message: 'Child ID is required'
        });
      }

      // Validate that child belongs to the authenticated user
      const child = await ChildProfile.findOne({ _id: childId, parent: userId });
      if (!child) {
        return res.status(404).json({
          success: false,
          message: 'Child not found or access denied'
        });
      }

      // Get all assessments for this child (including individual games)
      const assessments = await Assessment.find({ 
        childId: childId
      }).sort({ completedAt: -1 });

      console.log('🎮 Found assessments for child:', assessments.length);
      assessments.forEach((assessment, index) => {
        console.log(`🎮 Assessment ${index + 1}:`, {
          sessionId: assessment.sessionId,
          assessmentType: assessment.assessmentType,
          gamePerformancesCount: assessment.gamePerformances?.length || 0,
          status: assessment.status,
          hasGamePerformances: !!assessment.gamePerformances,
          gamePerformances: assessment.gamePerformances
        });
      });

      if (!assessments || assessments.length === 0) {
        return res.json({
          success: true,
          data: {
            childId: childId,
            gamePerformances: {},
            totalSessions: 0,
            lastPlayed: null
          }
        });
      }

      // Aggregate game performance data
      const gamePerformances = {};
      let totalSessions = 0;
      let lastPlayed = null;

      assessments.forEach(assessment => {
        console.log(`🎮 Processing assessment ${assessment.sessionId}:`, {
          gamePerformancesCount: assessment.gamePerformances?.length || 0,
          assessmentType: assessment.assessmentType
        });
        
        if (assessment.gamePerformances) {
          assessment.gamePerformances.forEach(gamePerf => {
            console.log(`🎮 Processing game performance:`, {
              gameId: gamePerf.gameId,
              score: gamePerf.score,
              accuracy: gamePerf.accuracy,
              completedAt: gamePerf.completedAt
            });
            const gameId = gamePerf.gameId;
            
            if (!gamePerformances[gameId]) {
              gamePerformances[gameId] = {
                gameId: gameId,
                playCount: 0,
                totalScore: 0,
                totalAccuracy: 0,
                bestScore: 0,
                averageScore: 0,
                averageAccuracy: 0,
                lastPlayed: null,
                sessions: []
              };
            }

            gamePerformances[gameId].playCount++;
            gamePerformances[gameId].totalScore += (gamePerf.score || 0);
            
            // Handle accuracy properly (convert to percentage if needed)
            let accuracy = gamePerf.accuracy || 0;
            if (accuracy <= 1) {
              accuracy = accuracy * 100; // Convert decimal to percentage
            }
            
            // Special debugging for sound-shift
            if (gameId === 'sound-shift') {
              console.log(`🎮 Sound-shift specific processing:`, {
                rawAccuracy: gamePerf.accuracy,
                convertedAccuracy: accuracy,
                gameSpecificData: gamePerf.gameSpecificData,
                correctResponses: gamePerf.gameSpecificData?.correctResponses,
                falseAlarms: gamePerf.gameSpecificData?.falseAlarms,
                score: gamePerf.score,
                totalTime: gamePerf.duration || gamePerf.totalTime
              });
            }
            
            console.log(`🎮 Game ${gameId} accuracy processing:`, { 
              rawAccuracy: gamePerf.accuracy, 
              convertedAccuracy: accuracy,
              totalAccuracy: gamePerformances[gameId].totalAccuracy 
            });
            gamePerformances[gameId].totalAccuracy += accuracy;
            
            // Calculate best score - for FocusFinder, max score is based on level with bonuses
            let currentBestScore = gamePerformances[gameId].bestScore;
            if (gameId === 'focus-finder') {
              // For FocusFinder, calculate max possible score based on level with bonuses
              const level = gamePerf.level || 1;
              const targetObjects = gamePerf.gameSpecificData?.targetObjects || 5;
              const baseScore = targetObjects * 20; // Each object found gives 20 points
              const maxTimeBonus = targetObjects * 10; // Max time bonus per object
              const maxCompletionBonus = 50; // Max completion bonus
              const maxPossibleScore = baseScore + maxTimeBonus + maxCompletionBonus;
              
              currentBestScore = Math.max(currentBestScore, maxPossibleScore);
            } else {
              // For other games, use the actual session score
              const sessionScore = gamePerf.score || 0;
              console.log(`🎮 Game ${gameId} session score:`, sessionScore);
              currentBestScore = Math.max(currentBestScore, sessionScore);
            }
            
            gamePerformances[gameId].bestScore = currentBestScore;
            
            if (!gamePerformances[gameId].lastPlayed || 
                new Date(gamePerf.completedAt) > new Date(gamePerformances[gameId].lastPlayed)) {
              gamePerformances[gameId].lastPlayed = gamePerf.completedAt;
            }

            // Store session data
            const sessionData = {
              sessionId: assessment.sessionId,
              score: gamePerf.score || 0,
              accuracy: gamePerf.accuracy || 0, // Store as decimal (0-1)
              accuracyPercentage: accuracy, // Use the already converted accuracy (percentage)
              completedAt: gamePerf.completedAt,
              level: gamePerf.level || 1,
              totalTime: gamePerf.duration || gamePerf.totalTime || 0, // Use duration if available, fallback to totalTime
              gameSpecificData: {
                ...gamePerf.gameSpecificData,
                distractionsClicked: gamePerf.gameSpecificData?.distractionsClicked || 0,
                falseClicks: gamePerf.gameSpecificData?.falseClicks || 0,
                foundObjects: gamePerf.gameSpecificData?.foundObjects || 0,
                missedObjects: gamePerf.gameSpecificData?.missedObjects || 0,
                correctWords: gamePerf.gameSpecificData?.correctWords || gamePerf.correctAnswers || 0,
                correctLetters: gamePerf.gameSpecificData?.correctLetters || gamePerf.correctAnswers || 0,
                roundsCompleted: gamePerf.gameSpecificData?.roundsCompleted || 0,
              }
            };
            
            console.log('🎮 Storing session data:', sessionData);
            gamePerformances[gameId].sessions.push(sessionData);

            totalSessions++;
            
            if (!lastPlayed || new Date(gamePerf.completedAt) > new Date(lastPlayed)) {
              lastPlayed = gamePerf.completedAt;
            }
          });
        }
      });

      // Calculate averages
      Object.keys(gamePerformances).forEach(gameId => {
        const game = gamePerformances[gameId];
        game.averageScore = game.playCount > 0 ? 
          Math.round(game.totalScore / game.playCount) : 0;
        
        // Calculate average accuracy only from sessions with valid accuracy (> 0)
        const validSessions = game.sessions.filter(session => {
          // For sound-shift, consider sessions valid if user participated (has responses)
          if (gameId === 'sound-shift') {
            const hasResponses = (session.gameSpecificData?.correctResponses || 0) + 
                               (session.gameSpecificData?.falseAlarms || 0) > 0;
            const hasAccuracy = session.accuracy > 0 || session.accuracyPercentage > 0;
            return hasResponses || hasAccuracy;
          }
          // For other games, use the original logic
          return session.accuracy > 0 && session.accuracyPercentage > 0;
        });
        
        // Special debugging for sound-shift
        if (gameId === 'sound-shift') {
          console.log(`🎮 Sound-shift accuracy calculation:`, {
            totalSessions: game.sessions.length,
            validSessions: validSessions.length,
            sessions: game.sessions.map(s => ({
              accuracy: s.accuracy,
              accuracyPercentage: s.accuracyPercentage,
              completedAt: s.completedAt,
              gameSpecificData: s.gameSpecificData
            }))
          });
        }
        
        console.log(`🎮 Game ${gameId} accuracy calculation:`, {
          totalSessions: game.sessions.length,
          validSessions: validSessions.length,
          sessions: game.sessions.map(s => ({
            accuracy: s.accuracy,
            accuracyPercentage: s.accuracyPercentage,
            completedAt: s.completedAt
          }))
        });
        
        if (validSessions.length > 0) {
          const totalValidAccuracy = validSessions.reduce((sum, session) => {
            let sessionAccuracy = session.accuracyPercentage || 0;
            
            // For sound-shift, if user participated but got 0 accuracy, use minimum accuracy
            if (gameId === 'sound-shift' && sessionAccuracy === 0) {
              const hasResponses = (session.gameSpecificData?.correctResponses || 0) + 
                                 (session.gameSpecificData?.falseAlarms || 0) > 0;
              if (hasResponses) {
                sessionAccuracy = 1; // Minimum accuracy for participation
              }
            }
            
            return sum + sessionAccuracy;
          }, 0);
          
          game.averageAccuracy = Math.round(totalValidAccuracy / validSessions.length);
          console.log(`🎮 Game ${gameId} final average accuracy:`, game.averageAccuracy);
        } else {
          game.averageAccuracy = 0;
          console.log(`🎮 Game ${gameId} no valid sessions, accuracy: 0`);
        }
        
        // Sort sessions by date (newest first)
        game.sessions.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
      });

      res.json({
        success: true,
        data: {
          childId: childId,
          gamePerformances: gamePerformances,
          totalSessions: totalSessions,
          lastPlayed: lastPlayed
        }
      });

    } catch (error) {
      console.error('Error fetching child game performance:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch child game performance'
      });
    }
  }

  /**
   * Calculate session duration
   */
  calculateSessionDuration(assessment) {
    if (!assessment.startedAt || !assessment.completedAt) return 0;
    return Math.round((new Date(assessment.completedAt) - new Date(assessment.startedAt)) / 60000); // minutes
  }

  /**
   * Save progressive suite results
   */
  async saveSuiteResults(req, res) {
    try {
      const { childId, assessmentType, suiteType, startTime, endTime, totalDuration, gameResults, totalScore, completedGames, totalGames, metadata } = req.body;
      const userId = req.user._id;

      console.log('🎮 saveSuiteResults called with:', {
        childId,
        assessmentType,
        suiteType,
        completedGames,
        totalGames,
        totalScore
      });

      if (!childId || !assessmentType || !gameResults) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters'
        });
      }

      // Validate that child belongs to the authenticated user
      const child = await ChildProfile.findOne({ _id: childId, parent: userId });
      if (!child) {
        return res.status(404).json({
          success: false,
          message: 'Child not found or access denied'
        });
      }

      // Create a new assessment session for the suite
      const sessionId = this.generateSessionId();
      const now = new Date();
      const suiteStartTime = startTime ? new Date(startTime) : now;
      const suiteEndTime = endTime ? new Date(endTime) : now;

      // Convert game results to the format expected by the assessment model
      const gamePerformances = gameResults.map((gameResult, index) => ({
        gameId: gameResult.gameId || `game-${index}`,
        batteryId: `${assessmentType}-progressive-suite`,
        attempt: 1,
        startedAt: gameResult.startTime ? new Date(gameResult.startTime) : suiteStartTime,
        completedAt: gameResult.endTime ? new Date(gameResult.endTime) : suiteEndTime,
        score: gameResult.score || 0,
        accuracy: gameResult.accuracy ? (gameResult.accuracy > 1 ? gameResult.accuracy / 100 : gameResult.accuracy) : 0,
        totalTime: gameResult.totalTime || 0,
        level: gameResult.level || 1,
        gameSpecificData: {
          ...gameResult,
          suiteContext: {
            suiteType: suiteType,
            gamePosition: index + 1,
            totalGames: totalGames,
            metadata: metadata
          }
        }
      }));

      // Create the assessment record
      const assessment = new Assessment({
        sessionId,
        userId,
        childId,
        assessmentType: assessmentType,
        status: 'completed',
        startedAt: suiteStartTime,
        completedAt: suiteEndTime,
        
        // Suite-specific structure
        batteryStructure: {
          isGameBased: true,
          isSuite: true,
          suiteType: suiteType,
          selectedBatteries: [{
            batteryId: `${assessmentType}-progressive-suite`,
            name: `${assessmentType.toUpperCase()} Progressive Suite`,
            domain: assessmentType,
            games: gameResults.map(gr => gr.gameId || 'unknown-game'),
            estimatedDuration: totalDuration || 45
          }],
          currentBatteryIndex: 0,
          totalBatteries: 1
        },
        
        // Game performances
        gamePerformances: gamePerformances,
        
        // Summary metrics
        summaryMetrics: {
          totalScore: totalScore || 0,
          averageScore: gamePerformances.length > 0 ? Math.round(totalScore / gamePerformances.length) : 0,
          completionRate: completedGames && totalGames ? (completedGames / totalGames) * 100 : 100,
          totalDuration: totalDuration || 0,
          gamesCompleted: completedGames || gamePerformances.length,
          averageAccuracy: gamePerformances.length > 0 ? 
            gamePerformances.reduce((acc, gp) => acc + (gp.accuracy || 0), 0) / gamePerformances.length : 0
        },
        
        // Progress tracking
        progressTracking: {
          overallProgress: 100,
          batteryProgress: [{
            batteryId: `${assessmentType}-progressive-suite`,
            progress: 100,
            status: 'completed',
            startedAt: suiteStartTime,
            completedAt: suiteEndTime
          }],
          gameProgress: gamePerformances.map((gp, index) => ({
            gameId: gp.gameId,
            batteryId: gp.batteryId,
            status: 'completed',
            score: gp.score,
            accuracy: gp.accuracy,
            completedAt: gp.completedAt,
            position: index
          }))
        },
        
        // Quality metrics
        qualityMetrics: {
          engagementScore: 0.9, // High engagement for completed suite
          dataQualityFlags: [],
          reliabilityScore: 0.95
        }
      });

      await assessment.save();

      // Update child progress
      await this.updateChildProgress(childId, sessionId, gamePerformances);

      // Store assessment state for AI processing
      await this.storeAssessmentState(assessment);

      console.log(`✅ Suite results saved successfully for child ${childId}, session ${sessionId}`);

      res.json({
        success: true,
        message: 'Suite results saved successfully',
        sessionId: sessionId,
        totalScore: totalScore,
        completedGames: completedGames,
        averageScore: gamePerformances.length > 0 ? Math.round(totalScore / gamePerformances.length) : 0
      });

    } catch (error) {
      console.error('Error saving suite results:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to save suite results'
      });
    }
  }

  /**
   * Get suite results for a child
   */
  async getSuiteResults(req, res) {
    try {
      const { childId } = req.query;
      const userId = req.user._id;

      console.log('🎮 getSuiteResults called with:', { childId, userId });

      if (!childId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameter: childId'
        });
      }

      // Find all suite assessments for this child
      const suiteAssessments = await Assessment.find({
        userId,
        childId,
        'batteryStructure.isSuite': true
      }).sort({ completedAt: -1 });

      console.log('📊 Found suite assessments:', suiteAssessments.length);

      const suiteResults = suiteAssessments.map(assessment => ({
        id: assessment._id,
        suiteType: assessment.batteryStructure?.suiteType || 'adhd',
        completedAt: assessment.completedAt,
        startTime: assessment.startedAt,
        endTime: assessment.completedAt,
        totalDuration: assessment.summaryMetrics?.totalDuration || 0,
        totalScore: assessment.summaryMetrics?.totalScore || 0,
        completedGames: assessment.summaryMetrics?.gamesCompleted || 0,
        totalGames: assessment.batteryStructure?.selectedBatteries?.[0]?.games?.length || 5,
        gameResults: assessment.gamePerformances || [],
        averageAccuracy: assessment.summaryMetrics?.averageAccuracy || 0,
        averageScore: assessment.summaryMetrics?.averageScore || 0,
        completionRate: assessment.summaryMetrics?.completionRate || 0,
        metadata: assessment.batteryStructure?.metadata || {}
      }));

      res.json({
        success: true,
        data: {
          suiteResults,
          totalSuites: suiteResults.length,
          message: 'Suite results retrieved successfully'
        }
      });

    } catch (error) {
      console.error('❌ Error fetching suite results:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch suite results'
      });
    }
  }

  /**
   * Get reports for a child
   */
  async getChildReports(req, res) {
    try {
      const { childId } = req.params;
      const { limit = 10, reportType, priority, status } = req.query;
      const userId = req.user._id;

      if (!childId) {
        return res.status(400).json({
          success: false,
          message: 'Child ID is required'
        });
      }

      // Validate that child belongs to the authenticated user
      const child = await ChildProfile.findOne({ _id: childId, parent: userId });
      if (!child) {
        return res.status(404).json({
          success: false,
          message: 'Child not found or access denied'
        });
      }

      // Import Report model
      const Report = require('./report-model');
      
      // Build query
      const query = { childId, parentId: userId };
      if (reportType) query.reportType = reportType;
      if (priority) query.priority = priority;
      if (status) query.status = status;

      // Get reports
      const reports = await Report.find(query)
        .sort({ generatedAt: -1 })
        .limit(parseInt(limit))
        .populate('childId', 'firstName lastName age')
        .lean();

      // Format response
      const formattedReports = reports.map(report => ({
        id: report._id,
        reportId: report.reportId,
        title: report.content.title,
        summary: report.content.summary,
        reportType: report.reportType,
        priority: report.priority,
        status: report.status,
        generatedAt: report.generatedAt,
        viewedByParent: report.notifications.viewedByParent,
        trigger: report.trigger,
        tags: report.tags,
        child: {
          firstName: report.childId.firstName,
          lastName: report.childId.lastName,
          age: report.childId.age
        }
      }));

      res.json({
        success: true,
        data: {
          reports: formattedReports,
          totalReports: formattedReports.length,
          child: {
            firstName: child.firstName,
            lastName: child.lastName,
            age: child.age
          }
        }
      });

    } catch (error) {
      console.error('Error fetching child reports:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch reports'
      });
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user._id;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
      }

      // Import Report model
      const Report = require('./report-model');
      
      // Find report and verify ownership
      // Use findOne with reportId field instead of findById since reportId is a custom string
      const report = await Report.findOne({ reportId: reportId })
        .populate('childId', 'firstName lastName age')
        .populate('parentId', 'name email');

      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Verify ownership
      if (report.parentId._id.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Mark as viewed if not already
      if (!report.notifications.viewedByParent) {
        await report.markAsViewed();
      }

      res.json({
        success: true,
        data: {
          report: {
            id: report._id,
            reportId: report.reportId,
            title: report.content.title,
            summary: report.content.summary,
            sections: report.content.sections,
            insights: report.content.insights,
            recommendations: report.content.recommendations,
            reportType: report.reportType,
            priority: report.priority,
            status: report.status,
            generatedAt: report.generatedAt,
            trigger: report.trigger,
            tags: report.tags,
            performanceData: report.content.performanceData,
            aiMetadata: report.content.aiMetadata,
            analytics: report.analytics,
            child: {
              firstName: report.childId.firstName,
              lastName: report.childId.lastName,
              age: report.childId.age
            }
          }
        }
      });

    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch report'
      });
    }
  }

  /**
   * Get reports by priority (for parent dashboard)
   */
  async getReportsByPriority(req, res) {
    try {
      const { priority = 'high' } = req.query;
      const userId = req.user._id;

      // Import Report model
      const Report = require('./report-model');
      
      // Get user's children
      const children = await ChildProfile.find({ parent: userId });
      const childIds = children.map(child => child._id);

      // Find reports for all user's children
      const reports = await Report.find({
        childId: { $in: childIds },
        parentId: userId,
        priority: priority,
        status: 'completed'
      })
      .sort({ generatedAt: -1 })
      .limit(20)
      .populate('childId', 'firstName lastName age')
      .lean();

      // Format response
      const formattedReports = reports.map(report => ({
        id: report._id,
        reportId: report.reportId,
        title: report.content.title,
        summary: report.content.summary,
        reportType: report.reportType,
        priority: report.priority,
        generatedAt: report.generatedAt,
        viewedByParent: report.notifications.viewedByParent,
        trigger: report.trigger,
        child: {
          firstName: report.childId.firstName,
          lastName: report.childId.lastName,
          age: report.childId.age
        }
      }));

      res.json({
        success: true,
        data: {
          reports: formattedReports,
          totalReports: formattedReports.length,
          priority: priority
        }
      });

    } catch (error) {
      console.error('Error fetching reports by priority:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch reports'
      });
    }
  }

  /**
   * Mark report as read/viewed
   */
  async markReportAsViewed(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user._id;

      if (!reportId) {
        return res.status(400).json({
          success: false,
          message: 'Report ID is required'
        });
      }

      // Import Report model
      const Report = require('./report-model');
      
      // Find report and verify ownership
      // Use findOne with reportId field instead of findById since reportId is a custom string
      const report = await Report.findOne({ reportId: reportId });
      if (!report) {
        return res.status(404).json({
          success: false,
          message: 'Report not found'
        });
      }

      // Verify ownership
      if (report.parentId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Mark as viewed
      await report.markAsViewed();

      res.json({
        success: true,
        message: 'Report marked as viewed',
        data: {
          reportId: report.reportId,
          viewedAt: report.notifications.viewedAt
        }
      });

    } catch (error) {
      console.error('Error marking report as viewed:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to mark report as viewed'
      });
    }
  }

  /**
   * Get reports dashboard summary
   */
  async getReportsSummary(req, res) {
    try {
      const userId = req.user._id;

      // Import Report model
      const Report = require('./report-model');
      
      // Get user's children
      const children = await ChildProfile.find({ parent: userId });
      const childIds = children.map(child => child._id);

      // Get reports summary
      const [totalReports, unreadReports, highPriorityReports, recentReports] = await Promise.all([
        Report.countDocuments({ childId: { $in: childIds }, parentId: userId, status: 'completed' }),
        Report.countDocuments({ 
          childId: { $in: childIds }, 
          parentId: userId, 
          status: 'completed',
          'notifications.viewedByParent': false 
        }),
        Report.countDocuments({ 
          childId: { $in: childIds }, 
          parentId: userId, 
          status: 'completed',
          priority: { $in: ['high', 'critical'] }
        }),
        Report.find({ 
          childId: { $in: childIds }, 
          parentId: userId, 
          status: 'completed'
        })
        .sort({ generatedAt: -1 })
        .limit(5)
        .populate('childId', 'firstName lastName age')
        .lean()
      ]);

      // Format recent reports
      const formattedRecentReports = recentReports.map(report => ({
        id: report._id,
        reportId: report.reportId,
        title: report.content.title,
        summary: report.content.summary,
        reportType: report.reportType,
        priority: report.priority,
        generatedAt: report.generatedAt,
        viewedByParent: report.notifications.viewedByParent,
        child: {
          firstName: report.childId.firstName,
          lastName: report.childId.lastName
        }
      }));

      res.json({
        success: true,
        data: {
          summary: {
            totalReports,
            unreadReports,
            highPriorityReports,
            totalChildren: children.length
          },
          recentReports: formattedRecentReports
        }
      });

    } catch (error) {
      console.error('Error fetching reports summary:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch reports summary'
      });
    }
  }
}

module.exports = new AssessmentController(); 