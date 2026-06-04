const { OpenAI } = require('openai');
const Report = require('./report-model');
const ChildProfile = require('../childprofile/model');

class LLMReportService {
  constructor() {
    // Use Azure OpenAI configuration
    this.openai = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}`,
      defaultQuery: { "api-version": "2023-12-01-preview" },
      defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
    });
    this.model = process.env.AZURE_DEPLOYMENT_NAME;
  }

  /**
   * Generate a report using LLM based on trigger data
   */
  async generateReport(reportAction, childProfile, performanceData) {
    try {
      console.log(`🤖 Generating ${reportAction.type} for ${childProfile.firstName}`);

      // Check Azure OpenAI configuration
      if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_DEPLOYMENT_NAME) {
        console.warn('⚠️ Azure OpenAI not configured properly');
        throw new Error('Azure OpenAI configuration missing');
      }

      const prompt = this.buildPrompt(reportAction, childProfile, performanceData);
      const systemPrompt = this.getSystemPrompt(reportAction.type);

      const completion = await this.openai.chat.completions.create({
        model: this.model, // Use Azure deployment name
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      // Create and save report
      const report = await this.createReport(reportAction, childProfile, performanceData, response, completion);
      
      console.log(`✅ Report generated successfully: ${report.reportId}`);
      return report;

    } catch (error) {
      console.error('❌ Error generating LLM report:', error);
      if (error.message.includes('Azure OpenAI')) {
        console.error('💡 Azure OpenAI Configuration Help:');
        console.error('- AZURE_OPENAI_API_KEY: Set your Azure OpenAI API key');
        console.error('- AZURE_OPENAI_ENDPOINT: Set your Azure OpenAI endpoint');
        console.error('- AZURE_DEPLOYMENT_NAME: Set your Azure OpenAI deployment name');
      }
      throw error;
    }
  }

  /**
   * Get system prompt based on report type
   */
  getSystemPrompt(reportType) {
    const basePrompt = `You are a child development specialist and educational psychologist with expertise in ADHD, autism, and learning differences. You generate professional yet parent-friendly assessment reports.

Your reports should be:
- Supportive and encouraging while being honest about challenges
- Written for parents (not clinical professionals)
- Actionable with specific next steps
- Focused on the child's strengths alongside areas for growth
- Age-appropriate in language and expectations

Always respond with valid JSON in this format:`;

    const formats = {
      'mini-report': `
{
  "title": "Brief celebration title (e.g., 'Great Progress in Focus Games!')",
  "summary": "2-3 sentences celebrating the milestone and highlighting key improvements",
  "insights": ["2-3 specific observations about child's performance"],
  "recommendations": ["1-2 actionable next steps for parents"],
  "tone": "celebratory and encouraging"
}`,

      'suite-progress-report': `
{
  "title": "Progress report title (e.g., 'ADHD Assessment Suite: Progress Update')",
  "summary": "Comprehensive overview of suite performance and key findings",
  "sections": [
    {
      "heading": "Strengths Observed",
      "content": "Detailed description of child's strengths",
      "type": "text"
    },
    {
      "heading": "Areas for Growth",
      "content": "Growth areas with encouraging language",
      "type": "text"
    },
    {
      "heading": "Recommendations",
      "content": "Specific action items for parents",
      "type": "recommendations"
    }
  ],
  "insights": ["3-4 key insights from the assessment"],
  "recommendations": ["3-4 specific, actionable recommendations"]
}`,

      'comprehensive-assessment-report': `
{
  "title": "Comprehensive assessment title",
  "summary": "Executive summary of full assessment findings",
  "sections": [
    {
      "heading": "Assessment Overview",
      "content": "What was assessed and how",
      "type": "text"
    },
    {
      "heading": "Key Strengths",
      "content": "Child's cognitive and behavioral strengths",
      "type": "text"
    },
    {
      "heading": "Areas of Focus",
      "content": "Areas requiring attention or support",
      "type": "text"
    },
    {
      "heading": "Detailed Recommendations",
      "content": "Comprehensive action plan",
      "type": "recommendations"
    },
    {
      "heading": "Next Steps",
      "content": "Timeline and follow-up suggestions",
      "type": "text"
    }
  ],
  "insights": ["5-6 detailed insights from comprehensive analysis"],
  "recommendations": ["6-8 comprehensive recommendations organized by domain"]
}`,

      'progress-alert-report': `
{
  "title": "Celebration title for progress (e.g., 'Remarkable Improvement Detected!')",
  "summary": "Enthusiastic summary of the progress made",
  "insights": ["3-4 specific observations about the improvement"],
  "recommendations": ["2-3 ways to maintain and build on this progress"],
  "tone": "celebratory and motivating"
}`,

      'concern-alert-report': `
{
  "title": "Supportive title addressing concerns (e.g., 'Let's Explore Some New Strategies')",
  "summary": "Gentle, supportive summary of observed patterns that may need attention",
  "insights": ["2-3 observations about patterns, framed positively"],
  "recommendations": ["3-4 specific, actionable strategies to address concerns"],
  "tone": "supportive and solution-focused"
}`
    };

    return basePrompt + (formats[reportType] || formats['mini-report']);
  }

  /**
   * Build context-specific prompt for the LLM
   */
  buildPrompt(reportAction, childProfile, performanceData) {
    const baseContext = `
Child Information:
- Name: ${childProfile.firstName} ${childProfile.lastName}
- Age: ${childProfile.age} years old
- Assessment Type: ${reportAction.data?.assessmentType || 'Mixed Games'}

Report Context:
- Trigger: ${reportAction.trigger}
- Priority: ${reportAction.priority}
- Report Type: ${reportAction.type}
`;

    let specificContext = '';

    switch (reportAction.type) {
      case 'mini-report':
        specificContext = this.buildMiniReportContext(reportAction, performanceData);
        break;
      case 'suite-progress-report':
        specificContext = this.buildSuiteProgressContext(reportAction, performanceData);
        break;
      case 'comprehensive-assessment-report':
        specificContext = this.buildComprehensiveContext(reportAction, performanceData);
        break;
      case 'progress-alert-report':
        specificContext = this.buildProgressAlertContext(reportAction, performanceData);
        break;
      case 'concern-alert-report':
        specificContext = this.buildConcernAlertContext(reportAction, performanceData);
        break;
    }

    return baseContext + specificContext;
  }

  buildMiniReportContext(reportAction, performanceData) {
    return `
Milestone Achievement:
- Game: ${reportAction.gameId}
- Play Count: ${reportAction.data?.playCount || 'N/A'}
- Domain: ${reportAction.data?.area || 'Cognitive Skills'}

Recent Performance:
- Score: ${performanceData?.score || 'N/A'}
- Accuracy: ${performanceData?.accuracy ? (performanceData.accuracy * 100).toFixed(1) + '%' : 'N/A'}
- Improvement Trend: ${reportAction.data?.trendData?.direction || 'stable'}

Please generate an encouraging mini-report celebrating this milestone and providing brief guidance for continued progress.`;
  }

  buildSuiteProgressContext(reportAction, performanceData) {
    const data = reportAction.data || {};
    return `
Suite Completion Details:
- Assessment Type: ${data.suiteType || 'ADHD Assessment'}
- Completion Rate: ${data.completionRate ? (data.completionRate * 100).toFixed(1) + '%' : 'N/A'}
- Total Score: ${data.totalScore || 'N/A'}
- Duration: ${data.duration ? Math.round(data.duration / 60) + ' minutes' : 'N/A'}

Game Results Summary:
${data.gameResults ? data.gameResults.map(game => 
          `- ${game.gameId}: Score ${game.score || 0}, Accuracy ${game.accuracy !== undefined && game.accuracy !== null ? (game.accuracy > 1 ? game.accuracy.toFixed(1) : (game.accuracy * 100).toFixed(1)) + '%' : 'N/A'}`
).join('\n') : 'No detailed game results available'}

Please generate a comprehensive progress report analyzing the suite performance and providing guidance.`;
  }

  buildComprehensiveContext(reportAction, performanceData) {
    const data = reportAction.data || {};
    return `
Assessment Battery Completion:
- Assessment Type: ${data.assessmentType || 'Unknown'}
- Session ID: ${data.sessionId || 'N/A'}
- Overall Score: ${data.overallScore || 'N/A'}
- Total Time: ${data.totalTime ? Math.round(data.totalTime / 60) + ' minutes' : 'N/A'}

Performance Overview:
${data.gamePerformances ? 
  'Multiple games completed with detailed performance data available' : 
  'Limited performance data available'}

Please generate a comprehensive assessment report suitable for parents, including detailed analysis and actionable recommendations.`;
  }

  buildProgressAlertContext(reportAction, performanceData) {
    const data = reportAction.data || {};
    return `
Significant Progress Detected:
- Domain: ${data.area || 'Cognitive Skills'}
- Improvement Type: ${data.improvementType || 'general'}
- Improvement Percentage: ${data.improvementPercentage?.toFixed(1) || 'N/A'}%
- Game: ${reportAction.gameId || 'Various'}

Recent Performance:
- Current Score: ${performanceData?.score || 'N/A'}
- Current Accuracy: ${performanceData?.accuracy ? (performanceData.accuracy * 100).toFixed(1) + '%' : 'N/A'}

Please generate an enthusiastic progress alert celebrating this achievement and providing guidance to maintain momentum.`;
  }

  buildConcernAlertContext(reportAction, performanceData) {
    const data = reportAction.data || {};
    return `
Pattern Requiring Attention:
- Area of Concern: ${data.area || 'General Performance'}
- Specific Concerns: ${data.concerns ? data.concerns.map(c => c.description).join(', ') : 'Performance patterns'}
- Game Context: ${reportAction.gameId || 'Multiple games'}

Recommended Actions Identified:
${data.recommendedActions ? data.recommendedActions.join('\n- ') : 'Standard support strategies recommended'}

Please generate a supportive concern alert that addresses these patterns while maintaining an encouraging tone and providing specific, actionable strategies.`;
  }

  /**
   * Create and save report to database
   */
  async createReport(reportAction, childProfile, performanceData, llmResponse, completion) {
    // Process sections to handle arrays properly
    const processedSections = (llmResponse.sections || []).map(section => {
      // If content is an array, convert it to a string and store the array in data
      if (Array.isArray(section.content)) {
        return {
          ...section,
          content: section.content.join('\n'),
          data: section.content
        };
      }
      return section;
    });

    const report = new Report({
      childId: childProfile._id,
      parentId: childProfile.parent,
      reportType: reportAction.type,
      priority: reportAction.priority,
      
      trigger: {
        type: reportAction.trigger,
        gameId: reportAction.gameId,
        assessmentType: reportAction.data?.assessmentType,
        milestone: reportAction.data?.milestone,
        metadata: reportAction.data
      },

      content: {
        title: `${reportAction.data?.assessmentType?.charAt(0).toUpperCase() + reportAction.data?.assessmentType?.slice(1) || 'Assessment'} Assessment Report`,
        summary: llmResponse.summary || 'Report generated successfully',
        sections: processedSections,
        insights: llmResponse.insights || [],
        recommendations: llmResponse.recommendations || [],
        
        performanceData: {
          gamePerformances: performanceData,
          trends: reportAction.data?.trendData,
          benchmarks: reportAction.data?.benchmarks,
          improvements: reportAction.data?.improvementData,
          concerns: reportAction.data?.concerns
        },

        aiMetadata: {
          model: this.model, // Azure deployment name
          provider: 'azure-openai',
          promptVersion: '1.0',
          generationTime: new Date(),
          tokens: completion.usage?.total_tokens,
          confidence: 0.85 // Could be calculated based on response quality
        }
      },

      status: 'completed',
      tags: [
        reportAction.type,
        reportAction.gameId,
        reportAction.data?.assessmentType,
        `priority-${reportAction.priority}`
      ].filter(Boolean)
    });

    return await report.save();
  }

  /**
   * Generate weekly summary report
   */
  async generateWeeklySummary(childId) {
    // Implementation for scheduled weekly reports
    console.log(`📅 Generating weekly summary for child ${childId}`);
    // TODO: Implement weekly report logic
  }

  /**
   * Generate monthly summary report
   */
  async generateMonthlySummary(childId) {
    // Implementation for scheduled monthly reports
    console.log(`📅 Generating monthly summary for child ${childId}`);
    // TODO: Implement monthly report logic
  }

  /**
   * Generate quarterly summary report
   */
  async generateQuarterlySummary(childId) {
    // Implementation for scheduled quarterly reports
    console.log(`📅 Generating quarterly summary for child ${childId}`);
    // TODO: Implement quarterly report logic
  }

  /**
   * Generate comprehensive progressive suite report
   */
  async generateProgressiveSuiteReport(suiteData, childProfile) {
    try {
      console.log(`🤖 Generating progressive suite report for ${childProfile.firstName}`);

      const prompt = this.buildProgressiveSuitePrompt(suiteData, childProfile);
      const systemPrompt = this.getProgressiveSuiteSystemPrompt();

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      
      // Debug: Log the response structure to understand the content format
      console.log('🔍 LLM Response structure:', JSON.stringify(response, null, 2));
      
      // Calculate performance metrics
      const gameResults = suiteData.gameResults || [];
      const totalScore = gameResults.reduce((sum, game) => sum + (game.score || 0), 0);
      const averageScore = gameResults.length > 0 ? totalScore / gameResults.length : 0;
      const averageAccuracy = gameResults.length > 0 
        ? gameResults.reduce((sum, game) => sum + (game.accuracy || 0), 0) / gameResults.length 
        : 0;
      const completionRate = gameResults.length > 0 
        ? (gameResults.length / (suiteData.suiteConfig?.totalGames || gameResults.length)) * 100 
        : 100;

      // Enhance response with detailed performance data for charts
      const enhancedResponse = {
        ...response,
        performanceData: {
          gamePerformances: gameResults.map(game => ({
            gameId: game.gameId,
            gameName: game.gameName || game.gameId,
            score: game.score || 0,
            accuracy: game.accuracy || 0,
            duration: game.duration || 0,
            level: game.level || 1,
            performance: this.getPerformanceLevel(game.score || 0, game.accuracy || 0),
            behavioralMetrics: game.behavioralMetrics || {}
          })),
          averageAccuracy: averageAccuracy,
          averageScore: averageScore,
          totalGames: gameResults.length,
          totalScore: totalScore,
          completionRate: completionRate,
          skillBreakdown: this.calculateSkillBreakdown(gameResults, suiteData.suiteType),
          performanceTrend: this.calculatePerformanceTrend(gameResults),
          behavioralMetrics: suiteData.behavioralProfile || {}
        }
      };
      
      // Create and save report
      const report = await this.createProgressiveSuiteReport(suiteData, childProfile, enhancedResponse, completion);
      
      console.log(`✅ Progressive suite report generated successfully: ${report.reportId}`);
      return report;

    } catch (error) {
      console.error('❌ Error generating progressive suite report:', error);
      throw error;
    }
  }

  /**
   * Get performance level based on score and accuracy
   */
  getPerformanceLevel(score, accuracy) {
    const avgScore = (score + (accuracy * 100)) / 2;
    if (avgScore >= 80) return 'excellent';
    if (avgScore >= 60) return 'good';
    if (avgScore >= 40) return 'fair';
    return 'needs_improvement';
  }

  /**
   * Build prompt for progressive suite report
   */
  buildProgressiveSuitePrompt(suiteData, childProfile) {
    const gameResults = suiteData.gameResults || [];
    const behavioralProfile = suiteData.behavioralProfile || {};
    
    const gameAnalysis = gameResults.map((game, index) => {
      // Handle accuracy properly - if it's already a percentage (> 1), use as is, otherwise convert
      let accuracyDisplay = 'N/A';
      if (game.accuracy !== undefined && game.accuracy !== null) {
        if (game.accuracy > 1) {
          accuracyDisplay = game.accuracy.toFixed(1) + '%'; // Already a percentage
        } else {
          accuracyDisplay = (game.accuracy * 100).toFixed(1) + '%'; // Convert decimal to percentage
        }
      }
      
      return `
## Game ${index + 1}: ${game.gameId}
**Score:** ${game.score || 0} | **Accuracy:** ${accuracyDisplay} | **Duration:** ${game.duration ? Math.round(game.duration / 60) + ' minutes' : 'N/A'} | **Level:** ${game.level || 1}

**Behavioral Observations:** ${this.formatBehavioralObservations(game.behavioralMetrics)}

**Skills Assessed:** ${game.skills ? game.skills.join(', ') : 'Not specified'}

**Performance Analysis:** This game measures [specific skills] and your child's performance indicates [interpretation based on score and accuracy].
`;
    }).join('\n\n');

    return `
Child Information:
- Name: ${childProfile.firstName} ${childProfile.lastName}
- Age: ${childProfile.age} years old
- Suite Type: ${suiteData.suiteType} Assessment

Suite Performance Summary:
- Total Games: ${gameResults.length}
- Total Score: ${gameResults.reduce((sum, game) => sum + (game.score || 0), 0)}
- Average Score: ${gameResults.length > 0 ? (gameResults.reduce((sum, game) => sum + (game.score || 0), 0) / gameResults.length).toFixed(1) : 0}
- Total Duration: ${suiteData.totalDuration ? Math.round(suiteData.totalDuration / 60) + ' minutes' : 'N/A'}
- Completion Rate: ${gameResults.length > 0 ? ((gameResults.length / (suiteData.suiteConfig?.totalGames || gameResults.length)) * 100).toFixed(1) + '%' : '100%'}

Detailed Game Results:
${gameAnalysis}

Behavioral Profile:
- Attention Pattern: ${behavioralProfile.attentionPattern || 'Not specified'}
- Engagement Style: ${behavioralProfile.engagementStyle || 'Not specified'}
- Learning Preferences: ${behavioralProfile.learningPreferences?.join(', ') || 'Not specified'}
- Motivation Triggers: ${behavioralProfile.motivationTriggers?.join(', ') || 'Not specified'}

Generate a comprehensive behavioral analysis report that includes:
1. Executive summary with clear metrics and achievements
2. Detailed game-by-game analysis with scores, behavioral insights, and specific observations
3. Performance metrics with visual representation of data
4. Behavioral patterns and learning style analysis with specific examples
5. Identified strengths with specific examples and positive reinforcement
6. Areas for growth with encouraging language and improvement strategies
7. Specific, actionable recommendations for parents and educators
8. Follow-up plan with timeline and progress tracking methods

CRITICAL: The report title MUST be '[SUITE_TYPE] Assessment Report' where SUITE_TYPE matches the assessment type provided (${suiteData.suiteType}). For example, if the suite type is 'adhd', the title should be 'ADHD Assessment Report'.

IMPORTANT: Format all content as strings with markdown formatting for better readability. Include specific examples from the games and make the report visually appealing for parents.
`;
  }

  /**
   * Get system prompt for progressive suite reports
   */
  getProgressiveSuiteSystemPrompt() {
    return `You are a child development specialist and educational psychologist with expertise in ADHD, autism, and learning differences. You generate comprehensive behavioral analysis reports for progressive assessment suites.

Your reports should be:
- Comprehensive and detailed, covering all games in the suite
- Supportive and encouraging while being honest about challenges
- Written for parents (not clinical professionals)
- Actionable with specific next steps
- Focused on the child's strengths alongside areas for growth
- Age-appropriate in language and expectations
- Include behavioral patterns and learning style analysis
- Visually appealing with clear structure and formatting

IMPORTANT: All content fields must be strings, not arrays. Use markdown formatting for better readability. You MUST include ALL games from the provided game results in the Game-by-Game Analysis section. Do not skip any games.

CRITICAL REQUIREMENTS:
1. Every section must have substantial content - do not leave any section blank
2. Use the actual game data provided to generate specific insights
3. Include specific scores, accuracy rates, and behavioral observations
4. Generate meaningful recommendations based on the performance data
5. Create detailed game-by-game analysis for each game in the results

Always respond with valid JSON in this format:

{
  "title": "The title MUST be '[SUITE_TYPE] Assessment Report' where SUITE_TYPE is the actual assessment type (ADHD, Dyslexia, Autism, etc.) from the data provided. For example: 'ADHD Assessment Report' or 'Dyslexia Assessment Report'",
  "summary": "Executive summary of the entire suite performance with specific metrics",
  "sections": [
    {
      "heading": "Executive Summary",
      "content": "Comprehensive overview of suite performance and key findings with clear metrics and achievements. Include total score, average accuracy, completion rate, and overall assessment.",
      "type": "text"
    },
    {
      "heading": "Game-by-Game Analysis",
      "content": "Detailed analysis of each game with behavioral insights, scores, and specific observations. Format as: ## Game Name - Score: X, Accuracy: Y%\\n\\n**What this measures:** [explanation]\\n\\n**Your child's performance:** [detailed analysis]\\n\\n**Behavioral observations:** [specific behaviors noted]\\n\\n**What this tells us:** [interpretation]",
      "type": "text"
    },
    {
      "heading": "Performance Metrics",
      "content": "Visual representation of performance data with clear charts and comparisons. Include:\\n\\n**Overall Performance:**\\n- Total Score: [X]\\n- Average Score: [Y]\\n- Completion Rate: [Z]%\\n\\n**Skill Breakdown:**\\n- Attention: [analysis]\\n- Memory: [analysis]\\n- Executive Function: [analysis]\\n- Processing Speed: [analysis]",
      "type": "text"
    },
    {
      "heading": "Behavioral Patterns",
      "content": "Analysis of behavioral patterns observed during gameplay, including attention span, engagement level, frustration tolerance, and learning preferences.",
      "type": "text"
    },
    {
      "heading": "Strengths and Achievements",
      "content": "Detailed analysis of the child's strengths, achievements, and positive behavioral patterns observed during the assessment.",
      "type": "text"
    },
    {
      "heading": "Areas for Growth",
      "content": "Supportive analysis of areas where the child can improve, with specific, actionable strategies and encouragement.",
      "type": "text"
    },
    {
      "heading": "Recommendations",
      "content": "Specific, actionable recommendations for parents and educators based on the assessment results.",
      "type": "text"
    },
    {
      "heading": "Next Steps",
      "content": "Clear action plan with timeline and follow-up recommendations for continued progress tracking.",
      "type": "text"
    }
  ],
  "insights": ["Specific insight 1", "Specific insight 2", "Specific insight 3"],
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"]
}`;
  }

  /**
   * Calculate skill breakdown for radar chart
   */
  calculateSkillBreakdown(gameResults, suiteType) {
    const skillCategories = suiteType === 'adhd' 
      ? ['Attention', 'Focus', 'Memory', 'Impulse Control', 'Processing Speed', 'Executive Function']
      : ['Phonological Awareness', 'Visual Processing', 'Memory', 'Processing Speed', 'Reading Skills', 'Language Skills'];

    return skillCategories.map(skill => {
      const relevantGames = gameResults.filter(game => {
        const gameId = game.gameId.toLowerCase();
        if (skill === 'Attention' || skill === 'Focus') return gameId.includes('focus') || gameId.includes('attention');
        if (skill === 'Memory') return gameId.includes('memory') || gameId.includes('recall');
        if (skill === 'Impulse Control') return gameId.includes('impulse') || gameId.includes('freeze');
        if (skill === 'Processing Speed') return gameId.includes('rapid') || gameId.includes('speed');
        if (skill === 'Executive Function') return gameId.includes('task') || gameId.includes('executive');
        if (skill === 'Phonological Awareness') return gameId.includes('sound') || gameId.includes('rhyming') || gameId.includes('syllable');
        if (skill === 'Visual Processing') return gameId.includes('visual') || gameId.includes('spot') || gameId.includes('sequence');
        if (skill === 'Reading Skills') return gameId.includes('word') || gameId.includes('letter');
        if (skill === 'Language Skills') return gameId.includes('language') || gameId.includes('comprehension');
        return true;
      });
      
      if (relevantGames.length === 0) return { skill, score: 50, games: [] };
      
      const avgScore = relevantGames.reduce((sum, game) => {
        let score;
        if (game.accuracy !== undefined && game.accuracy !== null) {
          if (game.accuracy > 1) {
            score = game.accuracy; // Already a percentage
          } else {
            score = game.accuracy * 100; // Convert decimal to percentage
          }
        } else {
          score = game.score || 0;
        }
        return sum + score;
      }, 0) / relevantGames.length;
      
      return {
        skill,
        score: Math.min(100, Math.max(0, avgScore)),
        games: relevantGames.map(g => g.gameId)
      };
    });
  }

  /**
   * Calculate performance trend for line chart
   */
  calculatePerformanceTrend(gameResults) {
    return gameResults.map((game, index) => {
      let currentScore;
      if (game.accuracy !== undefined && game.accuracy !== null) {
        if (game.accuracy > 1) {
          currentScore = game.accuracy; // Already a percentage
        } else {
          currentScore = game.accuracy * 100; // Convert decimal to percentage
        }
      } else {
        currentScore = game.score || 0;
      }
      
      const previousScores = gameResults.slice(0, index).map(g => {
        if (g.accuracy !== undefined && g.accuracy !== null) {
          if (g.accuracy > 1) {
            return g.accuracy; // Already a percentage
          } else {
            return g.accuracy * 100; // Convert decimal to percentage
          }
        } else {
          return g.score || 0;
        }
      });
      const avgPrevious = previousScores.length > 0 ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length : 0;
      
      return {
        game: game.gameId,
        score: currentScore,
        cumulativeScore: avgPrevious + (currentScore - avgPrevious) * 0.3,
        trend: index > 0 ? (currentScore > avgPrevious ? 'improving' : 'declining') : 'baseline'
      };
    });
  }

  /**
   * Format behavioral observations for LLM
   */
  formatBehavioralObservations(behavioralMetrics) {
    if (!behavioralMetrics) return 'No behavioral data available';
    
    const observations = [];
    
    if (behavioralMetrics.responseTimes?.length > 0) {
      const avgResponseTime = behavioralMetrics.responseTimes.reduce((a, b) => a + b, 0) / behavioralMetrics.responseTimes.length;
      observations.push(`Average response time: ${avgResponseTime.toFixed(2)}s`);
    }
    
    if (behavioralMetrics.engagementData) {
      if (behavioralMetrics.engagementData.helpRequests > 0) {
        observations.push(`Help requests: ${behavioralMetrics.engagementData.helpRequests}`);
      }
      if (behavioralMetrics.engagementData.distractionEvents > 0) {
        observations.push(`Distraction events: ${behavioralMetrics.engagementData.distractionEvents}`);
      }
    }
    
    if (behavioralMetrics.errorAnalysis?.totalErrors > 0) {
      observations.push(`Total errors: ${behavioralMetrics.errorAnalysis.totalErrors}`);
    }
    
    return observations.length > 0 ? observations.join(', ') : 'No specific behavioral data';
  }

  /**
   * Create progressive suite report
   */
  async createProgressiveSuiteReport(suiteData, childProfile, llmResponse, completion) {
    const report = new Report({
      childId: childProfile._id,
      parentId: childProfile.parent,
      reportType: 'comprehensive-assessment-report',
      priority: 'high',
      
      trigger: {
        type: 'suite-completion',
        assessmentType: suiteData.suiteType,
        metadata: {
          sessionId: suiteData.sessionId,
          totalGames: suiteData.gameResults?.length || 0,
          totalScore: suiteData.gameResults?.reduce((sum, game) => sum + (game.score || 0), 0) || 0,
          totalDuration: suiteData.totalDuration
        }
      },

      content: {
        title: `${suiteData.suiteType.charAt(0).toUpperCase() + suiteData.suiteType.slice(1)} Assessment Report`,
        summary: llmResponse.summary || 'Comprehensive behavioral analysis report',
        sections: (llmResponse.sections || []).map(section => {
          // Ensure content is always a string
          let contentString = section.content;
          if (Array.isArray(contentString)) {
            contentString = contentString.join('\n\n');
          } else if (typeof contentString !== 'string') {
            contentString = JSON.stringify(contentString);
          }
          
          return {
            ...section,
            content: contentString
          };
        }),
        insights: llmResponse.insights || [],
        recommendations: llmResponse.recommendations || [],
        
        performanceData: {
          gamePerformances: suiteData.gameResults,
          behavioralProfile: suiteData.behavioralProfile,
          summaryMetrics: suiteData.summaryMetrics
        },

        aiMetadata: {
          model: this.model,
          provider: 'azure-openai',
          promptVersion: '2.0',
          generationTime: new Date(),
          tokens: completion.usage?.total_tokens,
          confidence: 0.9
        }
      },

      status: 'completed',
      tags: [
        'progressive-suite',
        suiteData.suiteType,
        'comprehensive-report',
        'high-priority'
      ]
    });

    return await report.save();
  }
}

module.exports = LLMReportService; 