import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import MetaHead from '../components/ui/MetaHead';
import Container from '../components/ui/Container';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import ContactService from '../services/ContactService';
import { FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import LegalModal from '../components/ui/LegalModal';
import emailjs from '@emailjs/browser';
import TranslatedText from '../components/ui/TranslatedText';

// Icons
import {
  ShieldCheckIcon,
  DocumentTextIcon,
  CalendarIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Animation variants for contact form
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

const staggerChildren = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

// Glassmorphism component for contact form
const GlassMorphism = ({ children, className = '' }) => (
  <div
    className={`backdrop-blur-md bg-white/10 rounded-2xl shadow-xl border border-white/20 ${className}`}
  >
    {children}
  </div>
);

// Colored glassmorphism container
const ColoredGlassMorphism = ({ children, className = '', color = 'primary' }) => (
  <div className={`relative overflow-hidden rounded-2xl ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/20 backdrop-blur-md"></div>
    <div className="absolute inset-0 border border-white/20 rounded-2xl"></div>
    <div className="relative z-10">{children}</div>
  </div>
);

const Contact = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [contactRequests, setContactRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Legal modal state
  const [modalState, setModalState] = useState({ isOpen: false, type: null });

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    email: '',
    category: '',
    date_from: '',
    date_to: '',
  });

  // Add EmailJS configuration
  const [emailjsConfig] = useState({
    serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID, // Replace with your EmailJS service ID
    templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID, // Replace with your EmailJS template ID
    publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY, // Replace with your EmailJS public key
  });

  // Modal handlers
  const openModal = type => {
    setModalState({ isOpen: true, type });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null });
  };

  // Contact form handlers
  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateContactForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContactSubmit = async e => {
    e.preventDefault();
    if (!validateContactForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare template parameters
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_name: 'CogniKidz Support',
      };

      // Send email using EmailJS
      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey
      );

      // Handle success
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitError('There was an error submitting your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchContactRequests = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setError(null);

    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: 10,
      };

      const response = await ContactService.getContactRequests(params);
      setContactRequests(response.items || []);
      setTotalPages(response.total_pages || 1);
      setTotalRequests(response.total || 0);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      setError('Failed to load contact requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentPage, filters]);

  useEffect(() => {
    if (isAdmin) {
      fetchContactRequests();
    }
  }, [isAdmin, fetchContactRequests]);

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      email: '',
      category: '',
      date_from: '',
      date_to: '',
    });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      <MetaHead
        title="Contact Us - CogniKidz"
        description="Get in touch with our support team for help with assessments, questions about your child's development, or technical assistance."
      />

      {/* Background decorations matching other pages */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>

        {/* Decorative dots */}
        <div className="absolute top-[30%] left-[15%] w-3 h-3 bg-primary rounded-full"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full"></div>
        <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-secondary rounded-full"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 bg-primary rounded-full"></div>
      </div>

      <Container className="pt-24 pb-12 relative z-10">
        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center mb-6 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full pl-1 pr-4 py-1">
            <span className="bg-primary text-white dark:bg-primary/90 dark:text-white rounded-full w-6 h-6 flex items-center justify-center mr-2">
              <SparklesIcon className="h-3 w-3" />
            </span>
            <span className="text-primary dark:text-primary-300 text-sm font-medium">
              <TranslatedText>Expert Support Available</TranslatedText>
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-text dark:text-dark-text leading-tight">
            <TranslatedText>We're Here To</TranslatedText>{' '}
            <span className="animated-gradient-text">
              <TranslatedText>Support You</TranslatedText>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            <TranslatedText>
              Whether you have questions about assessments, need guidance on your child's
              development, or require technical support - our expert team is ready to help.
            </TranslatedText>
          </p>
        </motion.div>

        {/* Main Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16"
        >
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerChildren}
              className="text-center mb-12"
            >
              <motion.h2
                variants={fadeIn}
                className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
              >
                <TranslatedText>Get In Touch</TranslatedText>
              </motion.h2>
              <motion.p
                variants={fadeIn}
                className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto"
              >
                <TranslatedText>
                  Have questions or want to learn more about our programs? We'd love to hear from
                  you.
                </TranslatedText>
              </motion.p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              {/* Contact Form */}
              <motion.div variants={fadeIn} initial="hidden" animate="visible">
                <ColoredGlassMorphism className="overflow-hidden p-8">
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
                      >
                        <TranslatedText>Your Name</TranslatedText>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                          formErrors.name
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white backdrop-blur-sm`}
                        placeholder="John Doe"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
                      >
                        <TranslatedText>Email Address</TranslatedText>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                          formErrors.email
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white backdrop-blur-sm`}
                        placeholder="john@example.com"
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-900 dark:text-white mb-1"
                      >
                        <TranslatedText>Your Message</TranslatedText>
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleFormChange}
                        rows="5"
                        className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                          formErrors.message
                            ? 'border-red-500'
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white backdrop-blur-sm`}
                        placeholder="How can we help you?"
                      ></textarea>
                      {formErrors.message && (
                        <p className="mt-1 text-sm text-red-500">{formErrors.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`w-full py-3 px-6 text-white font-medium rounded-lg transition-all duration-300 
                        ${isSubmitting ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/50 transform hover:-translate-y-1'}`}
                    >
                      <TranslatedText>
                        {isSubmitting ? 'Sending...' : 'Send Message'}
                      </TranslatedText>
                    </button>

                    {submitSuccess && (
                      <div className="p-3 rounded-lg bg-green-500/20 border border-green-500 text-green-700 dark:text-green-200 text-sm">
                        Your message has been sent successfully! We'll get back to you soon.
                      </div>
                    )}

                    {submitError && (
                      <div className="p-3 rounded-lg bg-red-500/20 border border-red-500 text-red-700 dark:text-red-200 text-sm">
                        {submitError}
                      </div>
                    )}
                  </form>
                </ColoredGlassMorphism>
              </motion.div>

              {/* Contact Information */}
              <motion.div
                variants={staggerChildren}
                initial="hidden"
                animate="visible"
                className="space-y-8"
              >
                <motion.div variants={fadeIn}>
                  <GlassMorphism className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-lg">
                        <FaEnvelope className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          <TranslatedText>Email Us</TranslatedText>
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          <a
                            href="mailto:cognikidzcare@gmail.com"
                            className="hover:text-primary transition-colors"
                          >
                            cognikidzcare@gmail.com
                          </a>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <TranslatedText>We'll respond within 24 hours</TranslatedText>
                        </p>
                      </div>
                    </div>
                  </GlassMorphism>
                </motion.div>

                <motion.div variants={fadeIn}>
                  <GlassMorphism className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-lg">
                        <FaPhone className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          <TranslatedText>Call Us</TranslatedText>
                        </h3>
                        <div className="space-y-1">
                          <p className="text-gray-700 dark:text-gray-300">
                            <a
                              href="tel:+919893628469"
                              className="hover:text-primary transition-colors"
                            >
                              +91 7909830425
                            </a>
                          </p>
                          <p className="text-gray-700 dark:text-gray-300">
                            <a
                              href="tel:+917078016643"
                              className="hover:text-primary transition-colors"
                            >
                              +91 8519062601
                            </a>
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Available Monday to Friday, 9:00 AM - 6:00 PM IST
                        </p>
                      </div>
                    </div>
                  </GlassMorphism>
                </motion.div>

                <motion.div variants={fadeIn}>
                  <GlassMorphism className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="bg-gradient-to-br from-primary to-secondary p-3 rounded-lg">
                        <FaMapMarkerAlt className="text-white text-xl" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          Virtual Consultations
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300">
                          Online assessment platform
                          <br />
                          Serving families worldwide
                        </p>
                      </div>
                    </div>
                  </GlassMorphism>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Admin Contact Requests Section */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glassmorphism-card rounded-2xl p-8 mb-16"
          >
            <h2 className="text-3xl font-bold text-text dark:text-dark-text mb-6">
              Contact Requests
            </h2>

            {/* Filters */}
            <div className="glassmorphism-card rounded-xl p-6 mb-6">
              <h3 className="text-lg font-medium mb-4 text-text dark:text-dark-text">Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  id="email"
                  name="email"
                  label="Email"
                  placeholder="Search by email"
                  value={filters.email}
                  onChange={handleFilterChange}
                />

                <div className="space-y-2">
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-transparent border-gray-300 dark:border-gray-600 dark:bg-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md"
                  >
                    <option value="">All Categories</option>
                    <option value="General">General Inquiry</option>
                    <option value="Technical">Technical Support</option>
                    <option value="Billing">Billing Questions</option>
                    <option value="Feedback">Feedback</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <Input
                  id="date_from"
                  name="date_from"
                  type="date"
                  label="From Date"
                  value={filters.date_from}
                  onChange={handleFilterChange}
                />

                <Input
                  id="date_to"
                  name="date_to"
                  type="date"
                  label="To Date"
                  value={filters.date_to}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="flex justify-end mt-4 gap-3">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={fetchContactRequests}>Apply Filters</Button>
              </div>
            </div>

            {/* Results */}
            {error ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-700 dark:text-red-300 rounded-md p-4 my-4">
                {error}
              </div>
            ) : (
              <>
                <div className="glassmorphism-card rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50/80 dark:bg-gray-800/80">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 dark:bg-gray-900/50 divide-y divide-gray-200 dark:divide-gray-800">
                        {loading ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="px-4 py-4 text-center text-gray-500 dark:text-gray-400"
                            >
                              Loading contact requests...
                            </td>
                          </tr>
                        ) : contactRequests.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="px-4 py-4 text-center text-gray-500 dark:text-gray-400"
                            >
                              No contact requests found.
                            </td>
                          </tr>
                        ) : (
                          contactRequests.map(request => (
                            <tr
                              key={request.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {request.name}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {request.email}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700">
                                  {request.category}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {request.subject}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {new Date(request.submitted_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  onClick={() => {
                                    alert(`Message: ${request.message}`);
                                  }}
                                  className="text-primary dark:text-primary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 glassmorphism-card rounded-xl mt-4">
                    <div className="flex-1 flex justify-between items-center">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing <span className="font-medium">{contactRequests.length}</span> of{' '}
                        <span className="font-medium">{totalRequests}</span> results
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="flex items-center px-4 py-2 text-sm font-medium">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Privacy Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glassmorphism-card rounded-2xl p-8 mb-16"
        >
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/20 dark:bg-primary/30 rounded-full mx-auto mb-6">
              <ShieldCheckIcon className="w-8 h-8 text-primary dark:text-primary-300" />
            </div>
            <h2 className="text-3xl font-bold text-text dark:text-dark-text mb-6">
              Your Privacy Matters
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              At CogniKidz, we understand the sensitive nature of children's cognitive health data.
              We are committed to maintaining the highest standards of data security and privacy.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: <ShieldCheckIcon className="h-8 w-8 text-primary dark:text-primary-300" />,
                  title: 'Secure Data',
                  desc: 'All assessment data is encrypted and stored using industry-leading security protocols. Our platform undergoes regular security audits to ensure your information remains protected.',
                },
                {
                  icon: <DocumentTextIcon className="h-8 w-8 text-primary dark:text-primary-300" />,
                  title: 'HIPAA Compliant',
                  desc: 'Our platform and practices adhere to HIPAA guidelines, ensuring that all personal health information is handled with appropriate care and in compliance with regulations.',
                },
                {
                  icon: <CalendarIcon className="h-8 w-8 text-primary dark:text-primary-300" />,
                  title: 'Data Retention',
                  desc: "You control how long we keep your child's data. We offer options to download or delete your data at any time, and our default retention policies are designed to protect your privacy.",
                },
                {
                  icon: <DocumentTextIcon className="h-8 w-8 text-primary dark:text-primary-300" />,
                  title: 'Clear Policies',
                  desc: (
                    <>
                      Our{' '}
                      <button
                        onClick={() => openModal('privacy')}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        Privacy Policy
                      </button>{' '}
                      and{' '}
                      <button
                        onClick={() => openModal('terms')}
                        className="text-primary hover:underline cursor-pointer"
                      >
                        Terms of Service
                      </button>{' '}
                      are written in clear language, explaining exactly how we use your information
                      and what rights you have.
                    </>
                  ),
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="glassmorphism-card rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-primary/20 dark:bg-primary/30 rounded-full flex items-center justify-center">
                      {item.icon}
                    </div>
                    <h3 className="ml-3 text-xl font-medium text-text dark:text-dark-text">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Additional Resources Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-6 text-text dark:text-dark-text">
            Additional{' '}
            <span className="bg-gradient-diagonal from-primary via-secondary to-accent bg-clip-text text-transparent">
              Resources
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Looking for answers to common questions about our assessment tools, data privacy, or how
            to get started?
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="glassmorphism-card rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-primary/20 dark:bg-primary/30 rounded-full mx-auto mb-6">
                <QuestionMarkCircleIcon className="w-8 h-8 text-primary dark:text-primary-300" />
              </div>
              <h3 className="text-xl font-semibold text-text dark:text-dark-text mb-4">
                Frequently Asked Questions
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Find answers to the most common questions about our assessment tools, data privacy,
                and getting started.
              </p>
              <Button
                as={Link}
                to="/faq"
                variant="primary"
                className="shadow-colored-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300"
              >
                Visit FAQ Page
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="glassmorphism-card rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-secondary/20 dark:bg-secondary/30 rounded-full mx-auto mb-6">
                <BookOpenIcon className="w-8 h-8 text-secondary dark:text-secondary-300" />
              </div>
              <h3 className="text-xl font-semibold text-text dark:text-dark-text mb-4">
                Resource Library
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Access our collection of guides, research papers, and educational materials about
                child cognitive development.
              </p>
              <Button
                as={Link}
                to="/blog"
                variant="outline"
                className="hover:translate-y-[-2px] transition-all duration-300"
              >
                Explore Resources
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </Container>

      {/* Legal Modal */}
      <LegalModal isOpen={modalState.isOpen} onClose={closeModal} type={modalState.type} />
    </div>
  );
};

export default Contact;
