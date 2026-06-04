const SuiteSession = require('./suite-session-model');
const ChildProfile = require('../childprofile/model');
const Report = require('./report-model');
const LLMReportService = require('./llm-report-service');
const EmailNotificationService = require('./email-notification-service');

class SuiteController {
  constructor() {
    this.llmService = new LLMReportService();
  }

  /**
   * Start a new progressive suite session
   */
  async startProgressiveSuite(req, res) {
    try {
      const { childId, suiteType } = req.body;
      const userId = req.user._id;

      console.log('🎮 Starting progressive suite:', { childId, suiteType, userId });
      console.log('🎮 Request body:', req.body);
      console.log('🎮 User:', req.user);

      // Validate required fields
      if (!childId) {
        console.log('❌ Missing childId');
        return res.status(400).json({
          success: false,
          message: 'Child ID is required'
        });
      }

      if (!suiteType) {
        console.log('❌ Missing suiteType');
        return res.status(400).json({
          success: false,
          message: 'Suite type is required'
        });
      }

      // Validate child belongs to user
      const child = await ChildProfile.findOne({ _id: childId, parent: userId });
      if (!child) {
        console.log('❌ Child not found or access denied:', { childId, userId });
        return res.status(404).json({
          success: false,
          message: 'Child not found or access denied'
        });
      }

      console.log('✅ Child validated:', child.firstName);

      // Check for existing active session
      const existingSession = await SuiteSession.findOne({
        childId,
        suiteType,
        status: { $in: ['active', 'paused'] }
      });

      if (existingSession) {
        console.log('🔄 Found existing session:', existingSession.sessionId);
        return res.json({
          success: true,
          message: 'Resuming existing session',
          session: existingSession,
          action: 'resume'
        });
      }

      // Get suite configuration
      const suiteConfig = this.getSuiteConfiguration(suiteType);
      console.log('✅ Suite config loaded:', suiteConfig);

      // Create new session
      const session = new SuiteSession({
        childId,
        parentId: userId,
        suiteType,
        status: 'active',
        suiteConfig,
        startTime: new Date(),
        lastActiveAt: new Date()
      });

      await session.save();
      console.log(`✅ Progressive suite started: ${session.sessionId}`);

      res.json({
        success: true,
        message: 'Progressive suite started successfully',
        session: session,
        action: 'start'
      });

    } catch (error) {
      console.error('❌ Error starting progressive suite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to start progressive suite'
      });
    }
  }

  /**
   * Update suite progress
   */
  async updateSuiteProgress(req, res) {
    try {
      const { sessionId, currentGameIndex, completedGames, gameResults, behavioralMetrics } = req.body;
      const userId = req.user._id;

      console.log('🎮 Updating suite progress:', { sessionId, currentGameIndex });
      console.log('🎮 Request body:', req.body);
      console.log('🎮 User:', req.user);

      // Validate required fields
      if (!sessionId) {
        console.log('❌ Missing sessionId');
        return res.status(400).json({
          success: false,
          message: 'Session ID is required'
        });
      }

      // Find and validate session
      const session = await SuiteSession.findOne({ sessionId, parentId: userId });
      if (!session) {
        console.log('❌ Session not found or access denied:', { sessionId, userId });
        return res.status(404).json({
          success: false,
          message: 'Session not found or access denied'
        });
      }

      console.log('✅ Session found:', session.sessionId);
      
      // Debug: Log schema structure for behavioralMetrics
      const schema = SuiteSession.schema;
      const behavioralMetricsPath = schema.path('gameResults.0.behavioralMetrics.errorAnalysis');
      console.log('🔍 Schema validation - errorAnalysis path:', {
        exists: !!behavioralMetricsPath,
        type: behavioralMetricsPath?.instance
      });

      // Clean and validate gameResults data
      let cleanedGameResults = gameResults.map(gameResult => {
        // Deep clone to avoid mutating original data
        const cleaned = JSON.parse(JSON.stringify(gameResult));
        
        // Ensure behavioralMetrics has the correct structure
        if (cleaned.behavioralMetrics) {
          if (typeof cleaned.behavioralMetrics === 'string') {
            try {
              cleaned.behavioralMetrics = JSON.parse(cleaned.behavioralMetrics);
            } catch (e) {
              console.log('❌ Failed to parse behavioralMetrics string:', cleaned.behavioralMetrics);
              cleaned.behavioralMetrics = {
                responseTimes: [],
                timeToFirstResponse: 0,
                breakRequests: 0,
                errorAnalysis: {
                  totalErrors: 0
                },
                engagementData: {
                  helpRequests: 0,
                  distractionEvents: 0,
                  frustrationIndicators: 0
                }
              };
            }
          }
          
          // Remove errorTypes field to prevent validation issues
          if (cleaned.behavioralMetrics.errorAnalysis) {
            delete cleaned.behavioralMetrics.errorAnalysis.errorTypes;
          }
        }
        
        return cleaned;
      });

      // Remove errorTypes field from all game results to prevent validation issues
      cleanedGameResults = cleanedGameResults.map(gameResult => {
        if (gameResult.behavioralMetrics && gameResult.behavioralMetrics.errorAnalysis) {
          delete gameResult.behavioralMetrics.errorAnalysis.errorTypes;
        }
        return gameResult;
      });

      console.log('✅ Cleaned game results:', JSON.stringify(cleanedGameResults, null, 2));

      // Update session progress
      session.currentGameIndex = currentGameIndex;
      session.completedGames = completedGames;
      session.gameResults = cleanedGameResults;
      session.lastActiveAt = new Date();

      // Update behavioral profile if provided
      if (behavioralMetrics) {
        session.behavioralProfile = {
          ...session.behavioralProfile,
          ...behavioralMetrics
        };
      }

      try {
        // Debug: Log the structure of behavioralMetrics before saving
        if (cleanedGameResults.length > 0 && cleanedGameResults[0].behavioralMetrics) {
          console.log('🔍 Debug - behavioralMetrics structure before save:', {
            hasErrorAnalysis: !!cleanedGameResults[0].behavioralMetrics.errorAnalysis
          });
        }
        
        await session.save();
        console.log(`✅ Suite progress updated: ${sessionId}`);
      } catch (saveError) {
        console.error('❌ Error saving session:', saveError);
        
        // Log detailed error information
        if (saveError.errors) {
          Object.keys(saveError.errors).forEach(field => {
            console.error(`❌ Field validation error for ${field}:`, saveError.errors[field]);
          });
        }
        console.error('❌ Error saving session:', saveError);
        
        // If there's still a validation error, try to save without behavioralMetrics
        if (saveError.name === 'ValidationError') {
          console.log('🔄 Attempting to save without behavioralMetrics...');
          
          // Remove entire behavioralMetrics to prevent any validation issues
          session.gameResults = cleanedGameResults.map(gameResult => {
            const { behavioralMetrics, ...rest } = gameResult;
            return rest;
          });
          
          try {
            await session.save();
            console.log(`✅ Suite progress updated (without behavioralMetrics): ${sessionId}`);
          } catch (finalError) {
            console.error('❌ Final save attempt failed:', finalError);
            throw finalError;
          }
        } else {
          // Log detailed error information for debugging
          console.error('❌ Detailed validation error:', {
            name: saveError.name,
            message: saveError.message,
            errors: saveError.errors
          });
          
          // If it's a validation error but not handled above, log the specific field causing issues
          if (saveError.errors) {
            Object.keys(saveError.errors).forEach(field => {
              console.error(`❌ Field validation error for ${field}:`, saveError.errors[field]);
            });
          }
          
          throw saveError;
        }
      }

      res.json({
        success: true,
        message: 'Progress saved successfully',
        session: session
      });

    } catch (error) {
      console.error('❌ Error updating suite progress:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update progress'
      });
    }
  }

  /**
   * Complete progressive suite
   */
  async completeProgressiveSuite(req, res) {
    try {
      const { sessionId, finalGameResult, behavioralProfile } = req.body;
      const userId = req.user._id;

      console.log('🎮 Completing progressive suite:', { sessionId, userId });
      console.log('🎮 Request body:', req.body);

      // Find and validate session
      const session = await SuiteSession.findOne({ sessionId, parentId: userId });
      if (!session) {
        console.log('❌ Session not found:', { sessionId, parentId: userId });
        return res.status(404).json({
          success: false,
          message: 'Session not found or access denied'
        });
      }

      console.log('✅ Session found for completion:', session.sessionId);

      // Check if report already exists to prevent duplicate generation
      if (session.reportStatus?.generated && session.reportStatus?.reportId) {
        console.log('📊 Report already exists for session:', session.sessionId);
        return res.json({
          success: true,
          message: 'Progressive suite already completed with report',
          session: session,
          report: {
            id: session.reportStatus.reportId,
            reportId: session.reportStatus.reportId,
            title: 'Report already generated',
            summary: 'Report was previously generated for this session'
          }
        });
      }

      // Add final game result if provided
      if (finalGameResult) {
        session.gameResults.push({
          ...finalGameResult,
          completedAt: new Date()
        });
      }

      // Update session status
      session.status = 'completed';
      session.lastActiveAt = new Date();
      session.totalDuration = Date.now() - session.startTime;

      // Update behavioral profile
      if (behavioralProfile) {
        session.behavioralProfile = {
          ...session.behavioralProfile,
          ...behavioralProfile
        };
      }

      // Calculate summary metrics
      const totalScore = session.gameResults.reduce((sum, game) => sum + (game.score || 0), 0);
      const avgScore = session.gameResults.length > 0 ? totalScore / session.gameResults.length : 0;
      const avgAccuracy = session.gameResults.length > 0 
        ? session.gameResults.reduce((sum, game) => sum + (game.accuracy || 0), 0) / session.gameResults.length 
        : 0;

      session.summaryMetrics = {
        totalScore,
        averageScore: avgScore,
        averageAccuracy: avgAccuracy,
        gamesCompleted: session.gameResults.length,
        totalGames: session.suiteConfig?.totalGames || session.gameResults.length,
        completionRate: session.gameResults.length / (session.suiteConfig?.totalGames || session.gameResults.length)
      };

      // Generate comprehensive LLM report
      try {
        const LLMReportService = require('./llm-report-service');
        const llmService = new LLMReportService();
        
        // Get child profile
        const childProfile = await ChildProfile.findById(session.childId);
        if (!childProfile) {
          throw new Error('Child profile not found');
        }

        // Prepare suite data for LLM analysis
        const suiteData = {
          sessionId: session.sessionId,
          suiteType: session.suiteType,
          childProfile: childProfile,
          gameResults: session.gameResults,
          behavioralProfile: session.behavioralProfile,
          summaryMetrics: session.summaryMetrics,
          totalDuration: session.totalDuration,
          suiteConfig: session.suiteConfig
        };

        console.log('🤖 Generating LLM report for suite:', session.sessionId);
        
        // Generate comprehensive report using LLM
        const report = await llmService.generateProgressiveSuiteReport(suiteData, childProfile);
        
        console.log('✅ LLM report generated successfully:', report.reportId);

        // Set report status with the actual report ID
        session.reportStatus = {
          generated: true,
          reportId: report.reportId,
          emailSent: false,
          emailSentAt: null
        };

        await session.save();
        console.log('✅ Session saved with report status:', session.reportStatus);

        // Increment usage for suite once per session
        try {
          if (session.usageCounted !== true) {
            const { incrementUsage } = require('../pricing/usage');
            let incResult = null;
            await incrementUsage({ user: req.user, body: { resourceType: 'suite', resourceKey: session.suiteType, assessmentType: session.suiteType } }, {
              json: (d) => { incResult = d; },
              status: (c) => ({ json: (o) => { incResult = { code: c, ...o }; } }),
            });
            console.log('🧮 Usage increment (suite) result:', incResult);
            session.usageCounted = true;
            await session.save();
          }
        } catch (suiteIncErr) {
          console.warn('Suite usage increment failed:', suiteIncErr.message);
        }

        res.json({
          success: true,
          message: 'Progressive suite completed successfully with comprehensive report',
          session: session,
          report: {
            id: report._id,
            reportId: report.reportId,
            title: report.content.title,
            summary: report.content.summary
          }
        });

      } catch (reportError) {
        console.error('❌ Error generating LLM report:', reportError);
        
        // Fallback to basic report if LLM fails
        try {
          session.reportStatus = {
            generated: true,
            reportId: `fallback-${session.sessionId}`,
            emailSent: false,
            emailSentAt: null
          };

          await session.save();
          
          res.json({
            success: true,
            message: 'Progressive suite completed with fallback report',
            session: session,
            report: {
              id: `fallback-${session.sessionId}`,
              reportId: `fallback-${session.sessionId}`,
              title: `${session.suiteType.charAt(0).toUpperCase() + session.suiteType.slice(1)} Assessment Report`,
              summary: `Your child completed the ${session.suiteType} progressive suite with an average accuracy of ${avgAccuracy.toFixed(1)}% and average score of ${avgScore.toFixed(1)}.`
            }
          });
        } catch (fallbackError) {
          console.error('❌ Error saving fallback report:', fallbackError);
          res.status(500).json({
            success: false,
            message: 'Failed to complete suite and generate report'
          });
        }
      }

    } catch (error) {
      console.error('❌ Error completing progressive suite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to complete suite'
      });
    }
  }

  /**
   * Get suite status
   */
  async getSuiteStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const session = await SuiteSession.findOne({ sessionId, parentId: userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or access denied'
        });
      }

      res.json({
        success: true,
        session: session
      });

    } catch (error) {
      console.error('❌ Error getting suite status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get suite status'
      });
    }
  }

  /**
   * Get suite history for a child
   */
  async getSuiteHistory(req, res) {
    try {
      const { childId } = req.params;
      const userId = req.user._id;

      // Validate child belongs to user
      const child = await ChildProfile.findOne({ _id: childId, parent: userId });
      if (!child) {
        return res.status(404).json({
          success: false,
          message: 'Child not found or access denied'
        });
      }

      const sessions = await SuiteSession.find({
        childId,
        parentId: userId
      }).sort({ startTime: -1 });

      const suiteHistory = sessions.map(session => {
        // Calculate summary metrics if not present
        let summaryMetrics = session.summaryMetrics;
        if (!summaryMetrics && session.gameResults && session.gameResults.length > 0) {
          const totalScore = session.gameResults.reduce((sum, game) => sum + (game.score || 0), 0);
          const totalAccuracy = session.gameResults.reduce((sum, game) => sum + (game.accuracy || 0), 0);
          const avgScore = totalScore / session.gameResults.length;
          const avgAccuracy = totalAccuracy / session.gameResults.length;
          
          summaryMetrics = {
            totalScore: totalScore,
            averageScore: avgScore,
            completionRate: session.completedGames ? (session.completedGames.length / (session.suiteConfig?.totalGames || 7)) * 100 : 0,
            averageAccuracy: avgAccuracy,
            gamesCompleted: session.gameResults.length
          };
        }

        // Calculate duration in minutes properly
        let totalDuration = session.totalDuration;
        if (!totalDuration && session.startTime && session.lastActiveAt) {
          const durationMs = new Date(session.lastActiveAt) - new Date(session.startTime);
          totalDuration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        }

        // Handle cases where duration might be stored in seconds or milliseconds
        if (totalDuration > 1000000) {
          // Likely stored in milliseconds
          totalDuration = Math.round(totalDuration / (1000 * 60));
        } else if (totalDuration > 1440) {
          // Likely stored in seconds
          totalDuration = Math.round(totalDuration / 60);
        }

        // Cap duration at reasonable maximum (65 minutes for ADHD suite)
        const maxDuration = 65;
        if (totalDuration > maxDuration) {
          totalDuration = maxDuration;
        }

        return {
          sessionId: session.sessionId,
          suiteType: session.suiteType,
          status: session.status,
          startTime: session.startTime,
          completedAt: session.status === 'completed' ? session.lastActiveAt : null,
          totalDuration: totalDuration,
          totalScore: summaryMetrics?.totalScore || 0,
          averageScore: summaryMetrics?.averageScore || 0,
          completedGames: session.completedGames?.length || 0,
          totalGames: session.suiteConfig?.totalGames || 7,
          progress: session.progressPercentage,
          summaryMetrics: summaryMetrics,
          reportStatus: session.reportStatus
        };
      });

      res.json({
        success: true,
        suites: suiteHistory,
        totalSuites: suiteHistory.length
      });

    } catch (error) {
      console.error('❌ Error getting suite history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get suite history'
      });
    }
  }

  /**
   * Resume suite session
   */
  async resumeSuite(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      const session = await SuiteSession.findOne({ sessionId, parentId: userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or access denied'
        });
      }

      if (session.status === 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Cannot resume completed session'
        });
      }

      // Update session status
      session.status = 'active';
      session.lastActiveAt = new Date();

      await session.save();

      res.json({
        success: true,
        message: 'Suite resumed successfully',
        session: session
      });

    } catch (error) {
      console.error('❌ Error resuming suite:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to resume suite'
      });
    }
  }

  /**
   * Generate comprehensive suite report
   */
  async generateSuiteReport(session) {
    try {
      console.log(`📊 Generating suite report for session: ${session.sessionId}`);

      // Get child profile
      const childProfile = await ChildProfile.findById(session.childId);
      if (!childProfile) {
        throw new Error('Child profile not found');
      }

      // Prepare data for LLM analysis
      const suiteData = {
        sessionId: session.sessionId,
        suiteType: session.suiteType,
        childProfile: childProfile,
        gameResults: session.gameResults,
        behavioralProfile: session.behavioralProfile,
        summaryMetrics: session.summaryMetrics,
        totalDuration: session.totalDuration
      };

      // Generate report using LLM
      const report = await this.llmService.generateProgressiveSuiteReport(suiteData, childProfile);

      // Update session with report reference
      session.reportStatus = {
        generated: true,
        reportId: report._id,
        emailSent: false
      };

      await session.save();

      // Send email notification
      try {
        await EmailNotificationService.sendProgressiveSuiteReport(report, childProfile);
        session.reportStatus.emailSent = true;
        session.reportStatus.emailSentAt = new Date();
        await session.save();
      } catch (emailError) {
        console.error('❌ Error sending email notification:', emailError);
      }

      return report;

    } catch (error) {
      console.error('❌ Error generating suite report:', error);
      throw error;
    }
  }

  /**
   * Generate report for existing session
   */
  async generateReportForSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user._id;

      console.log('📊 Generating report for existing session:', sessionId);

      // Find and validate session
      const session = await SuiteSession.findOne({ sessionId, parentId: userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or access denied'
        });
      }

      // Check if report already exists
      if (session.reportStatus?.generated && session.reportStatus?.reportId) {
        const existingReport = await Report.findOne({ reportId: session.reportStatus.reportId });
        if (existingReport) {
          return res.json({
            success: true,
            message: 'Report already exists',
            report: {
              id: existingReport._id,
              reportId: existingReport.reportId,
              title: existingReport.content.title,
              summary: existingReport.content.summary
            }
          });
        }
      }

      // Generate basic report
      const childProfile = await ChildProfile.findById(session.childId);
      if (!childProfile) {
        return res.status(404).json({
          success: false,
          message: 'Child profile not found'
        });
      }

      // Calculate summary metrics
      const totalScore = session.gameResults.reduce((sum, game) => sum + (game.score || 0), 0);
      const totalAccuracy = session.gameResults.reduce((sum, game) => sum + (game.accuracy || 0), 0);
      const avgScore = totalScore / session.gameResults.length;
      const avgAccuracy = totalAccuracy / session.gameResults.length;

      // Create basic report
      const report = new Report({
        childId: session.childId,
        parentId: session.parentId,
        reportType: 'suite-progress-report',
        priority: 'medium',
        trigger: {
          type: 'suite-completion',
          assessmentType: session.suiteType,
          metadata: {
            sessionId: session.sessionId,
            totalGames: session.gameResults.length
          }
        },
        content: {
          title: `${session.suiteType.charAt(0).toUpperCase() + session.suiteType.slice(1)} Assessment Report`,
          summary: `Your child completed the ${session.suiteType} progressive suite with an average accuracy of ${avgAccuracy.toFixed(1)}% and average score of ${avgScore.toFixed(1)}.`,
          sections: [
            {
              heading: 'Performance Summary',
              content: `Completed ${session.gameResults.length} games with an overall accuracy of ${avgAccuracy.toFixed(1)}%.`,
              type: 'text'
            },
            {
              heading: 'Games Completed',
              content: session.gameResults.map(game => `${game.gameId}: ${game.accuracy}% accuracy`).join(', '),
              type: 'list'
            }
          ],
          insights: [
            `Average accuracy: ${avgAccuracy.toFixed(1)}%`,
            `Total games completed: ${session.gameResults.length}`,
            `Suite duration: ${session.totalDuration || 'Unknown'} minutes`
          ],
          recommendations: [
            'Continue with regular practice sessions',
            'Focus on areas with lower accuracy scores',
            'Consider scheduling follow-up assessments'
          ],
          performanceData: {
            gamePerformances: session.gameResults,
            averageAccuracy: avgAccuracy,
            averageScore: avgScore,
            totalGames: session.gameResults.length
          }
        },
        status: 'completed'
      });

      await report.save();
      console.log('✅ Report generated for existing session:', report.reportId);

      // Update session with report reference
      session.reportStatus = {
        generated: true,
        reportId: report.reportId,
        emailSent: false,
        emailSentAt: null
      };

      await session.save();

      res.json({
        success: true,
        message: 'Report generated successfully',
        report: {
          id: report._id,
          reportId: report.reportId,
          title: report.content.title,
          summary: report.content.summary
        }
      });

    } catch (error) {
      console.error('❌ Error generating report for session:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to generate report'
      });
    }
  }

  /**
   * Update suite report status
   */
  async updateReportStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const { reportStatus } = req.body;
      const userId = req.user._id;

      console.log('📊 Updating report status:', { sessionId, reportStatus });

      // Find and validate session
      const session = await SuiteSession.findOne({ sessionId, parentId: userId });
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'Session not found or access denied'
        });
      }

      // Update report status
      session.reportStatus = {
        ...session.reportStatus,
        ...reportStatus
      };

      await session.save();

      console.log('✅ Report status updated successfully');

      res.json({
        success: true,
        message: 'Report status updated successfully',
        session: session
      });

    } catch (error) {
      console.error('❌ Error updating report status:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update report status'
      });
    }
  }

  /**
   * Get suite configuration
   */
  getSuiteConfiguration(suiteType) {
    const configurations = {
      adhd: {
        totalGames: 7,
        estimatedDuration: 65,
        games: [
          { id: 'focus-finder', title: 'Focus Finder', difficulty: 'Easy', duration: 8, skills: ['Visual Processing', 'Sustained Attention'] },
          { id: 'impulse-freeze', title: 'Impulse Freeze', difficulty: 'Easy', duration: 8, skills: ['Self-Control', 'Response Inhibition'] },
          { id: 'memory-trail', title: 'Memory Trail', difficulty: 'Medium', duration: 10, skills: ['Working Memory', 'Pattern Recognition'] },
          { id: 'hyper-hop', title: 'Hyper Hop', difficulty: 'Medium', duration: 9, skills: ['Motor Control', 'Timing'] },
          { id: 'sound-shift', title: 'Sound Shift', difficulty: 'Medium', duration: 9, skills: ['Auditory Processing', 'Selective Attention'] },
          { id: 'time-turtle', title: 'Time Turtle', difficulty: 'Hard', duration: 10, skills: ['Time Management', 'Planning'] },
          { id: 'task-twister-enhanced', title: 'Task Twister', difficulty: 'Hard', duration: 11, skills: ['Task Switching', 'Executive Function'] }
        ]
      },
      dyslexia: {
        totalGames: 9,
        estimatedDuration: 85,
        games: [
          { id: 'letter-sound-matching', title: 'Letter Sound Matching', difficulty: 'Easy', duration: 8, skills: ['Phonemic Awareness', 'Letter Recognition'] },
          { id: 'rhyming-pairs', title: 'Rhyming Pairs', difficulty: 'Easy', duration: 8, skills: ['Phonological Awareness', 'Rhyme Recognition'] },
          { id: 'word-sequence-builder', title: 'Word Sequence Builder', difficulty: 'Medium', duration: 10, skills: ['Letter Sequencing', 'Visual Processing'] },
          { id: 'spot-correct-word', title: 'Spot Correct Word', difficulty: 'Medium', duration: 9, skills: ['Visual Discrimination', 'Letter Recognition'] },
          { id: 'memory-match', title: 'Memory Match', difficulty: 'Medium', duration: 10, skills: ['Working Memory', 'Phonological Processing'] },
          { id: 'rapid-letter-naming', title: 'Rapid Letter Naming', difficulty: 'Medium', duration: 9, skills: ['Rapid Naming', 'Processing Speed'] },
          { id: 'visual-tracking-maze', title: 'Visual Tracking Maze', difficulty: 'Hard', duration: 10, skills: ['Visual Tracking', 'Eye Movement'] },
          { id: 'word-completion', title: 'Word Completion', difficulty: 'Hard', duration: 10, skills: ['Word Recognition', 'Context Clues'] },
          { id: 'syllable-clapper', title: 'Syllable Clapper', difficulty: 'Hard', duration: 11, skills: ['Syllable Awareness', 'Rhythm Processing'] }
        ]
      }
    };

    return configurations[suiteType] || configurations.adhd;
  }
}

module.exports = new SuiteController(); 