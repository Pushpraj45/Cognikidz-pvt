import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const ResourceRecommendations = ({ riskScore, assessmentType }) => {
  // Define the 9 articles with their metadata
  const articles = {
    dyslexia: {
      low: {
        id: '68684e3f5c0a099871a66e46',
        title: 'Building Strong Reading Habits: Early Support for Young Readers',
        url: 'https://www.cognikidz.care/blog/68684e3f5c0a099871a66e46',
        excerpt:
          'Learn how to build strong reading foundations and support early literacy development in young children.',
        readingTime: '6 min',
        tags: ['dyslexia', 'reading', 'early-intervention', 'parenting'],
      },
      moderate: {
        id: '6868502e5c0a099871a66f59',
        title: 'Helping Your Child with Dyslexia: Practical Tips for Parents',
        url: 'https://www.cognikidz.care/blog/6868502e5c0a099871a66f59',
        excerpt:
          'Practical strategies and tips to support your child with dyslexia at home and in school.',
        readingTime: '8 min',
        tags: ['dyslexia', 'parenting', 'strategies', 'support'],
      },
      high: {
        id: '686850e95c0a099871a66fa3',
        title: 'Supporting a Struggling Reader: Next Steps for Parents Facing Dyslexia',
        url: 'https://www.cognikidz.care/blog/686850e95c0a099871a66fa3',
        excerpt:
          'Comprehensive guide for parents navigating dyslexia diagnosis and intervention strategies.',
        readingTime: '10 min',
        tags: ['dyslexia', 'intervention', 'professional-help', 'support'],
      },
    },
    adhd: {
      low: {
        id: '686851d25c0a099871a66fc0',
        title: 'Boosting Focus and Routine: Early Habits for Young Minds',
        url: 'https://www.cognikidz.care/blog/686851d25c0a099871a66fc0',
        excerpt:
          'Develop healthy focus habits and establish effective routines for young children.',
        readingTime: '5 min',
        tags: ['adhd', 'focus', 'routine', 'early-habits'],
      },
      moderate: {
        id: '686852855c0a099871a6700b',
        title: 'Supporting Focus and Self-Control: Strategies for Growing Minds',
        url: 'https://www.cognikidz.care/blog/686852855c0a099871a6700b',
        excerpt: 'Effective strategies to help children develop focus and self-control skills.',
        readingTime: '7 min',
        tags: ['adhd', 'focus', 'self-control', 'strategies'],
      },
      high: {
        id: '6868533a5c0a099871a6702a',
        title: 'Managing Attention and Impulsivity: A Guide for Parents Navigating ADHD',
        url: 'https://www.cognikidz.care/blog/6868533a5c0a099871a6702a',
        excerpt:
          'Comprehensive guide for parents managing ADHD symptoms and seeking professional support.',
        readingTime: '12 min',
        tags: ['adhd', 'attention', 'impulsivity', 'management', 'professional-help'],
      },
    },
    autism: {
      low: {
        id: '6868541a5c0a099871a6707b',
        title: 'Encouraging Social and Communication Skills in Early Childhood',
        url: 'https://www.cognikidz.care/blog/6868541a5c0a099871a6707b',
        excerpt:
          "Support your child's social and communication development with age-appropriate activities.",
        readingTime: '6 min',
        tags: ['autism', 'social-skills', 'communication', 'early-childhood'],
      },
      moderate: {
        id: '686854975c0a099871a6709c',
        title: 'Nurturing Communication and Social Awareness: Support Strategies for Your Child',
        url: 'https://www.cognikidz.care/blog/686854975c0a099871a6709c',
        excerpt: 'Strategies to enhance communication skills and social awareness in children.',
        readingTime: '8 min',
        tags: ['autism', 'communication', 'social-awareness', 'strategies'],
      },
      high: {
        id: '686855305c0a099871a670f3',
        title: 'Understanding and Supporting Autism: A Guide for Parents at the Early Stage',
        url: 'https://www.cognikidz.care/blog/686855305c0a099871a670f3',
        excerpt:
          'Essential guide for parents understanding autism and accessing early intervention support.',
        readingTime: '11 min',
        tags: ['autism', 'understanding', 'support', 'early-intervention', 'professional-help'],
      },
    },
  };

  // Determine risk level based on score
  const getRiskLevel = score => {
    if (score <= 3) return 'low';
    if (score <= 7) return 'moderate';
    return 'high';
  };

  // Get risk level color and icon
  const getRiskLevelInfo = level => {
    switch (level) {
      case 'low':
        return { color: 'text-green-600 bg-green-50 dark:bg-green-900/20', icon: '✅' };
      case 'moderate':
        return { color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20', icon: '⚠️' };
      case 'high':
        return { color: 'text-red-600 bg-red-50 dark:bg-red-900/20', icon: '🚨' };
      default:
        return { color: 'text-gray-600 bg-gray-50 dark:bg-gray-900/20', icon: 'ℹ️' };
    }
  };

  const riskLevel = getRiskLevel(riskScore);
  const assessmentTypeLower = assessmentType.toLowerCase();
  const riskInfo = getRiskLevelInfo(riskLevel);

  // Handle different case variations and common variations
  const getAssessmentTypeKey = type => {
    const lowerType = type.toLowerCase();
    // Map common variations to our article keys
    const typeMapping = {
      adhd: 'adhd',
      'attention deficit hyperactivity disorder': 'adhd',
      'attention deficit': 'adhd',
      autism: 'autism',
      'autism spectrum disorder': 'autism',
      asd: 'autism',
      dyslexia: 'dyslexia',
      'reading disorder': 'dyslexia',
      'learning disability': 'dyslexia',
      general: 'general',
    };
    return typeMapping[lowerType] || lowerType;
  };

  const assessmentTypeKey = getAssessmentTypeKey(assessmentType);

  // Get the recommended article
  const recommendedArticle = articles[assessmentTypeKey]?.[riskLevel];

  // If no specific article is found, show a general resource
  if (!recommendedArticle) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20"
      >
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <svg
              className="w-7 h-7 mr-3 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            Recommended Resources
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 font-medium ml-10">
            Based on your assessment results
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                    ℹ️ General
                  </span>
                  <span className="text-gray-500 text-xs">7 min read</span>
                  <span className="text-blue-600 text-xs font-medium">General Recommendation</span>
                </div>

                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Understanding Child Development: A Parent's Guide
                </h4>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  Learn about typical child development milestones and when to seek professional
                  guidance.
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    #development
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    #milestones
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                    #parenting
                  </span>
                </div>
              </div>

              <div className="ml-4">
                <a
                  href="/blog/development-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Read Article
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.9 }}
      className="bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 border border-white/20 dark:border-gray-700/20"
    >
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
          <svg
            className="w-7 h-7 mr-3 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          Recommended Resources
        </h3>
        <p className="text-lg text-gray-600 dark:text-gray-300 font-medium ml-10">
          Based on your {riskLevel} risk assessment
        </p>
      </div>

      <div className="space-y-4">
        {/* Primary Recommended Article */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskInfo.color}`}>
                  {riskInfo.icon} {riskLevel} risk
                </span>
                <span className="text-gray-500 text-xs">{recommendedArticle.readingTime} read</span>
                <span className="text-blue-600 text-xs font-medium">Primary Recommendation</span>
              </div>

              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {recommendedArticle.title}
              </h4>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                {recommendedArticle.excerpt}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {recommendedArticle.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="ml-4">
              <a
                href={recommendedArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                Read Article
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceRecommendations;
