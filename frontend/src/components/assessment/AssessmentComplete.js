import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from '../reports/ReportPDF';
import AssessmentService from '../../services/AssessmentService';
import { toast } from 'react-hot-toast';
import ResourceRecommendations from './ResourceRecommendations';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import LogoLoader, { SimpleSpinner } from '../ui/LogoLoader';

// Clean text content and parse markdown into structured format
const parseMarkdownSummary = text => {
  if (!text || typeof text !== 'string') return null;

  console.log('📝 Parsing summary text (first 500 chars):', text.substring(0, 500));

  // First try to parse as proper markdown
  let sections = parseProperMarkdown(text);

  // If that fails, try to convert plain text to markdown structure
  if (!sections || Object.keys(sections).length === 0) {
    console.log('📝 Attempting to convert plain text to markdown structure');
    sections = convertPlainTextToMarkdown(text);
  }

  console.log('📝 Parsed sections:', Object.keys(sections));
  if (sections) {
    Object.entries(sections).forEach(([key, content]) => {
      console.log(`📝 Section ${key} length:`, content ? content.length : 0);
    });
  }

  return sections;
};

// Parse proper markdown with ## headers
const parseProperMarkdown = text => {
  const sections = {};
  const lines = text.split('\n');
  let currentSection = null;
  let currentContent = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Check for main headers (# Assessment Summary Report for... or # Comprehensive Developmental Screening Report for...)
    if (
      line.startsWith('#') &&
      (line.includes('Assessment Summary Report') ||
        line.includes('Comprehensive Developmental Screening Report'))
    ) {
      sections.title = line.replace(/#+\s*/, '');
      continue;
    }

    // Check for section headers (## Section Name)
    if (line.startsWith('##')) {
      // Save previous section
      if (currentSection && currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }

      // Start new section - normalize various section header formats
      const sectionName = line
        .replace(/#+\s*/, '')
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');

      // Map comprehensive assessment section names to standard format
      const sectionMappings = {
        assessment_overview: 'overview_of_strengths_and_challenges',
        cross_disorder_risk_analysis: 'overview_of_strengths_and_challenges',
        primary_area_of_concern: 'overview_of_strengths_and_challenges',
        strengths_and_positive_indicators: 'strengths',
        areas_requiring_attention: 'challenges',
        specific_recommendations: 'recommendations',
        follow_up_schedule: 'next_steps',
        professional_consultation_timeline: 'next_steps',
        next_steps: 'next_steps',
        recommendations: 'recommendations',
        strengths: 'strengths',
        challenges: 'challenges',
        areas_for_growth: 'challenges',
        overview_of_strengths_and_challenges: 'overview_of_strengths_and_challenges',
      };

      currentSection = sectionMappings[sectionName] || sectionName;
      currentContent = [];
      continue;
    }

    // Add content to current section
    if (currentSection) {
      currentContent.push(line);
    }
  }

  // Save last section
  if (currentSection && currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }

  return sections;
};

// Convert plain text summary to markdown structure
const convertPlainTextToMarkdown = text => {
  if (!text) return null;

  const sections = {};

  console.log('📝 Original text length:', text.length);

  // Extract title
  const titleMatch = text.match(
    /(Assessment Summary Report|Comprehensive Developmental Screening Report)\s+for\s+([^.•]+)/i
  );
  if (titleMatch) {
    sections.title = titleMatch[0];
  }

  // Simple approach: find all bullet points and categorize them by content
  const allBulletPoints = text.split('•').filter(point => point.trim().length > 10);

  console.log('📝 Found bullet points:', allBulletPoints.length);

  const categorizedPoints = {
    overview_of_strengths_and_challenges: [],
    strengths: [],
    challenges: [],
    recommendations: [],
    next_steps: [],
  };

  // Categorize bullet points
  allBulletPoints.forEach((point, index) => {
    const cleanPoint = cleanTextContent(point.trim()); // Clean markdown formatting from the point
    const lowerPoint = cleanPoint.toLowerCase();

    // Skip very short points or section headers
    if (
      cleanPoint.length < 15 ||
      lowerPoint.match(/^(strengths|challenges|recommendations|next steps)/)
    ) {
      return;
    }

    let categorized = false;

    // More specific categorization - check exact phrases first
    if (
      lowerPoint.includes('social skills training') ||
      lowerPoint.includes('visual supports') ||
      lowerPoint.includes('emotional coaching') ||
      lowerPoint.includes('recommend') ||
      lowerPoint.includes('implement') ||
      lowerPoint.includes('consider')
    ) {
      categorizedPoints.recommendations.push(cleanPoint);
      categorized = true;
    } else if (
      lowerPoint.includes('collaborate') ||
      lowerPoint.includes('monitor') ||
      lowerPoint.includes('evaluate') ||
      lowerPoint.includes('share') ||
      lowerPoint.includes('check') ||
      lowerPoint.includes('follow')
    ) {
      categorizedPoints.next_steps.push(cleanPoint);
      categorized = true;
    } else if (
      lowerPoint.includes('difficulty') ||
      lowerPoint.includes('struggle') ||
      lowerPoint.includes('challenge') ||
      lowerPoint.includes('hard') ||
      lowerPoint.includes('trouble') ||
      lowerPoint.includes('upset') ||
      lowerPoint.includes('sensitivity') ||
      lowerPoint.includes('barriers')
    ) {
      categorizedPoints.challenges.push(cleanPoint);
      categorized = true;
    } else if (
      lowerPoint.includes('emotional awareness') ||
      lowerPoint.includes('desire') ||
      lowerPoint.includes('potential') ||
      lowerPoint.includes('shows') ||
      lowerPoint.includes('demonstrates') ||
      lowerPoint.includes('engaged') ||
      lowerPoint.includes('willing') ||
      lowerPoint.includes('positive') ||
      lowerPoint.includes('strong')
    ) {
      categorizedPoints.strengths.push(cleanPoint);
      categorized = true;
    }

    // If still not categorized, use position-based fallback
    if (!categorized) {
      const totalPoints = allBulletPoints.length;
      if (index < Math.ceil(totalPoints * 0.25)) {
        categorizedPoints.strengths.push(cleanPoint);
      } else if (index < Math.ceil(totalPoints * 0.5)) {
        categorizedPoints.challenges.push(cleanPoint);
      } else if (index < Math.ceil(totalPoints * 0.75)) {
        categorizedPoints.recommendations.push(cleanPoint);
      } else {
        categorizedPoints.next_steps.push(cleanPoint);
      }
    }
  });

  // Extract overview (content before first bullet point)
  const overviewMatch = text.match(/^(.*?)(?=•|$)/s);
  if (overviewMatch && overviewMatch[1]) {
    const overview = overviewMatch[1]
      .replace(
        /(Assessment Summary Report|Comprehensive Developmental Screening Report)\s+for\s+[^.]*\./i,
        ''
      )
      .replace(/Overview of Strengths and Challenges/i, '')
      .replace(/Assessment Overview/i, '')
      .trim();

    if (overview.length > 30) {
      sections.overview_of_strengths_and_challenges = cleanTextContent(overview);
    }
  }

  // Convert categorized points to markdown format
  Object.entries(categorizedPoints).forEach(([key, points]) => {
    if (points.length > 0) {
      sections[key] = points.map(point => `- ${point}`).join('\n');
    }
  });

  console.log('📝 Categorized sections:');
  Object.entries(categorizedPoints).forEach(([key, points]) => {
    console.log(`📝 ${key}: ${points.length} points`);
    points.forEach((point, i) => {
      console.log(`📝   ${i + 1}. ${point.substring(0, 60)}...`);
    });
  });

  return Object.keys(sections).length > 0 ? sections : null;
};

// Clean text content and remove all markdown artifacts
const cleanTextContent = text => {
  if (!text || typeof text !== 'string') return '';

  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown (**text**)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1') // Remove italic markdown (*text*) but not part of bold
    .replace(/#{1,6}\s*/g, '') // Remove header symbols
    .replace(/^\s*[-*+]\s+/gm, '• ') // Convert bullet points
    .replace(/^\d+\.\s+/gm, '') // Remove numbered list formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links [text](url)
    .replace(/`([^`]+)`/g, '$1') // Remove inline code blocks
    .replace(/_{2,}(.*?)_{2,}/g, '$1') // Remove underline markdown
    .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough markdown
    .replace(/\n{3,}/g, '\n\n') // Clean up multiple line breaks
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Format child names properly
const formatChildName = childName => {
  if (!childName || childName.trim() === '') return 'Child';

  // Clean the name but preserve actual names
  const cleaned = childName
    .toString()
    .trim()
    .replace(/\s*N\/A\s*/gi, '')
    .replace(/\s*undefined\s*/gi, '')
    .replace(/\s*null\s*/gi, '')
    .trim();

  // Only return 'Child' if we have no valid name left
  return cleaned && cleaned.length > 0 ? cleaned : 'Child';
};

// Extract child age from various sources
const extractChildAge = (assessmentData, results) => {
  return (
    results?.childAge ||
    assessmentData?.childData?.age ||
    results?.age ||
    assessmentData?.childAge ||
    (assessmentData?.childId?.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(assessmentData.childId.dateOfBirth)) /
            (365.25 * 24 * 60 * 60 * 1000)
        )
      : null)
  );
};

// Risk Level Card Component
const RiskLevelCard = ({ riskScore, riskInterpretation, assessmentType }) => {
  const getRiskLevel = score => {
    if (score <= 3)
      return {
        level: 'Low Risk',
        color: 'green',
        icon: '🟢',
        bgColor: 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20',
      };
    if (score <= 7)
      return {
        level: 'Moderate Risk',
        color: 'yellow',
        icon: '🟡',
        bgColor: 'from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20',
      };
    return {
      level: 'High Risk',
      color: 'red',
      icon: '🔴',
      bgColor: 'from-red-50 to-rose-100 dark:from-red-900/20 dark:to-rose-900/20',
    };
  };

  const riskData = getRiskLevel(riskScore);

  return (
    <div
      className={`bg-gradient-to-br ${riskData.bgColor} rounded-2xl p-6 border border-white/20 dark:border-gray-700/20`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-3xl mr-3">{riskData.icon}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{riskData.level}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Overall Risk Assessment</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {riskScore.toFixed(1)}/10
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Risk Score</div>
        </div>
      </div>

      {/* Risk Score Visualization */}
      <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-3 mb-4 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(riskScore / 10) * 100}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          className={`h-full ${
            riskScore <= 3
              ? 'bg-gradient-to-r from-green-400 to-green-600'
              : riskScore <= 7
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                : 'bg-gradient-to-r from-red-400 to-red-600'
          }`}
        />
      </div>

      <div className="text-sm text-gray-700 dark:text-gray-300">
        {cleanTextContent(riskInterpretation)}
      </div>
    </div>
  );
};

// Domain Scores Chart Component
const DomainScoresChart = ({ domainScores }) => {
  if (!domainScores || domainScores.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <svg
          className="w-6 h-6 mr-2 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Cognitive Domain Analysis
      </h3>

      <div className="h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={domainScores} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" />
            <XAxis dataKey="domain" stroke="rgba(150,150,150,0.7)" />
            <YAxis domain={[0, 10]} stroke="rgba(150,150,150,0.7)" />
            <Tooltip
              contentStyle={{
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar
              dataKey="score"
              name="Domain Score"
              fill="#3B82F6"
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {domainScores.map((domain, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="bg-gray-50/50 dark:bg-gray-700/50 rounded-xl p-4 border border-white/10 dark:border-gray-600/20"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {domain.domain}
              </h4>
              <span className="text-sm font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full">
                {domain.score}/10
              </span>
            </div>
            <div className="w-full bg-gray-200/50 dark:bg-gray-600/50 rounded-full h-2 mb-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(domain.score / 10) * 100}%` }}
                transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                className={`h-2 rounded-full ${
                  domain.score <= 3
                    ? 'bg-green-500'
                    : domain.score <= 7
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {cleanTextContent(domain.description)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Disorder Probability Chart Component
const DisorderProbabilityChart = ({ riskScore, assessmentType }) => {
  const getDisorderProbabilities = (score, type) => {
    const baseRisk = score / 10;

    switch (type.toLowerCase()) {
      case 'adhd':
        return [
          { disorder: 'ADHD', probability: baseRisk * 85, color: '#EF4444' },
          { disorder: 'Learning Difficulties', probability: baseRisk * 45, color: '#F59E0B' },
          { disorder: 'Anxiety', probability: baseRisk * 35, color: '#10B981' },
          { disorder: 'Executive Function Issues', probability: baseRisk * 65, color: '#6366F1' },
        ];
      case 'autism':
        return [
          { disorder: 'Autism Spectrum', probability: baseRisk * 80, color: '#8B5CF6' },
          { disorder: 'Social Communication', probability: baseRisk * 70, color: '#06B6D4' },
          { disorder: 'Sensory Processing', probability: baseRisk * 55, color: '#84CC16' },
          { disorder: 'Repetitive Behaviors', probability: baseRisk * 60, color: '#F59E0B' },
        ];
      case 'dyslexia':
        return [
          { disorder: 'Dyslexia', probability: baseRisk * 75, color: '#EC4899' },
          { disorder: 'Reading Difficulties', probability: baseRisk * 85, color: '#EF4444' },
          { disorder: 'Language Processing', probability: baseRisk * 50, color: '#10B981' },
          { disorder: 'Working Memory', probability: baseRisk * 40, color: '#6366F1' },
        ];
      default:
        return [
          { disorder: 'Attention Issues', probability: baseRisk * 60, color: '#EF4444' },
          { disorder: 'Learning Challenges', probability: baseRisk * 45, color: '#F59E0B' },
          { disorder: 'Social Difficulties', probability: baseRisk * 35, color: '#10B981' },
          { disorder: 'Behavioral Concerns', probability: baseRisk * 50, color: '#6366F1' },
        ];
    }
  };

  const probabilities = getDisorderProbabilities(riskScore, assessmentType);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <svg
          className="w-6 h-6 mr-2 text-purple-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Potential Concern Areas
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={probabilities}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="probability"
                animationDuration={1000}
              >
                {probabilities.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={value => [`${value.toFixed(1)}%`, 'Probability']}
                contentStyle={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {probabilities.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.disorder}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.probability}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className="h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[3rem] text-right">
                  {item.probability.toFixed(1)}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Format bullet points from text
const formatBulletPoints = text => {
  if (!text) return [];

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')))
    .map(line => {
      // Clean the line and remove markdown formatting
      let cleaned = line.replace(/^[-•*]\s*/, '').trim();
      cleaned = cleanTextContent(cleaned); // Apply markdown cleanup
      return cleaned;
    })
    .filter(line => line.length > 0);
};

// Follow-up Card Component
const FollowUpCard = ({ followUpSchedule }) => {
  if (!followUpSchedule) return null;

  // Debug logging
  console.log('📅 FollowUpCard received:', followUpSchedule);
  console.log('📅 Urgency value:', followUpSchedule.urgency, typeof followUpSchedule.urgency);

  const getUrgencyColor = urgency => {
    const urgencyValue = urgency?.toString()?.toLowerCase();
    switch (urgencyValue) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'moderate':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <svg
          className="w-6 h-6 mr-2 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Follow-up Schedule
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Recommended Date
            </h4>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(followUpSchedule.recommendedDate)}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Timeframe</h4>
            <p className="text-gray-700 dark:text-gray-300">{followUpSchedule.timeframe}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Priority Level
            </h4>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(followUpSchedule.urgency)}`}
            >
              {(() => {
                const urgency = followUpSchedule.urgency;
                if (
                  !urgency ||
                  urgency === 'undefined' ||
                  urgency === 'null' ||
                  typeof urgency === 'number'
                ) {
                  return 'Standard';
                }
                const urgencyStr = urgency.toString();
                return urgencyStr.charAt(0).toUpperCase() + urgencyStr.slice(1);
              })()}{' '}
              Priority
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Focus Area</h4>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {cleanTextContent(followUpSchedule.focus)}
          </p>
        </div>
      </div>
    </div>
  );
};

