import api from './api';

const ContactService = {
  // Submit a contact form
  async submitContact(contactData) {
    try {
      const response = await api.post('/api/contact', contactData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get all contact submissions (admin only)
  async getContacts(params = {}) {
    try {
      const response = await api.get('/api/contact', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get a single contact submission (admin only)
  async getContact(id) {
    try {
      const response = await api.get(`/api/contact/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update contact status (admin only)
  async updateContactStatus(id, status) {
    try {
      const response = await api.put(`/api/contact/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reply to a contact form submission (admin only)
  async replyToContact(id, message) {
    try {
      const response = await api.post(`/api/contact/${id}/reply`, { message });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default ContactService;
