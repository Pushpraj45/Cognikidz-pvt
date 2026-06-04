import api from './api';

class ReportService {
  /**
   * Get reports for a specific child
   */
  async getChildReports(childId, options = {}) {
    try {
      const params = new URLSearchParams();

      // Add optional query parameters
      if (options.limit) params.append('limit', options.limit);
      if (options.reportType) params.append('reportType', options.reportType);
      if (options.priority) params.append('priority', options.priority);
      if (options.status) params.append('status', options.status);

      const queryString = params.toString();
      const url = `/assessment/reports/child/${childId}${queryString ? `?${queryString}` : ''}`;

      console.log(`🔍 Fetching reports for child ${childId}:`, url);

      const response = await api.get(url);

      console.log(`✅ Reports fetched successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching child reports:', error);
      throw error;
    }
  }

  /**
   * Get a specific report by ID
   */
  async getReportById(reportId) {
    try {
      console.log(`🔍 Fetching report details for ID: ${reportId}`);

      const response = await api.get(`/assessment/reports/${reportId}`);

      console.log(`✅ Report details fetched successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching report details:', error);
      throw error;
    }
  }

  /**
   * Mark a report as viewed
   */
  async markReportAsViewed(reportId) {
    try {
      console.log(`👀 Marking report ${reportId} as viewed`);

      const response = await api.put(`/assessment/reports/${reportId}/viewed`);

      console.log(`✅ Report marked as viewed:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error marking report as viewed:', error);
      throw error;
    }
  }

  /**
   * Get reports by priority level
   */
  async getReportsByPriority(priority = 'high') {
    try {
      console.log(`🔍 Fetching ${priority} priority reports`);

      const response = await api.get(`/assessment/reports/priority/${priority}`);

      console.log(`✅ Priority reports fetched successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching priority reports:', error);
      throw error;
    }
  }

  /**
   * Get reports dashboard summary
   */
  async getReportsSummary() {
    try {
      console.log(`📊 Fetching reports dashboard summary`);

      const response = await api.get('/assessment/reports/summary');

      console.log(`✅ Reports summary fetched successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching reports summary:', error);
      throw error;
    }
  }

  /**
   * Download a report as PDF (if implemented)
   */
  async downloadReport(reportId) {
    try {
      console.log(`📥 Downloading report ${reportId}`);

      const response = await api.get(`/assessment/reports/${reportId}/download`, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${reportId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log(`✅ Report downloaded successfully`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Get high-priority reports for dashboard notifications
   */
  async getHighPriorityReports() {
    try {
      const response = await this.getReportsByPriority('high');
      const criticalResponse = await this.getReportsByPriority('critical');

      const highPriorityReports = response.data?.reports || [];
      const criticalReports = criticalResponse.data?.reports || [];

      return {
        success: true,
        data: {
          reports: [...criticalReports, ...highPriorityReports],
          totalReports: highPriorityReports.length + criticalReports.length,
        },
      };
    } catch (error) {
      console.error('❌ Error fetching high-priority reports:', error);
      throw error;
    }
  }

  /**
   * Get unread reports count for a child
   */
  async getUnreadCount(childId) {
    try {
      const response = await this.getChildReports(childId, { status: 'completed' });

      if (response.success) {
        const unreadCount = response.data.reports.filter(report => !report.viewedByParent).length;

        return {
          success: true,
          data: { unreadCount },
        };
      }

      return { success: false, data: { unreadCount: 0 } };
    } catch (error) {
      console.error('❌ Error fetching unread count:', error);
      return { success: false, data: { unreadCount: 0 } };
    }
  }

  /**
   * Get recent reports (last 7 days)
   */
  async getRecentReports(limit = 5) {
    try {
      console.log(`🕒 Fetching recent reports (last 7 days)`);

      const response = await api.get(`/assessment/reports/summary`);

      if (response.data.success) {
        return {
          success: true,
          data: {
            reports: response.data.data.recentReports || [],
          },
        };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching recent reports:', error);
      throw error;
    }
  }

  /**
   * Get reports statistics for analytics
   */
  async getReportsStatistics() {
    try {
      console.log(`📈 Fetching reports statistics`);

      const response = await api.get('/assessment/reports/summary');

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data.summary || {},
        };
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching reports statistics:', error);
      throw error;
    }
  }

  /**
   * Search reports by title or content
   */
  async searchReports(searchTerm, options = {}) {
    try {
      console.log(`🔍 Searching reports for: "${searchTerm}"`);

      const params = new URLSearchParams();
      params.append('search', searchTerm);

      if (options.childId) params.append('childId', options.childId);
      if (options.reportType) params.append('reportType', options.reportType);
      if (options.priority) params.append('priority', options.priority);
      if (options.limit) params.append('limit', options.limit);

      const response = await api.get(`/assessment/reports/search?${params.toString()}`);

      console.log(`✅ Search completed:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error searching reports:', error);
      // If search endpoint doesn't exist, fall back to client-side filtering
      throw error;
    }
  }

  /**
   * Get reports filtered by date range
   */
  async getReportsByDateRange(startDate, endDate, options = {}) {
    try {
      console.log(`📅 Fetching reports from ${startDate} to ${endDate}`);

      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);

      if (options.childId) params.append('childId', options.childId);
      if (options.reportType) params.append('reportType', options.reportType);
      if (options.priority) params.append('priority', options.priority);
      if (options.limit) params.append('limit', options.limit);

      const response = await api.get(`/assessment/reports/date-range?${params.toString()}`);

      console.log(`✅ Date range reports fetched:`, response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching reports by date range:', error);
      throw error;
    }
  }

  /**
   * Batch mark multiple reports as viewed
   */
  async markMultipleAsViewed(reportIds) {
    try {
      console.log(`👀 Marking ${reportIds.length} reports as viewed`);

      const promises = reportIds.map(id => this.markReportAsViewed(id));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.length - successful;

      console.log(`✅ Marked ${successful} reports as viewed, ${failed} failed`);

      return {
        success: true,
        data: {
          successful,
          failed,
          total: results.length,
        },
      };
    } catch (error) {
      console.error('❌ Error marking multiple reports as viewed:', error);
      throw error;
    }
  }

  /**
   * Get report types available for filtering
   */
  getReportTypes() {
    return [
      { value: 'mini-report', label: 'Progress Updates' },
      { value: 'suite-progress-report', label: 'Assessment Suite Reports' },
      { value: 'comprehensive-assessment-report', label: 'Comprehensive Assessments' },
      { value: 'progress-alert-report', label: 'Progress Alerts' },
      { value: 'concern-alert-report', label: 'Attention Needed' },
      { value: 'weekly-summary', label: 'Weekly Summaries' },
      { value: 'monthly-summary', label: 'Monthly Summaries' },
      { value: 'quarterly-summary', label: 'Quarterly Summaries' },
    ];
  }

  /**
   * Get priority levels for filtering
   */
  getPriorityLevels() {
    return [
      { value: 'low', label: 'Low Priority' },
      { value: 'medium', label: 'Medium Priority' },
      { value: 'high', label: 'High Priority' },
      { value: 'critical', label: 'Critical Priority' },
    ];
  }

  /**
   * Format report data for display
   */
  formatReportForDisplay(report) {
    return {
      ...report,
      formattedDate: new Date(report.generatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      typeDisplay:
        this.getReportTypes().find(type => type.value === report.reportType)?.label ||
        report.reportType,
      priorityDisplay:
        this.getPriorityLevels().find(priority => priority.value === report.priority)?.label ||
        report.priority,
    };
  }
}

export default new ReportService();
