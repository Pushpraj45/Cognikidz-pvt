import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ReportPDF } from './ReportPDF';
import ResourceRecommendations from '../assessment/ResourceRecommendations';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

// Helper function to format child names properly
const formatChildName = childName => {
  if (!childName || childName.trim() === '') return 'Child Assessment';
  // Remove any "N/A" text and clean up the name
  return childName.replace(/\s*N\/A\s*/gi, '').trim() || 'Child Assessment';
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

// Parse markdown summary into structured format
const parseMarkdownSummary = text => {
  if (!text || typeof text !== 'string') return null;

  // Try to parse as proper markdown
  let sections = parseProperMarkdown(text);

  // If that fails, try to convert plain text to markdown structure
  if (!sections || Object.keys(sections).length === 0) {
    sections = convertPlainTextToMarkdown(text);
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

    // Check for main headers
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

      // Map section names to standard format
      const sectionMappings = {
        assessment_overview: 'overview_of_strengths_and_challenges',
        cross_disorder_risk_analysis: 'overview_of_strengths_and_challenges',
        primary_area_of_concern: 'overview_of_strengths_and_challenges',
        strengths_and_positive_indicators: 'strengths',
        strengths_observed: 'strengths',
        areas_requiring_attention: 'challenges',
        specific_recommendations: 'recommendations',
        follow_up_schedule: 'next_steps',
        follow_up_schedule_and_next_steps: 'next_steps',
        professional_consultation_timeline: 'next_steps',
        next_steps: 'next_steps',
        recommendations: 'recommendations',
        strengths: 'strengths',
        challenges: 'challenges',
        areas_for_growth: 'challenges',
        overview_of_strengths_and_challenges: 'overview_of_strengths_and_challenges',
        key_findings_and_risk_assessment: 'overview_of_strengths_and_challenges',
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

  // Extract title
  const titleMatch = text.match(
    /(Assessment Summary Report|Comprehensive Developmental Screening Report)\s+for\s+([^.•]+)/i
  );
  if (titleMatch) {
    sections.title = titleMatch[0];
  }

  // Simple approach: find all bullet points and categorize them by content
  const allBulletPoints = text.split('•').filter(point => point.trim().length > 10);

  const categorizedPoints = {
    overview_of_strengths_and_challenges: [],
    strengths: [],
    challenges: [],
    recommendations: [],
    next_steps: [],
  };

  // Categorize bullet points
  allBulletPoints.forEach((point, index) => {
    const cleanPoint = cleanTextContent(point.trim());
    const lowerPoint = cleanPoint.toLowerCase();

    // Skip very short points or section headers
    if (
      cleanPoint.length < 15 ||
      lowerPoint.match(/^(strengths|challenges|recommendations|next steps)/)
    ) {
      return;
    }

    let categorized = false;

    // More specific categorization
    if (
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
      lowerPoint.includes('follow')
    ) {
      categorizedPoints.next_steps.push(cleanPoint);
      categorized = true;
    } else if (
      lowerPoint.includes('difficulty') ||
      lowerPoint.includes('struggle') ||
      lowerPoint.includes('challenge') ||
      lowerPoint.includes('trouble')
    ) {
      categorizedPoints.challenges.push(cleanPoint);
      categorized = true;
    } else if (
      lowerPoint.includes('positive') ||
      lowerPoint.includes('strength') ||
      lowerPoint.includes('demonstrates')
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

  return Object.keys(sections).length > 0 ? sections : null;
};

// Format bullet points from text
const formatBulletPoints = text => {
  if (!text) return [];

  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')))
    .map(line => {
      let cleaned = line.replace(/^[-•*]\s*/, '').trim();
      cleaned = cleanTextContent(cleaned);
      return cleaned;
    })
    .filter(line => line.length > 0);
};

// Risk Level Badge Component
const RiskBadge = ({ level, score }) => {
  const getRiskInfo = () => {
    if (typeof score === 'number') {
      if (score <= 3) return { level: 'Low Risk', color: 'green' };
      if (score <= 7) return { level: 'Moderate Risk', color: 'yellow' };
      return { level: 'High Risk', color: 'red' };
    }

    // Fallback to level string if provided
    if (typeof level === 'string') {
      if (level.toLowerCase().includes('low')) return { level: 'Low Risk', color: 'green' };
      if (level.toLowerCase().includes('moderate'))
        return { level: 'Moderate Risk', color: 'yellow' };
      if (level.toLowerCase().includes('high')) return { level: 'High Risk', color: 'red' };
    }

    return { level: 'Assessment Complete', color: 'blue' };
  };

  const { level: displayLevel, color } = getRiskInfo();

  const colorClasses = {
    green: 'bg-green-100/70 text-green-800 dark:bg-green-900/40 dark:text-green-400',
    yellow: 'bg-yellow-100/70 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400',
    red: 'bg-red-100/70 text-red-800 dark:bg-red-900/40 dark:text-red-400',
    blue: 'bg-blue-100/70 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]} border border-white/10 dark:border-gray-700/30`}
    >
      {displayLevel}
    </span>
  );
};

// Section component with expand/collapse functionality
const ReportSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);

  return (
    <div className="border border-white/20 dark:border-gray-700/30 rounded-lg overflow-hidden mb-4 bg-white/90 dark:bg-gray-800/90 shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={contentRef}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-white/20 dark:border-gray-700/30">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Domain score component to visualize cognitive domain scores
const DomainScore = ({ domain, score, description }) => {
  const getScoreColorClass = score => {
    if (score <= 30) return 'bg-gradient-to-r from-red-400 to-red-500';
    if (score <= 70) return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
    return 'bg-gradient-to-r from-green-400 to-green-500';
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{domain}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{score}%</span>
      </div>
      <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 h-2.5 rounded-full overflow-hidden border border-white/10 dark:border-gray-700/30">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${getScoreColorClass(score)}`}
        ></motion.div>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {cleanTextContent(description)}
      </p>
    </div>
  );
};

// Summary Section Component with Enhanced Markdown Parsing
const SummarySection = ({ summary, report }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!summary) return null;

  const parsedSummary = parseMarkdownSummary(summary);

  if (!parsedSummary) {
    // Fallback to simple text display
    const cleanSummary = cleanTextContent(summary);
    const shortSummary =
      cleanSummary.length > 300 ? cleanSummary.substring(0, 300) + '...' : cleanSummary;

    return (
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
    <div className="space-y-4">
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
  );
};

const ReportCard = ({ report }) => {
  const reportRef = useRef(null);

  // Enhanced age extraction with multiple fallback sources
  const getChildAge = reportData => {
    if (!reportData) return null;

    // Try multiple sources for age
    return (
      reportData.childAge ||
      reportData.age ||
      reportData.childData?.age ||
      reportData.childInfo?.age ||
      reportData.results?.childAge ||
      null
    );
  };

  const childAge = getChildAge(report);

  // Format date to be more readable
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if we have a valid report with required data
  if (!report || !report.childName) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-md border border-white/20 dark:border-gray-700/30 p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">Report data is not available</p>
      </div>
    );
  }

  // Get risk level and score with multiple fallback sources
  const getRiskInfo = report => {
    // Try multiple sources for risk score
    const riskScore =
      report.riskScore ||
      report.results?.disorderRisk?.score ||
      report.results?.riskScore ||
      report.disorderRisk?.score ||
      null;

    // Try multiple sources for risk level
    const riskLevel =
      report.riskLevel ||
      report.results?.disorderRisk?.interpretation ||
      report.results?.riskLevel ||
      report.disorderRisk?.interpretation ||
      null;

    return { riskScore, riskLevel };
  };

  const { riskScore, riskLevel } = getRiskInfo(report);

  return (
    <div
      ref={reportRef}
      className="bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-xl border border-white/20 dark:border-gray-700/30 print:shadow-none transition-all duration-300 print:p-0 overflow-hidden max-w-4xl mx-auto"
    >
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 w-40 h-40 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-xl"></div>
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-radial from-secondary/20 to-transparent rounded-full blur-xl"></div>

      {/* Report Header */}
      <div className="relative p-6 border-b border-white/20 dark:border-gray-700/30 print:border-gray-300">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <div className="inline-flex items-center mb-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-full pl-1 pr-4 py-1">
              <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <span className="text-primary dark:text-primary-300 text-sm font-medium">
                Assessment Results
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Assessment Report
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Child:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatChildName(report.childName)}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Age:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {childAge ? `${childAge} years` : 'Not specified'}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Assessment Type:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {report.assessmentType?.toUpperCase() || 'General Assessment'}
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Date:{' '}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {formatDate(report.assessmentDate)}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3 py-2 border border-gray-300/80 dark:border-gray-600/80 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              <PrinterIcon className="h-4 w-4 mr-1" />
              Print
            </button>

            <PDFDownloadLink
              document={<ReportPDF report={report} />}
              fileName={`${report.childName}_Assessment_Report.pdf`}
              className="inline-flex items-center px-3 py-2 border border-gray-300/80 dark:border-gray-600/80 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white/80 dark:bg-gray-700/80 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              {({ loading }) =>
                loading ? (
                  'Preparing...'
                ) : (
                  <>
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                    Download PDF
                  </>
                )
              }
            </PDFDownloadLink>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50/80 dark:bg-gray-700/50 rounded-lg border border-white/10 dark:border-gray-700/30">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Overall Assessment:
              </p>
              <div className="flex items-center mt-1">
                <RiskBadge level={riskLevel} score={riskScore} />
                {riskScore && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Score: {typeof riskScore === 'number' ? riskScore.toFixed(1) : riskScore}/10
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6 relative">
        {/* Summary Section */}
        <ReportSection title="Summary" defaultOpen={true}>
          <SummarySection summary={report.summary} report={report} />
        </ReportSection>

        {/* Detailed Analysis Section */}
        {report.domainScores && report.domainScores.length > 0 && (
          <ReportSection title="Detailed Analysis (Cognitive Domains)">
            <div className="space-y-6">
              {report.domainScores.map((domain, index) => (
                <DomainScore
                  key={index}
                  domain={domain.domain}
                  score={domain.score}
                  description={
                    domain.description ||
                    'This domain assesses specific cognitive abilities related to developmental milestones.'
                  }
                />
              ))}
            </div>
          </ReportSection>
        )}

        {/* Recommendations Section */}
        <ReportSection title="Recommendations">
          {report.recommendations && report.recommendations.length > 0 ? (
            <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
              {report.recommendations.map((recommendation, index) => (
                <li key={index}>{cleanTextContent(recommendation)}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Recommendations are included in the assessment summary above.
            </p>
          )}
        </ReportSection>

        {/* Resource Recommendations Section */}
        <ReportSection title="Recommended Resources">
          <ResourceRecommendations
            riskScore={riskScore}
            assessmentType={report.assessmentType || 'general'}
          />
        </ReportSection>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/30 backdrop-blur-sm border-t border-white/10 dark:border-gray-700/30 text-xs text-gray-500 dark:text-gray-400">
        <p>
          This report is confidential and intended for use by parents/guardians and authorized
          professionals only.
        </p>
        <p className="mt-1">© {new Date().getFullYear()} CogniKidz Assessment Platform</p>
      </div>
    </div>
  );
};

export default ReportCard;
