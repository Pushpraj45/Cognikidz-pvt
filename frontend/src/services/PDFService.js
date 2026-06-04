import api from './api';
import { toast } from 'react-toastify';

class PDFService {
  /**
   * Download article as PDF
   */
  async downloadArticlePDF(articleId, articleTitle) {
    try {
      toast.info('Generating article PDF...');

      const response = await api.get(`/api/pdf/article/${articleId}`, {
        responseType: 'blob',
      });

      this.handlePDFDownload(
        response,
        `${articleTitle.replace(/[^a-zA-Z0-9]/g, '-')}-cognikidz.pdf`
      );

      toast.success('Article PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading article PDF:', error);
      toast.error('Failed to generate article PDF. Please try again.');
      throw error;
    }
  }

  /**
   * Download child profile as PDF
   */
  async downloadChildProfilePDF(childId, childName) {
    try {
      toast.info('Generating child profile PDF...');

      const response = await api.get(`/api/pdf/child-profile/${childId}`, {
        responseType: 'blob',
      });

      this.handlePDFDownload(response, `${childName.replace(/\s+/g, '-')}-profile-cognikidz.pdf`);

      toast.success('Child profile PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading child profile PDF:', error);
      toast.error('Failed to generate child profile PDF. Please try again.');
      throw error;
    }
  }

  /**
   * Download dashboard progress as PDF
   */
  async downloadDashboardProgressPDF(childId = null) {
    try {
      toast.info('Generating progress report PDF...');

      const url = childId
        ? `/api/pdf/dashboard-progress?childId=${childId}`
        : '/api/pdf/dashboard-progress';

      const response = await api.get(url, {
        responseType: 'blob',
      });

      const fileName = `dashboard-progress-${new Date().toISOString().split('T')[0]}-cognikidz.pdf`;
      this.handlePDFDownload(response, fileName);

      toast.success('Progress report PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading progress PDF:', error);
      toast.error('Failed to generate progress report PDF. Please try again.');
      throw error;
    }
  }

  /**
   * Handle PDF blob download
   */
  handlePDFDownload(response, filename) {
    try {
      // Validate response
      if (!response.data) {
        throw new Error('No PDF data received');
      }

      // Check content type
      const contentType = response.headers['content-type'] || response.headers['Content-Type'];

      // Handle JSON error responses (when PDF generation fails)
      if (contentType && contentType.includes('application/json')) {
        // Try to parse JSON error response
        try {
          const text = new TextDecoder().decode(response.data);
          const errorData = JSON.parse(text);

          if (errorData.error && errorData.reportData) {
            // Download as JSON fallback
            const jsonFilename = filename.replace('.pdf', '.json');
            const jsonBlob = new Blob([text], { type: 'application/json' });
            const url = window.URL.createObjectURL(jsonBlob);

            const link = document.createElement('a');
            link.href = url;
            link.download = jsonFilename;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 100);

            toast.warning('PDF generation temporarily unavailable. Downloaded as JSON instead.');
            return;
          }
        } catch (parseError) {
          console.warn('Could not parse JSON error response:', parseError);
        }

        throw new Error('PDF service temporarily unavailable');
      }

      // Validate PDF content type
      if (contentType && !contentType.includes('application/pdf')) {
        console.warn('Unexpected content type:', contentType);
        throw new Error('Invalid PDF response');
      }

      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error handling PDF download:', error);
      throw new Error('Failed to download PDF file');
    }
  }

  /**
   * Download assessment report as PDF (enhanced version)
   */
  async downloadAssessmentReport(reportId, childName, onProgress) {
    try {
      // Call progress callback if provided
      if (onProgress) {
        onProgress({
          isLoading: true,
          message: 'Generating assessment report PDF...',
          progress: 0,
        });
      }

      const response = await api.get(`/api/pdf/assessment-report/${reportId}`, {
        responseType: 'blob',
        onDownloadProgress: progressEvent => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({
              isLoading: true,
              message: 'Generating assessment report PDF...',
              progress: Math.min(progress, 90), // Cap at 90% until complete
            });
          }
        },
      });

      // Update progress to processing
      if (onProgress) {
        onProgress({ isLoading: true, message: 'Processing PDF...', progress: 95 });
      }

      // Generate filename with clean child name
      let filename = `${childName.replace(/\s+/g, '-')}-assessment-report-cognikidz.pdf`;

      // Add timestamp if filename is generic
      if (
        childName.toLowerCase().includes('child') ||
        childName.toLowerCase().includes('assessment')
      ) {
        const timestamp = new Date().toISOString().split('T')[0];
        filename = `assessment-report-${timestamp}-cognikidz.pdf`;
      }

      this.handlePDFDownload(response, filename);

      // Complete progress
      if (onProgress) {
        onProgress({ isLoading: false, message: 'PDF generated successfully!', progress: 100 });
      }

      toast.success('Assessment report PDF downloaded successfully!');
    } catch (error) {
      console.error('Error downloading assessment report PDF:', error);

      // Update progress with error
      if (onProgress) {
        onProgress({
          isLoading: false,
          message: 'Failed to generate PDF',
          progress: 0,
          error: true,
        });
      }

      toast.error('Failed to generate assessment report PDF. Please try again.');
      throw error;
    }
  }

  /**
   * Preview PDF in new tab (optional feature)
   */
  async previewPDF(type, itemId, itemName) {
    try {
      let url;
      switch (type) {
        case 'article':
          url = `/api/pdf/article/${itemId}`;
          break;
        case 'child-profile':
          url = `/api/pdf/child-profile/${itemId}`;
          break;
        case 'dashboard-progress':
          url = itemId
            ? `/api/pdf/dashboard-progress?childId=${itemId}`
            : '/api/pdf/dashboard-progress';
          break;
        case 'assessment-report':
          url = `/api/pdf/assessment-report/${itemId}`;
          break;
        default:
          throw new Error('Invalid PDF type for preview');
      }

      // Open in new tab
      const fullUrl = `${api.defaults.baseURL}${url}`;
      window.open(fullUrl, '_blank');
    } catch (error) {
      console.error('Error previewing PDF:', error);
      toast.error('Failed to preview PDF. Please try downloading instead.');
      throw error;
    }
  }

  /**
   * Check if PDF generation is supported in current environment
   */
  isSupported() {
    try {
      // Check if we have blob support
      if (typeof Blob === 'undefined') {
        return false;
      }

      // Check if we can create object URLs
      if (typeof window.URL === 'undefined' || typeof window.URL.createObjectURL === 'undefined') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('PDF support check failed:', error);
      return false;
    }
  }

  /**
   * Get estimated generation time based on content type
   */
  getEstimatedTime(type) {
    const times = {
      article: '5-10 seconds',
      'child-profile': '3-5 seconds',
      'dashboard-progress': '10-15 seconds',
      'assessment-report': '3-5 seconds',
    };
    return times[type] || '5-10 seconds';
  }
}

export default new PDFService();