// Summary Section Component with Enhanced Markdown Parsing
const SummarySection = ({ summary, assessmentType, childName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!summary) return null;

  const parsedSummary = parseMarkdownSummary(summary);

  if (!parsedSummary) {
    // Fallback to simple text display
    const cleanSummary = cleanTextContent(summary);
    const shortSummary =
      cleanSummary.length > 300 ? cleanSummary.substring(0, 300) + '...' : cleanSummary;

    return (
      <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg
            className="w-6 h-6 mr-2 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Assessment Summary
        </h3>
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {isExpanded ? cleanSummary : shortSummary}
          </p>
          {cleanSummary.length > 300 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium text-sm transition-colors"
            >
              {isExpanded ? 'Show Less' : 'Read More'}
            </button>
          )}
        </div>
      </div>
    );
  }

  const getSectionIcon = sectionName => {
    switch (sectionName) {
      case 'overview_of_strengths_and_challenges':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case 'strengths':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'challenges':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'recommendations':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        );
      case 'next_steps':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
    }
  };

  const getSectionTitle = sectionName => {
    const titles = {
      overview_of_strengths_and_challenges: 'Assessment Overview',
      strengths: 'Strengths & Positive Indicators',
      challenges: 'Areas Requiring Attention',
      recommendations: 'Recommendations',
      next_steps: 'Next Steps & Follow-Up',
    };
    return (
      titles[sectionName] || sectionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
  };

  const getSectionColor = sectionName => {
    const colors = {
      overview_of_strengths_and_challenges: 'text-blue-600 dark:text-blue-400',
      strengths: 'text-green-600 dark:text-green-400',
      challenges: 'text-amber-600 dark:text-amber-400',
      recommendations: 'text-purple-600 dark:text-purple-400',
      next_steps: 'text-indigo-600 dark:text-indigo-400',
    };
    return colors[sectionName] || 'text-gray-600 dark:text-gray-400';
  };

  const mainSections = [
    'overview_of_strengths_and_challenges',
    'strengths',
    'challenges',
    'recommendations',
    'next_steps',
  ];
  const availableSections = mainSections.filter(section => parsedSummary[section]);

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <svg
            className="w-7 h-7 mr-3 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Assessment Summary Report
        </h3>
        {parsedSummary.title && (
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium ml-10">
            {parsedSummary.title.replace(/Assessment Summary Report for\s*/i, '')}
          </p>
        )}
      </div>

      <div className="space-y-6">
        {availableSections.map((sectionKey, index) => {
          const content = parsedSummary[sectionKey];
          const bullets = formatBulletPoints(content);
          const cleanContent = cleanTextContent(content);
          const hasTextContent = cleanContent && cleanContent.trim().length > 0;

          if (!hasTextContent && bullets.length === 0) return null;

          return (
            <motion.div
              key={sectionKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="bg-gray-50/80 dark:bg-gray-700/80 rounded-xl p-5 border border-white/10 dark:border-gray-600/20"
            >
              <h4
                className={`text-lg font-semibold mb-3 flex items-center ${getSectionColor(sectionKey)}`}
              >
                {getSectionIcon(sectionKey)}
                <span className="ml-2">{getSectionTitle(sectionKey)}</span>
              </h4>

              {bullets.length > 0 ? (
                <ul className="space-y-2">
                  {bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0 ${
                          sectionKey === 'strengths'
                            ? 'bg-green-500'
                            : sectionKey === 'challenges'
                              ? 'bg-amber-500'
                              : sectionKey === 'recommendations'
                                ? 'bg-purple-500'
                                : 'bg-blue-500'
                        }`}
                      ></span>
                      <span className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {bullet}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{cleanContent}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {!isExpanded && availableSections.length > 2 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsExpanded(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/40 rounded-lg transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            Show All Sections
          </button>
        </div>
      )}
    </div>
  );
};

const AssessmentComplete = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: pathSessionId } = useParams();
  const [assessmentData, setAssessmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);
  const { user } = useAuth();

  // Get sessionId from either path params or query params
  const queryParams = new URLSearchParams(location.search);
  const querySessionId = queryParams.get('sessionId');
  const sessionId = pathSessionId || querySessionId;

  const [results, setResults] = useState(location.state?.results || null);

  useEffect(() => {
    if (location.state?.results && location.state?.assessmentComplete) {
      setResults(location.state.results);
      setLoading(false);
    } else if (!results && sessionId) {
      fetchResults();
    } else if (!sessionId) {
      setError('Session ID is missing. Cannot load assessment results.');
      setLoading(false);
    }
  }, [sessionId, location.state]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const assessmentData = await AssessmentService.getAssessment(sessionId);
      setAssessmentData(assessmentData);

      if (assessmentData.results) {
        setResults(assessmentData.results);
      } else if (assessmentData.status === 'completed') {
        try {
          const reportData = await AssessmentService.getReport(sessionId);
          setResults(reportData.results);
          setAssessmentData(prev => ({
            ...prev,
            results: reportData.results,
            childData: {
              name: formatChildName(reportData.childName),
              age: reportData.childAge,
              gender: reportData.childGender,
            },
          }));
        } catch (reportError) {
          setError('Assessment completed but results are not available. Please contact support.');
        }
      } else {
        setError(
          `Assessment is not complete (status: ${assessmentData.status}). Results are not available yet.`
        );
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Assessment not found. The session may have expired.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view this assessment.');
      } else {
        setError('An error occurred while loading your results. Please try again.');
      }
      toast.error('Error loading assessment results');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    // Client-side PDF generation is handled by PDFDownloadLink
    // This function is kept for compatibility but the actual download is handled by the button
  };

  const handleDashboard = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <LogoLoader size="large" message="Generating your assessment results..." />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl p-8 max-w-lg mx-auto text-center shadow-xl border border-white/20 dark:border-gray-700/20">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
            Error Loading Results
          </h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {error || 'Unable to load assessment results'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
            <button
              onClick={handleDashboard}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Extract clean data - try multiple sources for child name
  const childNameFromMultipleSources =
    results?.childName ||
    assessmentData?.childData?.name ||
    assessmentData?.intakeId?.childName ||
    assessmentData?.results?.childName ||
    location.state?.results?.childName ||
    location.state?.childName ||
    'Child';

  const childName = formatChildName(childNameFromMultipleSources);

  const childAge = extractChildAge(assessmentData, results);
  const assessmentType = results?.assessmentType || assessmentData?.assessmentType || 'general';
  const riskScore = results.disorderRisk?.score || results?.overallScore || results?.riskScore || 5;
  const riskInterpretation =
    results.disorderRisk?.interpretation || 'Assessment completed successfully.';
  const completedDate = new Date(assessmentData?.completedAt || Date.now()).toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Helmet>
        <title>Assessment Results - {childName} - CogniKidz</title>
        <meta name="description" content={`Assessment results for ${childName}`} />
      </Helmet>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center mb-6 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-full px-6 py-3">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-3">
                ✓
              </span>
              <span className="text-green-700 dark:text-green-300 font-semibold">
                Assessment Complete
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Assessment Report
            </h1>

            <div className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 inline-block border border-white/20 dark:border-gray-700/20 backdrop-blur-sm">
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                <span className="font-semibold text-blue-600 dark:text-blue-400">{childName}</span>
                {childAge && (
                  <span className="text-gray-500 dark:text-gray-400"> • {childAge} years old</span>
                )}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {assessmentType.toUpperCase()} Assessment • Completed on {completedDate}
              </p>
            </div>
          </motion.div>

          {/* Main Report Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-8"
            ref={reportRef}
          >
            {/* Risk Level Overview */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <RiskLevelCard
                riskScore={riskScore}
                riskInterpretation={riskInterpretation}
                assessmentType={assessmentType}
              />
            </motion.div>

            {/* Disorder Probability Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <DisorderProbabilityChart riskScore={riskScore} assessmentType={assessmentType} />
            </motion.div>

            {/* Domain Scores */}
            {results.domainScores && results.domainScores.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <DomainScoresChart domainScores={results.domainScores} />
              </motion.div>
            )}

            {/* Summary Section */}
            {results.summary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <SummarySection
                  summary={results.summary}
                  assessmentType={assessmentType}
                  childName={childName}
                />
              </motion.div>
            )}

            {/* Follow-up Schedule */}
            {results.followUpSchedule && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <FollowUpCard followUpSchedule={results.followUpSchedule} />
              </motion.div>
            )}

            {/* Resource Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <ResourceRecommendations riskScore={riskScore} assessmentType={assessmentType} />
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            >
              <PDFDownloadLink
                document={
                  <ReportPDF
                    report={{
                      childName: childName,
                      assessmentDate: assessmentData?.completedAt || new Date().toISOString(),
                      assessmentType: assessmentType,
                      riskScore: riskScore,
                      summary: results?.summary || 'Assessment completed successfully.',
                      scores: results?.domainScores || [],
                      recommendations: results?.recommendations || [],
                    }}
                  />
                }
                fileName={`${childName}_Assessment_Report.pdf`}
                className="inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {({ loading }) =>
                  loading ? (
                    <>
                      <SimpleSpinner size="small" className="mr-2" />
                      Generating PDF Report...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Download Report
                    </>
                  )
                }
              </PDFDownloadLink>

              <button
                onClick={handleDashboard}
                className="inline-flex items-center px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Back to Dashboard
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentComplete;
