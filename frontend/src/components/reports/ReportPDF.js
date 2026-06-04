import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for PDF rendering
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    {
      src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf',
      fontWeight: 600,
    },
    {
      src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf',
      fontWeight: 700,
    },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Open Sans',
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#111827',
    paddingBottom: 5,
    borderBottom: '1px solid #E5E7EB',
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  riskSummary: {
    padding: 10,
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
  },
  riskTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#111827',
  },
  riskLevel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  domainItem: {
    marginBottom: 15,
  },
  domainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  domainTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#374151',
  },
  domainScore: {
    fontSize: 11,
    color: '#374151',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  domainDescription: {
    fontSize: 10,
    color: '#6B7280',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bullet: {
    width: 15,
    fontSize: 11,
  },
  recommendationText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
  },
  resourceItem: {
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 3,
  },
  resourceTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 3,
  },
  resourceExcerpt: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 3,
  },
  resourceUrl: {
    fontSize: 9,
    color: '#3B82F6',
    textDecoration: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
});

// Helper to get color for risk levels
const getRiskColor = score => {
  if (score <= 3) return '#10B981'; // green
  if (score <= 7) return '#F59E0B'; // yellow
  return '#EF4444'; // red
};

// Helper to get risk level text
const getRiskLevelText = score => {
  if (score <= 3) return 'Low Risk';
  if (score <= 7) return 'Moderate Risk';
  return 'High Risk';
};

// Progress bar component for PDF
const ProgressBar = ({ score }) => (
  <View style={styles.progressBar}>
    <View
      style={[
        styles.progressFill,
        { width: `${score * 10}%`, backgroundColor: getRiskColor(score) },
      ]}
    />
  </View>
);

