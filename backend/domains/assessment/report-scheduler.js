const cron = require('node-cron');
const Report = require('./report-model');
const ChildProfile = require('../childprofile/model');
const User = require('../auth/model');
const Assessment = require('./model');
const EmailNotificationService = require('./email-notification-service');

class ReportScheduler {
  constructor() {
    this.jobs = [];
    this.isRunning = false;
  }

  /**
   * Initialize scheduled report jobs
   */
  initialize() {
    if (this.isRunning) {
      console.log('⏰ Report scheduler already running');
      return;
    }

    console.log('🚀 Initializing Report Scheduler...');

    // Weekly reports - Every Monday at 9 AM
    this.jobs.push(
      cron.schedule('0 9 * * 1', () => {
        this.generateWeeklyReports();
      }, {
        scheduled: false,
        timezone: 'America/New_York'
      })
    );

    // Monthly reports - 1st of every month at 10 AM
    this.jobs.push(
      cron.schedule('0 10 1 * *', () => {
        this.generateMonthlyReports();
      }, {
        scheduled: false,
        timezone: 'America/New_York'
      })
    );

    // Quarterly reports - 1st of Jan, Apr, Jul, Oct at 11 AM
    this.jobs.push(
      cron.schedule('0 11 1 1,4,7,10 *', () => {
        this.generateQuarterlyReports();
      }, {
        scheduled: false,
        timezone: 'America/New_York'
      })
    );

    // Email digest - Every Sunday at 8 PM
    this.jobs.push(
      cron.schedule('0 20 * * 0', () => {
        this.sendWeeklyDigests();
      }, {
        scheduled: false,
        timezone: 'America/New_York'
      })
    );

    // Process pending notifications - Every 30 minutes
    this.jobs.push(
      cron.schedule('*/30 * * * *', () => {
        EmailNotificationService.processPendingNotifications();
      }, {
        scheduled: false
      })
    );

    this.isRunning = true;
    console.log('✅ Report scheduler initialized with 5 jobs');
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (!this.isRunning) {
      this.initialize();
    }

    this.jobs.forEach(job => job.start());
    console.log('▶️ All scheduled jobs started');
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    this.jobs.forEach(job => job.stop());
    console.log('⏹️ All scheduled jobs stopped');
  }

  /**
   * Generate weekly reports for all active children
   */
  async generateWeeklyReports() {
    try {
      console.log('📅 Generating weekly reports...');
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Find all children with activity in the past week
      const recentAssessments = await Assessment.find({
        completedAt: { $gte: oneWeekAgo },
        status: 'completed'
      }).distinct('childId');

      console.log(`📊 Found ${recentAssessments.length} children with recent activity`);

      for (const childId of recentAssessments) {
        try {
          await this.generateWeeklyReportForChild(childId);
          
          // Add delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Error generating weekly report for child ${childId}:`, error);
        }
      }

      console.log('✅ Weekly report generation completed');
    } catch (error) {
      console.error('❌ Error in weekly report generation:', error);
    }
  }

  /**
   * Generate weekly report for a specific child
   */
  async generateWeeklyReportForChild(childId) {
    try {
      const child = await ChildProfile.findById(childId);
      if (!child) {
        console.log(`⚠️ Child ${childId} not found`);
        return;
      }

      const parent = await User.findById(child.parent);
      if (!parent) {
        console.log(`⚠️ Parent for child ${childId} not found`);
        return;
      }

      // Check if weekly report already exists for this week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const existingReport = await Report.findOne({
        childId: childId,
        reportType: 'weekly-summary',
        generatedAt: { $gte: weekStart }
      });

      if (existingReport) {
        console.log(`📋 Weekly report already exists for ${child.firstName}`);
        return;
      }

      // Get week's assessment data
      const weeklyData = await this.getWeeklyAssessmentData(childId);
      
      if (!weeklyData || weeklyData.totalSessions === 0) {
        console.log(`📋 No assessment data found for ${child.firstName} this week`);
        return;
      }

      // Generate report action
      const reportAction = {
        type: 'weekly-summary',
        priority: 'low',
        trigger: 'scheduled-weekly',
        gameId: null,
        data: {
          scheduledDate: new Date(),
          weeklyData: weeklyData,
          assessmentType: 'weekly-summary',
          area: 'Overall Progress',
          playCount: weeklyData.totalSessions,
          trendData: weeklyData.trends,
          improvementData: weeklyData.improvements
        }
      };

