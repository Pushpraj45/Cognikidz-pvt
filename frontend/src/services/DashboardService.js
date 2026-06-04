import api from './api';

class DashboardService {
  /**
   * Get dashboard overview data including parent details and basic stats
   */
  async getDashboardOverview(assessmentType = null) {
    try {
      const params = assessmentType && assessmentType !== 'all' ? { assessmentType } : {};
      const response = await api.get('/api/dashboard/overview', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get recent assessment results (top 5 per child)
   */
  async getRecentAssessments(assessmentType = null) {
    try {
      const params = assessmentType && assessmentType !== 'all' ? { assessmentType } : {};
      const response = await api.get('/api/dashboard/recent-assessments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent assessments:', error);
      throw error;
    }
  }

  /**
   * Get assessment counts by type for filter badges
   */
  async getAssessmentCounts() {
    try {
      const response = await api.get('/api/dashboard/assessment-counts');
      return response.data;
    } catch (error) {
      console.error('Error fetching assessment counts:', error);
      throw error;
    }
  }

  /**
   * Get in-progress assessments with filtering support
   */
  async getInProgressAssessments(assessmentType = null) {
    try {
      const params = assessmentType && assessmentType !== 'all' ? { assessmentType } : {};
      const response = await api.get('/api/dashboard/in-progress-assessments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching in-progress assessments:', error);
      throw error;
    }
  }

  /**
   * Get all user reports with filtering support
   */
  async getAllUserReports(filters = {}) {
    try {
      const response = await api.get('/api/dashboard/reports', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics summary
   */
  async getDashboardStats() {
    try {
      const response = await api.get('/api/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Enhanced progress visualization data for a specific child with full assessment type support
   * Includes assessment breakdown and filtering support
   */
  async getChildProgress(childId, assessmentType = null, scoreMode = 'average') {
    try {
      const params = {};

      if (assessmentType && assessmentType !== 'all') {
        params.assessmentType = assessmentType;
      }

      if (scoreMode && scoreMode !== 'average') {
        params.scoreMode = scoreMode;
      }

      console.log('🔄 DashboardService.getChildProgress called with:', {
        childId,
        assessmentType,
        scoreMode,
        params,
      });

      const response = await api.get(`/api/dashboard/child-progress/${childId}`, { params });

      // Enhanced response processing for better frontend integration
      if (response.data.success) {
        const data = response.data.data;

        // Ensure assessment breakdown exists
        if (!data.assessmentBreakdown) {
          data.assessmentBreakdown = { text: 0, image: 0, total: 0 };
        }

        // Add activeFilter to data for frontend consumption
        data.activeFilter = assessmentType || 'all';

        // Process domain scores for better visualization
        if (data.currentScores && Object.keys(data.currentScores).length > 0) {
          data.hasValidScores = true;
        }

        console.log('✅ Enhanced child progress data:', {
          childName: data.childName,
          totalAssessments: data.totalAssessments,
          assessmentBreakdown: data.assessmentBreakdown,
          activeFilter: data.activeFilter,
          domainsCount: Object.keys(data.domains || {}).length,
          timelinesCount: data.timelines?.length || 0,
        });

        return response.data;
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching child progress:', error);

      // Enhanced error handling with assessment type context
      if (error.response?.status === 404) {
        throw new Error(
          `Child not found or no ${assessmentType === 'text' ? 'text-based' : assessmentType === 'image' ? 'image-based' : ''} assessments available`
        );
      } else if (error.response?.status === 403) {
        throw new Error("You do not have permission to view this child's progress");
      } else {
        throw new Error(`Failed to load progress data: ${error.message}`);
      }
    }
  }

  /**
   * Analyze progress from assessment reports using LLM
   */
  async analyzeProgressFromReport(assessmentReport, childProfile) {
    try {
      const response = await api.post('/api/assessment/analyze-progress', {
        assessmentReport,
        childProfile,
      });
      return response.data;
    } catch (error) {
      console.error('Error analyzing progress from report:', error);
      throw error;
    }
  }

  /**
   * Get child assessments for progress analysis
   */
  async getChildAssessments(childId, assessmentType = null) {
    try {
      const params = {};
      if (assessmentType && assessmentType !== 'all') {
        params.assessmentType = assessmentType;
      }

      const response = await api.get(`/api/assessment/childAssessments/${childId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching child assessments:', error);
      throw error;
    }
  }

  /**
   * Get progress overview for all children with assessment type filtering
   */
  async getProgressOverview(assessmentType = null) {
    try {
      const params = {};
      if (assessmentType && assessmentType !== 'all') {
        params.assessmentType = assessmentType;
      }

      const response = await api.get('/api/dashboard/progress-overview', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching progress overview:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data with assessment type filtering
   * This is a convenience method that fetches multiple endpoints at once
   */
  async getComprehensiveDashboardData(assessmentType = 'all') {
    try {
      console.log('🔄 Fetching comprehensive dashboard data with filter:', assessmentType);

      const [overview, counts, recentAssessments, inProgress] = await Promise.all([
        this.getDashboardOverview(assessmentType),
        this.getAssessmentCounts(),
        this.getRecentAssessments(assessmentType),
        this.getInProgressAssessments(assessmentType),
      ]);

      return {
        overview: overview.data,
        counts: counts.data,
        recentAssessments: recentAssessments.data,
        inProgress: inProgress.data,
        activeFilter: assessmentType,
      };
    } catch (error) {
      console.error('Error fetching comprehensive dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get all reports for current user with enhanced filtering
   */
  async getAllReports(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString ? `/api/dashboard/reports?${queryString}` : '/api/dashboard/reports';

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  /**
   * Get reports for a specific child with assessment type filtering
   */
  async getChildReports(childId, params = {}) {
    try {
      const queryParams = new URLSearchParams();

      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryParams.append(key, params[key]);
        }
      });

      const queryString = queryParams.toString();
      const url = queryString
        ? `/api/dashboard/reports/child/${childId}?${queryString}`
        : `/api/dashboard/reports/child/${childId}`;

      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching child reports:', error);
      throw error;
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(reportId) {
    try {
      console.log(`🔍 [FRONTEND] Fetching report with ID: ${reportId}`);
      const response = await api.get(`/api/dashboard/reports/${reportId}`);

      console.log(`✅ [FRONTEND] API response received:`, {
        success: response.data?.success,
        hasReport: !!response.data?.data?.report,
        reportId: response.data?.data?.report?.id,
        assessmentType: response.data?.data?.report?.assessmentType,
        childName: response.data?.data?.report?.childName,
        hasSummary: !!response.data?.data?.report?.summary,
        summaryLength: response.data?.data?.report?.summary?.length || 0,
        riskScore: response.data?.data?.report?.riskScore,
      });

      // Log a preview of the summary to check if it's real data
      if (response.data?.data?.report?.summary) {
        console.log(
          `📄 [FRONTEND] Summary preview:`,
          response.data.data.report.summary.substring(0, 200) + '...'
        );
      }

      return response.data;
    } catch (error) {
      console.error('❌ [FRONTEND] Error fetching report:', error);
      throw error;
    }
  }

  /**
   * Download a report as PDF
   */
  async downloadReport(reportId) {
    try {
      console.log('🔽 Starting download for report:', reportId);

      // Use responseType: 'blob' to handle both PDF and JSON responses properly
      const response = await api.get(`/api/dashboard/reports/${reportId}/download`, {
        responseType: 'blob',
      });

      console.log('📦 Download response received:', {
        status: response.status,
        contentType: response.headers['content-type'],
        contentLength: response.headers['content-length'],
        contentDisposition: response.headers['content-disposition'],
      });

      // Check if it's actually a PDF or if we got an error response
      const contentType = response.headers['content-type'];

      if (contentType && contentType.includes('application/pdf')) {
        // It's a PDF, handle as before
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        // Extract filename from Content-Disposition header
        let filename = 'assessment-report.pdf';
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
          const matches = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (matches && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        console.log('✅ PDF download completed:', filename);
        return {
          success: true,
          filename,
          message: 'Report downloaded successfully',
        };
      } else if (contentType && contentType.includes('application/json')) {
        // It's a JSON response (likely with structured data)
        const text = await response.data.text();
        const jsonData = JSON.parse(text);

        console.log('📄 JSON fallback response:', jsonData);

        // Download as JSON file for now
        const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], {
          type: 'application/json',
        });
        const url = window.URL.createObjectURL(jsonBlob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `assessment-report-${reportId}.json`;
        document.body.appendChild(a);
        a.click();

        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return {
          success: true,
          filename: `assessment-report-${reportId}.json`,
          message: 'Report data downloaded as JSON',
          data: jsonData,
        };
      } else {
        // Unknown content type
        console.error('❌ Unexpected content type:', contentType);
        throw new Error('Invalid response format received');
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      throw new Error(`Failed to download report: ${error.message}`);
    }
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId) {
    try {
      const response = await api.delete(`/api/dashboard/reports/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  /**
   * Generate PDF on client-side as fallback
   */
  async generateClientSidePDF(reportData) {
    try {
      // Dynamic import to avoid loading these libraries unless needed
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Helper function to add text with word wrapping
      const addText = (text, x, y, options = {}) => {
        const { fontSize = 12, maxWidth = pageWidth - 40, color = '#000000' } = options;
        doc.setFontSize(fontSize);
        doc.setTextColor(color);

        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return y + lines.length * fontSize * 0.5;
      };

      // Header
      doc.setFillColor(37, 99, 235); // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('CogniKidz Assessment Report', pageWidth / 2, 25, { align: 'center' });

      yPosition = 50;

      // Child Information
      doc.setFillColor(249, 250, 251); // Light gray background
      doc.rect(20, yPosition, pageWidth - 40, 60, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.rect(20, yPosition, pageWidth - 40, 60, 'S');

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Child Information', 30, yPosition + 15);

      doc.setFontSize(10);
      yPosition += 25;
      doc.text(`Name: ${reportData.childName}`, 30, yPosition);
      yPosition += 10;
      doc.text(
        `Age: ${reportData.childAge ? `${reportData.childAge} years` : 'Not specified'}`,
        30,
        yPosition
      );
      yPosition += 10;
      doc.text(`Assessment Type: ${reportData.assessmentType}`, 30, yPosition);
      yPosition += 10;
      doc.text(`Date: ${new Date(reportData.assessmentDate).toLocaleDateString()}`, 30, yPosition);

      yPosition += 20;

      // Risk Assessment
      doc.setFontSize(14);
      doc.text('Overall Assessment', 20, yPosition);
      yPosition += 10;

      const getRiskLevel = score => {
        if (!score || isNaN(score)) return 'Assessment Complete';
        if (score <= 3) return 'Low Risk';
        if (score <= 7) return 'Moderate Risk';
        return 'High Risk';
      };

      const riskLevel = getRiskLevel(reportData.riskScore);
      doc.setFontSize(16);

      // Set color based on risk level
      if (riskLevel === 'Low Risk') doc.setTextColor(16, 185, 129);
      else if (riskLevel === 'Moderate Risk') doc.setTextColor(245, 158, 11);
      else if (riskLevel === 'High Risk') doc.setTextColor(239, 68, 68);
      else doc.setTextColor(107, 114, 128);

      doc.text(riskLevel, 20, yPosition);
      yPosition += 10;

      if (reportData.riskScore) {
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(10);
        doc.text(`Risk Score: ${reportData.riskScore.toFixed(1)}/10`, 20, yPosition);
        yPosition += 15;
      }

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.text('Assessment Summary', 20, yPosition);
      yPosition += 10;

      const summaryText = reportData.summary || 'Assessment completed successfully.';
      yPosition = addText(summaryText, 20, yPosition, { fontSize: 10, maxWidth: pageWidth - 40 });
      yPosition += 10;

      // Domain Scores
      if (reportData.domainScores && reportData.domainScores.length > 0) {
        doc.setFontSize(14);
        doc.text('Domain Analysis', 20, yPosition);
        yPosition += 10;

        reportData.domainScores.forEach((domain, index) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFontSize(11);
          doc.text(`${domain.domain || domain.name}: ${domain.score}/10`, 20, yPosition);

          // Simple score bar
          const barWidth = 100;
          const scoreWidth = (domain.score / 10) * barWidth;
          doc.setDrawColor(229, 231, 235);
          doc.rect(120, yPosition - 3, barWidth, 6, 'S');

          if (domain.score <= 3) doc.setFillColor(16, 185, 129);
          else if (domain.score <= 7) doc.setFillColor(245, 158, 11);
          else doc.setFillColor(239, 68, 68);

          doc.rect(120, yPosition - 3, scoreWidth, 6, 'F');
          yPosition += 15;

          if (domain.description) {
            yPosition = addText(domain.description, 25, yPosition, {
              fontSize: 9,
              maxWidth: pageWidth - 50,
            });
            yPosition += 5;
          }
        });

        yPosition += 10;
      }

      // Recommendations
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text('Recommendations', 20, yPosition);
      yPosition += 10;

      if (reportData.recommendations && reportData.recommendations.length > 0) {
        reportData.recommendations.forEach((rec, index) => {
          yPosition = addText(`• ${rec}`, 25, yPosition, {
            fontSize: 10,
            maxWidth: pageWidth - 50,
          });
          yPosition += 5;
        });
      } else {
        yPosition = addText('No specific recommendations provided.', 20, yPosition, {
          fontSize: 10,
        });
      }

      // Disclaimer
      yPosition += 20;
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFillColor(254, 243, 199); // Yellow background
      doc.rect(20, yPosition - 5, pageWidth - 40, 30, 'F');
      doc.setDrawColor(245, 158, 11);
      doc.rect(20, yPosition - 5, pageWidth - 40, 30, 'S');

      doc.setFontSize(10);
      doc.setTextColor(146, 64, 14);
      yPosition = addText(
        'Important Notice: This assessment is for informational purposes only and should not be considered a medical diagnosis. Please consult with qualified healthcare professionals for proper evaluation and treatment recommendations.',
        25,
        yPosition,
        { fontSize: 9, maxWidth: pageWidth - 50 }
      );

      // Generate and return the PDF
      const pdfBlob = doc.output('blob');
      return pdfBlob;
    } catch (error) {
      console.error('Client-side PDF generation failed:', error);
      throw error;
    }
  }
}

// Create instance and export as default to fix ESLint warning
const dashboardService = new DashboardService();
export default dashboardService;