// Main PDF Document component
export const ReportPDF = ({ report }) => {
  // Get risk level and score with multiple fallback sources (same logic as ReportCard)
  const getRiskInfo = report => {
    // Try multiple sources for risk score
    const riskScore =
      report.riskScore ||
      report.results?.disorderRisk?.score ||
      report.results?.riskScore ||
      report.disorderRisk?.score ||
      5; // Default fallback

    // Try multiple sources for risk level
    const riskLevel =
      report.riskLevel ||
      report.results?.disorderRisk?.interpretation ||
      report.results?.riskLevel ||
      report.disorderRisk?.interpretation ||
      getRiskLevelText(riskScore);

    return { riskScore, riskLevel };
  };

  const { riskScore, riskLevel } = getRiskInfo(report);

  // Get recommended resources based on risk level and assessment type
  const getRecommendedResources = () => {
    const articles = {
      dyslexia: {
        low: {
          title: 'Building Strong Reading Habits: Early Support for Young Readers',
          url: 'https://www.cognikidz.care/blog/68684e3f5c0a099871a66e46',
          excerpt:
            'Learn how to build strong reading foundations and support early literacy development in young children.',
        },
        moderate: {
          title: 'Helping Your Child with Dyslexia: Practical Tips for Parents',
          url: 'https://www.cognikidz.care/blog/6868502e5c0a099871a66f59',
          excerpt:
            'Practical strategies and tips to support your child with dyslexia at home and in school.',
        },
        high: {
          title: 'Supporting a Struggling Reader: Next Steps for Parents Facing Dyslexia',
          url: 'https://www.cognikidz.care/blog/686850e95c0a099871a66fa3',
          excerpt:
            'Comprehensive guide for parents navigating dyslexia diagnosis and intervention strategies.',
        },
      },
      adhd: {
        low: {
          title: 'Boosting Focus and Routine: Early Habits for Young Minds',
          url: 'https://www.cognikidz.care/blog/686851d25c0a099871a66fc0',
          excerpt:
            'Develop healthy focus habits and establish effective routines for young children.',
        },
        moderate: {
          title: 'Supporting Focus and Self-Control: Strategies for Growing Minds',
          url: 'https://www.cognikidz.care/blog/686852855c0a099871a6700b',
          excerpt: 'Effective strategies to help children develop focus and self-control skills.',
        },
        high: {
          title: 'Managing Attention and Impulsivity: A Guide for Parents Navigating ADHD',
          url: 'https://www.cognikidz.care/blog/6868533a5c0a099871a6702a',
          excerpt:
            'Comprehensive guide for parents managing ADHD symptoms and seeking professional support.',
        },
      },
      autism: {
        low: {
          title: 'Encouraging Social and Communication Skills in Early Childhood',
          url: 'https://www.cognikidz.care/blog/6868541a5c0a099871a6707b',
          excerpt:
            "Support your child's social and communication development with age-appropriate activities.",
        },
        moderate: {
          title: 'Nurturing Communication and Social Awareness: Support Strategies for Your Child',
          url: 'https://www.cognikidz.care/blog/686854975c0a099871a6709c',
          excerpt: 'Strategies to enhance communication skills and social awareness in children.',
        },
        high: {
          title: 'Understanding and Supporting Autism: A Guide for Parents at the Early Stage',
          url: 'https://www.cognikidz.care/blog/686855305c0a099871a670f3',
          excerpt:
            'Essential guide for parents understanding autism and accessing early intervention support.',
        },
      },
    };

    const getRiskLevel = score => {
      if (score <= 3) return 'low';
      if (score <= 7) return 'moderate';
      return 'high';
    };

    // Handle different case variations and common variations
    const getAssessmentTypeKey = type => {
      const lowerType = type.toLowerCase();
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

    const riskLevelKey = getRiskLevel(riskScore);
    const assessmentType = report.assessmentType || 'general';
    const assessmentTypeKey = getAssessmentTypeKey(assessmentType);

    return articles[assessmentTypeKey]?.[riskLevelKey] || null;
  };

  const recommendedResource = getRecommendedResources();

  // Format date to be more readable
  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Assessment Report</Text>
          <Text style={styles.subtitle}>
            <Text style={styles.label}>Child:</Text> {report.childName}
          </Text>
          <Text style={styles.subtitle}>
            <Text style={styles.label}>Date:</Text> {formatDate(report.assessmentDate)}
          </Text>
        </View>

        {/* Risk Summary */}
        <View style={styles.riskSummary}>
          <Text style={styles.riskTitle}>Overall Assessment:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.riskLevel, { color: getRiskColor(riskScore) }]}>{riskLevel}</Text>
            <Text style={{ fontSize: 11 }}>
              Score: {typeof riskScore === 'number' ? riskScore.toFixed(1) : riskScore}/10
            </Text>
          </View>
        </View>

        {/* Summary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <Text style={styles.paragraph}>
            {report.summary ||
              "This assessment evaluates various cognitive domains to identify areas of strength and potential concern. The report provides an overview of the child's performance across multiple developmental areas."}
          </Text>
        </View>

        {/* Detailed Analysis Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Analysis (Cognitive Domains)</Text>
          {(report.domainScores || report.scores) &&
            (report.domainScores || report.scores).map((domain, index) => (
              <View key={index} style={styles.domainItem}>
                <View style={styles.domainHeader}>
                  <Text style={styles.domainTitle}>{domain.domain}</Text>
                  <Text style={styles.domainScore}>{domain.score}/10</Text>
                </View>
                <ProgressBar score={domain.score} />
                <Text style={styles.domainDescription}>
                  {domain.description ||
                    'This domain assesses specific cognitive abilities related to developmental milestones.'}
                </Text>
              </View>
            ))}
        </View>

        {/* Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {report.recommendations && report.recommendations.length > 0 ? (
            report.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.bullet}>• </Text>
                <Text style={styles.recommendationText}>{recommendation}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.paragraph}>No specific recommendations provided.</Text>
          )}
        </View>

        {/* Resource Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Resources</Text>
          {recommendedResource ? (
            <>
              <Text style={styles.paragraph}>
                Based on your {riskLevel.toLowerCase()} risk assessment, we recommend the following
                resource:
              </Text>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>{recommendedResource.title}</Text>
                <Text style={styles.resourceExcerpt}>{recommendedResource.excerpt}</Text>
                <Text style={styles.resourceUrl}>{recommendedResource.url}</Text>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.paragraph}>
                Based on your assessment results, we recommend the following general resource:
              </Text>
              <View style={styles.resourceItem}>
                <Text style={styles.resourceTitle}>
                  Understanding Child Development: A Parent's Guide
                </Text>
                <Text style={styles.resourceExcerpt}>
                  Learn about typical child development milestones and when to seek professional
                  guidance.
                </Text>
                <Text style={styles.resourceUrl}>
                  https://www.cognikidz.care/blog/development-guide
                </Text>
              </View>
            </>
          )}
          <Text style={styles.paragraph}>
            Visit our website for additional resources and support materials tailored to your
            child's needs.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This report is confidential and intended for use by parents/guardians and authorized
            professionals only.
          </Text>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} CogniKidz Assessment Platform
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReportPDF;