      // Generate report
      const LLMReportService = require('./llm-report-service');
      const llmService = new LLMReportService();
      const report = await llmService.generateReport(reportAction, child, weeklyData);
      
      console.log(`✅ Weekly report generated for ${child.firstName}: ${report.reportId}`);
      
      return report;
    } catch (error) {
      console.error(`❌ Error generating weekly report for child ${childId}:`, error);
      throw error;
    }
  }

  /**
   * Get weekly assessment data for a child
   */
  async getWeeklyAssessmentData(childId) {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const assessments = await Assessment.find({
        childId: childId,
        completedAt: { $gte: oneWeekAgo },
        status: 'completed'
      }).sort({ completedAt: -1 });

      if (assessments.length === 0) {
        return null;
      }

      // Calculate weekly metrics
      const totalSessions = assessments.length;
      const totalGames = assessments.reduce((sum, assessment) => 
        sum + (assessment.gamePerformances?.length || 0), 0);
      
      const averageScore = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.averageScore || 0), 0) / totalSessions;
      
      const averageAccuracy = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.averageAccuracy || 0), 0) / totalSessions;
      
      const totalDuration = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.totalDuration || 0), 0);

      // Calculate trends
      const trends = this.calculateWeeklyTrends(assessments);
      const improvements = this.calculateWeeklyImprovements(assessments);

      return {
        totalSessions,
        totalGames,
        averageScore: Math.round(averageScore),
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        totalDuration: Math.round(totalDuration),
        trends,
        improvements,
        assessmentTypes: [...new Set(assessments.map(a => a.assessmentType))],
        weekStart: oneWeekAgo.toISOString().split('T')[0],
        weekEnd: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error(`❌ Error getting weekly assessment data for child ${childId}:`, error);
      return null;
    }
  }

  /**
   * Calculate weekly trends
   */
  calculateWeeklyTrends(assessments) {
    if (assessments.length < 2) {
      return { direction: 'insufficient_data', change: 0 };
    }

    const recentHalf = assessments.slice(0, Math.ceil(assessments.length / 2));
    const olderHalf = assessments.slice(Math.ceil(assessments.length / 2));

    const recentAvg = recentHalf.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / recentHalf.length;
    const olderAvg = olderHalf.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / olderHalf.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    let direction = 'stable';
    if (change > 5) direction = 'improving';
    else if (change < -5) direction = 'declining';

    return {
      direction,
      change: Math.round(change * 100) / 100,
      recentAverage: Math.round(recentAvg),
      olderAverage: Math.round(olderAvg)
    };
  }

  /**
   * Calculate weekly improvements
   */
  calculateWeeklyImprovements(assessments) {
    const firstAssessment = assessments[assessments.length - 1];
    const lastAssessment = assessments[0];

    const scoreImprovement = (lastAssessment.summaryMetrics?.averageScore || 0) - 
                            (firstAssessment.summaryMetrics?.averageScore || 0);
    
    const accuracyImprovement = (lastAssessment.summaryMetrics?.averageAccuracy || 0) - 
                               (firstAssessment.summaryMetrics?.averageAccuracy || 0);

    return {
      scoreImprovement: Math.round(scoreImprovement),
      accuracyImprovement: Math.round(accuracyImprovement * 100) / 100,
      sessionCount: assessments.length,
      timespan: `${assessments.length} sessions this week`
    };
  }

  /**
   * Generate monthly reports for all active children
   */
  async generateMonthlyReports() {
    try {
      console.log('📅 Generating monthly reports...');
      
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      // Find all children with activity in the past month
      const recentAssessments = await Assessment.find({
        completedAt: { $gte: oneMonthAgo },
        status: 'completed'
      }).distinct('childId');

      console.log(`📊 Found ${recentAssessments.length} children with recent monthly activity`);

      for (const childId of recentAssessments) {
        try {
          await this.generateMonthlyReportForChild(childId);
          
          // Add delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (error) {
          console.error(`❌ Error generating monthly report for child ${childId}:`, error);
        }
      }

      console.log('✅ Monthly report generation completed');
    } catch (error) {
      console.error('❌ Error in monthly report generation:', error);
    }
  }

  /**
   * Generate monthly report for a specific child
   */
  async generateMonthlyReportForChild(childId) {
    try {
      const child = await ChildProfile.findById(childId);
      if (!child) return;

      // Check if monthly report already exists for this month
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const existingReport = await Report.findOne({
        childId: childId,
        reportType: 'monthly-summary',
        generatedAt: { $gte: monthStart }
      });

      if (existingReport) {
        console.log(`📋 Monthly report already exists for ${child.firstName}`);
        return;
      }

      // Get month's assessment data
      const monthlyData = await this.getMonthlyAssessmentData(childId);
      
      if (!monthlyData || monthlyData.totalSessions === 0) {
        console.log(`📋 No assessment data found for ${child.firstName} this month`);
        return;
      }

      // Generate report action
      const reportAction = {
        type: 'monthly-summary',
        priority: 'medium',
        trigger: 'scheduled-monthly',
        gameId: null,
        data: {
          scheduledDate: new Date(),
          monthlyData: monthlyData,
          assessmentType: 'monthly-summary',
          area: 'Overall Progress',
          playCount: monthlyData.totalSessions,
          trendData: monthlyData.trends,
          improvementData: monthlyData.improvements
        }
      };

      // Generate report
      const LLMReportService = require('./llm-report-service');
      const llmService = new LLMReportService();
      const report = await llmService.generateReport(reportAction, child, monthlyData);
      
      console.log(`✅ Monthly report generated for ${child.firstName}: ${report.reportId}`);
      
      return report;
    } catch (error) {
      console.error(`❌ Error generating monthly report for child ${childId}:`, error);
      throw error;
    }
  }

  /**
   * Get monthly assessment data for a child
   */
  async getMonthlyAssessmentData(childId) {
    try {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const assessments = await Assessment.find({
        childId: childId,
        completedAt: { $gte: oneMonthAgo },
        status: 'completed'
      }).sort({ completedAt: -1 });

      if (assessments.length === 0) {
        return null;
      }

      // Calculate monthly metrics (similar to weekly but with more comprehensive data)
      const totalSessions = assessments.length;
      const totalGames = assessments.reduce((sum, assessment) => 
        sum + (assessment.gamePerformances?.length || 0), 0);
      
      const averageScore = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.averageScore || 0), 0) / totalSessions;
      
      const averageAccuracy = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.averageAccuracy || 0), 0) / totalSessions;
      
      const totalDuration = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.totalDuration || 0), 0);

      // Calculate monthly trends and improvements
      const trends = this.calculateMonthlyTrends(assessments);
      const improvements = this.calculateMonthlyImprovements(assessments);
      const domainProgress = this.calculateDomainProgress(assessments);

      return {
        totalSessions,
        totalGames,
        averageScore: Math.round(averageScore),
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        totalDuration: Math.round(totalDuration),
        trends,
        improvements,
        domainProgress,
        assessmentTypes: [...new Set(assessments.map(a => a.assessmentType))],
        monthStart: oneMonthAgo.toISOString().split('T')[0],
        monthEnd: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error(`❌ Error getting monthly assessment data for child ${childId}:`, error);
      return null;
    }
  }

  /**
   * Calculate monthly trends
   */
  calculateMonthlyTrends(assessments) {
    // More sophisticated trend calculation for monthly data
    if (assessments.length < 4) {
      return { direction: 'insufficient_data', change: 0 };
    }

    const weeklyAverages = [];
    const weeksCount = Math.ceil(assessments.length / 4);
    
    for (let i = 0; i < weeksCount; i++) {
      const weekAssessments = assessments.slice(i * 4, (i + 1) * 4);
      const weekAvg = weekAssessments.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / weekAssessments.length;
      weeklyAverages.push(weekAvg);
    }

    const firstWeek = weeklyAverages[weeklyAverages.length - 1];
    const lastWeek = weeklyAverages[0];
    const change = ((lastWeek - firstWeek) / firstWeek) * 100;

    let direction = 'stable';
    if (change > 10) direction = 'improving';
    else if (change < -10) direction = 'declining';

    return {
      direction,
      change: Math.round(change * 100) / 100,
      weeklyAverages: weeklyAverages.map(avg => Math.round(avg)),
      consistency: this.calculateConsistency(weeklyAverages)
    };
  }

  /**
   * Calculate monthly improvements
   */
  calculateMonthlyImprovements(assessments) {
    const firstWeek = assessments.slice(-Math.ceil(assessments.length / 4));
    const lastWeek = assessments.slice(0, Math.ceil(assessments.length / 4));

    const firstWeekAvg = firstWeek.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / lastWeek.length;

    const scoreImprovement = lastWeekAvg - firstWeekAvg;
    
    const firstWeekAccuracy = firstWeek.reduce((sum, a) => sum + (a.summaryMetrics?.averageAccuracy || 0), 0) / firstWeek.length;
    const lastWeekAccuracy = lastWeek.reduce((sum, a) => sum + (a.summaryMetrics?.averageAccuracy || 0), 0) / lastWeek.length;
    
    const accuracyImprovement = lastWeekAccuracy - firstWeekAccuracy;

    return {
      scoreImprovement: Math.round(scoreImprovement),
      accuracyImprovement: Math.round(accuracyImprovement * 100) / 100,
      sessionCount: assessments.length,
      timespan: `${assessments.length} sessions this month`,
      weeklyGrowth: Math.round(scoreImprovement / Math.ceil(assessments.length / 4))
    };
  }

  /**
   * Calculate domain-specific progress
   */
  calculateDomainProgress(assessments) {
    const domains = {};
    
    assessments.forEach(assessment => {
      const domain = assessment.assessmentType || 'general';
      if (!domains[domain]) {
        domains[domain] = { sessions: 0, totalScore: 0, totalAccuracy: 0 };
      }
      
      domains[domain].sessions++;
      domains[domain].totalScore += assessment.summaryMetrics?.averageScore || 0;
      domains[domain].totalAccuracy += assessment.summaryMetrics?.averageAccuracy || 0;
    });

    const domainProgress = Object.entries(domains).map(([domain, data]) => ({
      domain,
      sessions: data.sessions,
      averageScore: Math.round(data.totalScore / data.sessions),
      averageAccuracy: Math.round((data.totalAccuracy / data.sessions) * 100) / 100
    }));

    return domainProgress;
  }

  /**
   * Calculate consistency metric
   */
  calculateConsistency(values) {
    if (values.length < 2) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize consistency score (0-1, where 1 is most consistent)
    const consistencyScore = 1 - Math.min(stdDev / mean, 1);
    return Math.round(consistencyScore * 100) / 100;
  }

  /**
   * Generate quarterly reports for all active children
   */
  async generateQuarterlyReports() {
    try {
      console.log('📅 Generating quarterly reports...');
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Find all children with activity in the past quarter
      const recentAssessments = await Assessment.find({
        completedAt: { $gte: threeMonthsAgo },
        status: 'completed'
      }).distinct('childId');

      console.log(`📊 Found ${recentAssessments.length} children with recent quarterly activity`);

      for (const childId of recentAssessments) {
        try {
          await this.generateQuarterlyReportForChild(childId);
          
          // Add delay to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(`❌ Error generating quarterly report for child ${childId}:`, error);
        }
      }

      console.log('✅ Quarterly report generation completed');
    } catch (error) {
      console.error('❌ Error in quarterly report generation:', error);
    }
  }

  /**
   * Generate quarterly report for a specific child
   */
  async generateQuarterlyReportForChild(childId) {
    try {
      const child = await ChildProfile.findById(childId);
      if (!child) return;

      // Check if quarterly report already exists for this quarter
      const quarterStart = new Date();
      quarterStart.setMonth(quarterStart.getMonth() - (quarterStart.getMonth() % 3));
      quarterStart.setDate(1);
      quarterStart.setHours(0, 0, 0, 0);

      const existingReport = await Report.findOne({
        childId: childId,
        reportType: 'quarterly-summary',
        generatedAt: { $gte: quarterStart }
      });

      if (existingReport) {
        console.log(`📋 Quarterly report already exists for ${child.firstName}`);
        return;
      }

      // Get quarter's assessment data
      const quarterlyData = await this.getQuarterlyAssessmentData(childId);
      
      if (!quarterlyData || quarterlyData.totalSessions === 0) {
        console.log(`📋 No assessment data found for ${child.firstName} this quarter`);
        return;
      }

      // Generate report action
      const reportAction = {
        type: 'quarterly-summary',
        priority: 'high',
        trigger: 'scheduled-quarterly',
        gameId: null,
        data: {
          scheduledDate: new Date(),
          quarterlyData: quarterlyData,
          assessmentType: 'quarterly-summary',
          area: 'Overall Progress',
          playCount: quarterlyData.totalSessions,
          trendData: quarterlyData.trends,
          improvementData: quarterlyData.improvements
        }
      };

      // Generate report
      const LLMReportService = require('./llm-report-service');
      const llmService = new LLMReportService();
      const report = await llmService.generateReport(reportAction, child, quarterlyData);
      
      console.log(`✅ Quarterly report generated for ${child.firstName}: ${report.reportId}`);
      
      return report;
    } catch (error) {
      console.error(`❌ Error generating quarterly report for child ${childId}:`, error);
      throw error;
    }
  }

  /**
   * Get quarterly assessment data for a child
   */
  async getQuarterlyAssessmentData(childId) {
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const assessments = await Assessment.find({
        childId: childId,
        completedAt: { $gte: threeMonthsAgo },
        status: 'completed'
      }).sort({ completedAt: -1 });

      if (assessments.length === 0) {
        return null;
      }

      // Calculate comprehensive quarterly metrics
      const totalSessions = assessments.length;
      const totalGames = assessments.reduce((sum, assessment) => 
        sum + (assessment.gamePerformances?.length || 0), 0);
      
      const averageScore = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.averageScore || 0), 0) / totalSessions;
      
      const averageAccuracy = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.averageAccuracy || 0), 0) / totalSessions;
      
      const totalDuration = assessments.reduce((sum, assessment) => 
        sum + (assessment.summaryMetrics?.totalDuration || 0), 0);

      // Calculate quarterly trends, improvements, and milestones
      const trends = this.calculateQuarterlyTrends(assessments);
      const improvements = this.calculateQuarterlyImprovements(assessments);
      const domainProgress = this.calculateDomainProgress(assessments);
      const milestones = this.calculateQuarterlyMilestones(assessments);

      return {
        totalSessions,
        totalGames,
        averageScore: Math.round(averageScore),
        averageAccuracy: Math.round(averageAccuracy * 100) / 100,
        totalDuration: Math.round(totalDuration),
        trends,
        improvements,
        domainProgress,
        milestones,
        assessmentTypes: [...new Set(assessments.map(a => a.assessmentType))],
        quarterStart: threeMonthsAgo.toISOString().split('T')[0],
        quarterEnd: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      console.error(`❌ Error getting quarterly assessment data for child ${childId}:`, error);
      return null;
    }
  }

  /**
   * Calculate quarterly trends
   */
  calculateQuarterlyTrends(assessments) {
    if (assessments.length < 6) {
      return { direction: 'insufficient_data', change: 0 };
    }

    // Calculate monthly averages for trend analysis
    const monthlyAverages = [];
    const monthsCount = 3;
    const assessmentsPerMonth = Math.ceil(assessments.length / monthsCount);
    
    for (let i = 0; i < monthsCount; i++) {
      const monthAssessments = assessments.slice(i * assessmentsPerMonth, (i + 1) * assessmentsPerMonth);
      if (monthAssessments.length > 0) {
        const monthAvg = monthAssessments.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / monthAssessments.length;
        monthlyAverages.push(monthAvg);
      }
    }

    const firstMonth = monthlyAverages[monthlyAverages.length - 1];
    const lastMonth = monthlyAverages[0];
    const change = ((lastMonth - firstMonth) / firstMonth) * 100;

    let direction = 'stable';
    if (change > 15) direction = 'improving';
    else if (change < -15) direction = 'declining';

    return {
      direction,
      change: Math.round(change * 100) / 100,
      monthlyAverages: monthlyAverages.map(avg => Math.round(avg)),
      consistency: this.calculateConsistency(monthlyAverages),
      overallGrowth: Math.round(lastMonth - firstMonth)
    };
  }

  /**
   * Calculate quarterly improvements
   */
  calculateQuarterlyImprovements(assessments) {
    const firstMonth = assessments.slice(-Math.ceil(assessments.length / 3));
    const lastMonth = assessments.slice(0, Math.ceil(assessments.length / 3));

    const firstMonthAvg = firstMonth.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / firstMonth.length;
    const lastMonthAvg = lastMonth.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / lastMonth.length;

    const scoreImprovement = lastMonthAvg - firstMonthAvg;
    
    const firstMonthAccuracy = firstMonth.reduce((sum, a) => sum + (a.summaryMetrics?.averageAccuracy || 0), 0) / firstMonth.length;
    const lastMonthAccuracy = lastMonth.reduce((sum, a) => sum + (a.summaryMetrics?.averageAccuracy || 0), 0) / lastMonth.length;
    
    const accuracyImprovement = lastMonthAccuracy - firstMonthAccuracy;

    return {
      scoreImprovement: Math.round(scoreImprovement),
      accuracyImprovement: Math.round(accuracyImprovement * 100) / 100,
      sessionCount: assessments.length,
      timespan: `${assessments.length} sessions this quarter`,
      monthlyGrowth: Math.round(scoreImprovement / 3),
      totalGrowthPercentage: Math.round((scoreImprovement / firstMonthAvg) * 100)
    };
  }

  /**
   * Calculate quarterly milestones
   */
  calculateQuarterlyMilestones(assessments) {
    const milestones = [];
    
    // Session count milestones
    if (assessments.length >= 50) milestones.push('Completed 50+ assessment sessions');
    else if (assessments.length >= 25) milestones.push('Completed 25+ assessment sessions');
    else if (assessments.length >= 10) milestones.push('Completed 10+ assessment sessions');
    
    // Score milestones
    const averageScore = assessments.reduce((sum, a) => sum + (a.summaryMetrics?.averageScore || 0), 0) / assessments.length;
    if (averageScore >= 90) milestones.push('Achieved excellent average score (90+)');
    else if (averageScore >= 80) milestones.push('Achieved good average score (80+)');
    else if (averageScore >= 70) milestones.push('Achieved satisfactory average score (70+)');
    
    // Consistency milestones
    const scores = assessments.map(a => a.summaryMetrics?.averageScore || 0);
    const consistency = this.calculateConsistency(scores);
    if (consistency >= 0.8) milestones.push('Demonstrated high consistency in performance');
    else if (consistency >= 0.6) milestones.push('Showed good consistency in performance');
    
    // Domain diversity milestones
    const domains = [...new Set(assessments.map(a => a.assessmentType))];
    if (domains.length >= 3) milestones.push('Engaged with multiple assessment domains');
    
    return milestones;
  }

  /**
   * Send weekly digest emails to all parents
   */
  async sendWeeklyDigests() {
    try {
      console.log('📧 Sending weekly digests...');
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Find all reports from the past week
      const weeklyReports = await Report.find({
        generatedAt: { $gte: oneWeekAgo },
        status: 'completed'
      }).populate('childId', 'firstName lastName age parent');

      // Group reports by parent
      const reportsByParent = {};
      weeklyReports.forEach(report => {
        const parentId = report.childId.parent.toString();
        if (!reportsByParent[parentId]) {
          reportsByParent[parentId] = [];
        }
        reportsByParent[parentId].push(report);
      });

      console.log(`📊 Sending weekly digests to ${Object.keys(reportsByParent).length} parents`);

      // Send digest to each parent
      for (const [parentId, reports] of Object.entries(reportsByParent)) {
        try {
          await EmailNotificationService.sendWeeklyDigest(parentId, reports);
          
          // Add delay between emails
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Error sending weekly digest to parent ${parentId}:`, error);
        }
      }

      console.log('✅ Weekly digest sending completed');
    } catch (error) {
      console.error('❌ Error in weekly digest sending:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.length,
      jobs: this.jobs.map(job => ({
        scheduled: job.scheduled,
        running: job.running
      }))
    };
  }

  /**
   * Manually trigger report generation for testing
   */
  async triggerManualReportGeneration(type = 'weekly', childId = null) {
    try {
      console.log(`🔧 Manually triggering ${type} report generation...`);
      
      switch (type) {
        case 'weekly':
          if (childId) {
            await this.generateWeeklyReportForChild(childId);
          } else {
            await this.generateWeeklyReports();
          }
          break;
        case 'monthly':
          if (childId) {
            await this.generateMonthlyReportForChild(childId);
          } else {
            await this.generateMonthlyReports();
          }
          break;
        case 'quarterly':
          if (childId) {
            await this.generateQuarterlyReportForChild(childId);
          } else {
            await this.generateQuarterlyReports();
          }
          break;
        case 'digest':
          await this.sendWeeklyDigests();
          break;
        default:
          throw new Error(`Unknown report type: ${type}`);
      }
      
      console.log(`✅ Manual ${type} report generation completed`);
    } catch (error) {
      console.error(`❌ Error in manual ${type} report generation:`, error);
      throw error;
    }
  }
}

module.exports = new ReportScheduler(); 