import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import MetaHead from '../components/ui/MetaHead';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import Input from '../components/ui/Input';
import emailjs from '@emailjs/browser';
import { useToast } from '../contexts/ToastContext';
import TranslatedText from '../components/ui/TranslatedText';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

// Icons
import {
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  HeartIcon,
  BoltIcon,
  BeakerIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

// Minimized FAQ data
const faqs = [
  {
    id: 1,
    question: 'How accurate are the assessments?',
    answer:
      'Our assessments use validated clinical screening tools with high accuracy rates. They provide initial insights to discuss with healthcare providers.',
  },
  {
    id: 2,
    question: 'What age range is supported?',
    answer:
      'We support children aged 2-17 years. Different assessments are calibrated for specific age ranges based on developmental milestones.',
  },
  {
    id: 3,
    question: 'How long does an assessment take?',
    answer:
      'Most assessments take 20-35 minutes. You can save progress and return later. Results are available immediately.',
  },
  {
    id: 4,
    question: 'Is my data private and secure?',
    answer:
      'Yes, all data is encrypted and stored securely. Only you can access your results through your password-protected account.',
  },
  {
    id: 5,
    question: 'Can I assess multiple children?',
    answer:
      'Yes, you can add multiple child profiles and complete separate assessments for each child under one parent account.',
  },
];

const Support = () => {
  const [openItem, setOpenItem] = useState(null);
  const [activeTab, setActiveTab] = useState('faq');
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  // Contact form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleItem = id => {
    setOpenItem(openItem === id ? null : id);
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const templateParams = {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        time: new Date().toLocaleString(),
        to_name: 'CogniKidz Support',
      };

      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
        templateParams,
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY
      );

      success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error sending email:', error);
      showError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { t } = useTranslation('support');

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      <MetaHead
        title="Support & FAQ - CogniKidz"
        description="Get help and find answers to common questions about CogniKidz assessments."
      />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
      </div>

      <Container className="pt-24 pb-12 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
              <SparklesIcon className="h-4 w-4" />
            </span>
            <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold">
              {t('header.badge')}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-text dark:text-dark-text leading-tight">
            {t('header.title_lead') + ' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
              {t('header.title_highlight')}
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('header.subtitle')}
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="flex">
              <button
                onClick={() => setActiveTab('faq')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'faq'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {t('tabs.faq')}
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'contact'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {t('tabs.contact')}
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === 'about'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                {t('tabs.about')}
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        {activeTab === 'faq' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
                >
                  <button
                    className={`flex justify-between items-center w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/60 transition-colors duration-300 ${
                      openItem === faq.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-text dark:text-dark-text hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={openItem === faq.id}
                  >
                    <span className="text-lg font-semibold pr-4">
                      <TranslatedText>{faq.question}</TranslatedText>
                    </span>
                    <ChevronDownIcon
                      className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                        openItem === faq.id ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: openItem === faq.id ? 'auto' : 0,
                      opacity: openItem === faq.id ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5">
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        <TranslatedText>{faq.answer}</TranslatedText>
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-2xl font-bold text-text dark:text-dark-text mb-6">
                  {t('contact.send_us')}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    label={t('contact.name')}
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    error={formErrors.name}
                    required
                  />
                  <Input
                    label={t('contact.email')}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    error={formErrors.email}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('contact.message')}
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="How can we help you?"
                      required
                    />
                    {formErrors.message && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.message}</p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {t('contact.send')}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-2xl font-bold text-text dark:text-dark-text mb-6">
                  {t('contact.get_in_touch')}
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-text dark:text-dark-text">
                        {t('contact.email_label')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">cognikidzcare@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <PhoneIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-text dark:text-dark-text">
                        {t('contact.phone_label')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">+91 7909830425</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <MapPinIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-text dark:text-dark-text">
                        {t('contact.office_label')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        Bhopal, Madhya Pradesh, 462001
                        <br />
                        India
                      </p>
                    </div>
                  </div>

                  <div className="pt-6">
                    <h4 className="text-lg font-medium text-text dark:text-dark-text mb-3">
                      {t('contact.response_time')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">{t('contact.response_copy')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* About Section */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto"
          >
            <div className="space-y-12">
              {/* Hero Section */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
                    <SparklesIcon className="h-4 w-4" />
                  </span>
                  <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
                    <TranslatedText>About Our Mission</TranslatedText>
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  <TranslatedText>About</TranslatedText>{' '}
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300%">
                    CogniKidz
                  </span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                  <TranslatedText>
                    Empowering parents with insights into their children's cognitive development
                    through accessible, scientific assessment tools.
                  </TranslatedText>
                </p>
              </div>

              {/* Mission Statement */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-600/20 dark:from-blue-500/30 dark:to-purple-600/30 rounded-full p-4">
                    <SparklesIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-text dark:text-dark-text">
                    <TranslatedText>Our Mission</TranslatedText>
                  </h3>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    <TranslatedText>
                      At CogniKidz, we believe every child deserves the opportunity to reach their
                      full potential. Our mission is to make early identification of learning
                      differences accessible to all families, regardless of location or resources.
                    </TranslatedText>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    <TranslatedText>
                      Through our scientifically validated assessment tools, we aim to empower
                      parents with insights that can lead to earlier intervention, personalized
                      support strategies, and better outcomes for children with diverse learning
                      needs.
                    </TranslatedText>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    <TranslatedText>
                      We're committed to bridging the gap between clinical expertise and everyday
                      parenting, making it easier for families to understand and support their
                      children's unique cognitive profiles.
                    </TranslatedText>
                  </p>
                </div>
              </div>

              {/* Our Story */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-text dark:text-dark-text mb-4">
                    <TranslatedText>Our Story</TranslatedText>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    <TranslatedText>
                      Born from a college project that became a mission to transform child
                      development
                    </TranslatedText>
                  </p>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    <TranslatedText>
                      CogniKidz began as an ambitious idea during a college project exhibition.
                      Pushpraj, then in his second year of college, saw an opportunity that others
                      overlooked. While his project exhibition group had this innovative concept for
                      child development assessment tools, nobody was ready to build it on a large
                      scale.
                    </TranslatedText>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    <TranslatedText>
                      But Pushpraj knew this idea had the potential to make a real difference. He
                      shared his vision with his hostel mates - Devendra, Aman, and Tanjul.
                      Together, they saw what others couldn't the possibility of creating something
                      that could truly help families understand and support their children's
                      development.
                    </TranslatedText>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    <TranslatedText>
                      Devendra took on the challenge of developing the initial webpage, laying the
                      foundation for what would become our comprehensive platform. What started as a
                      college project has evolved into a mission-driven platform focused on helping
                      children reach their full potential.
                    </TranslatedText>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    <TranslatedText>
                      Today, we are working on managing child development data and finding
                      innovative ways to help bring out each child's unique potential. Our journey
                      from a college dormitory idea to a platform serving families reflects our
                      commitment to making child development assessment accessible, scientifically
                      sound, and truly helpful for parents everywhere.
                    </TranslatedText>
                  </p>
                </div>
              </div>

              {/* Our Values */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-text dark:text-dark-text mb-4">
                    <TranslatedText>Our Values</TranslatedText>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    <TranslatedText>The principles that guide everything we do</TranslatedText>
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 dark:from-blue-500/30 dark:to-blue-600/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <BeakerIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-text dark:text-dark-text mb-3">
                      <TranslatedText>Scientific Excellence</TranslatedText>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      <TranslatedText>
                        All our tools are grounded in peer-reviewed research and validated with
                        clinical rigor.
                      </TranslatedText>
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 dark:from-green-500/30 dark:to-green-600/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <HeartIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-text dark:text-dark-text mb-3">
                      <TranslatedText>Accessibility</TranslatedText>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      <TranslatedText>
                        We're committed to making our tools available to families of all backgrounds
                        and circumstances.
                      </TranslatedText>
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 dark:from-orange-500/30 dark:to-orange-600/30 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <BoltIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h4 className="text-xl font-semibold text-text dark:text-dark-text mb-3">
                      <TranslatedText>Empowerment</TranslatedText>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      <TranslatedText>
                        We believe in giving parents actionable insights, not just data, empowering
                        them to better support their children.
                      </TranslatedText>
                    </p>
                  </div>
                </div>
              </div>

              {/* What We Do */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 dark:from-green-500/30 dark:to-emerald-600/30 rounded-full p-4">
                    <AcademicCapIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-text dark:text-dark-text">
                    <TranslatedText>What We Do</TranslatedText>
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-text dark:text-dark-text mb-3">
                      <TranslatedText>Early Detection</TranslatedText>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      <TranslatedText>
                        We provide scientifically validated screening tools for ADHD, Autism, and
                        Dyslexia, helping parents identify potential learning differences early.
                      </TranslatedText>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-text dark:text-dark-text mb-3">
                      <TranslatedText>Personalized Insights</TranslatedText>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      <TranslatedText>
                        Our AI-powered assessments provide detailed reports with actionable
                        recommendations tailored to each child's unique profile.
                      </TranslatedText>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-text dark:text-dark-text mb-3">
                      <TranslatedText>Expert Guidance</TranslatedText>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      <TranslatedText>
                        We bridge the gap between clinical expertise and everyday parenting, making
                        professional insights accessible to all families.
                      </TranslatedText>
                    </p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-text dark:text-dark-text mb-3">
                      <TranslatedText>Ongoing Support</TranslatedText>
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      <TranslatedText>
                        Beyond assessments, we provide resources, articles, and support to help
                        families navigate their child's developmental journey.
                      </TranslatedText>
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA Section */}
              <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 dark:from-primary/20 dark:via-secondary/10 dark:to-accent/20 border border-primary/20 dark:border-primary/30 rounded-2xl p-10 text-center shadow-xl">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="bg-primary/20 dark:bg-primary/30 rounded-full p-4 text-primary dark:text-primary-300">
                      <AcademicCapIcon className="h-8 w-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-text dark:text-dark-text">
                      Join Our{' '}
                      <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                        Mission
                      </span>
                    </h3>
                  </div>
                  <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                    <TranslatedText>
                      Whether you're a parent seeking support, a professional in education or
                      psychology, or someone passionate about helping children thrive, we invite you
                      to join our community.
                    </TranslatedText>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                      to="/signup"
                      className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 min-w-[220px]"
                    >
                      <span className="text-lg">{t('about.cta.header')}</span>
                      <SparklesIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                    </Link>
                    <Link
                      to="/assessment"
                      className="group inline-flex items-center gap-3 bg-white dark:bg-gray-800 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl font-semibold px-8 py-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1 min-w-[220px]"
                    >
                      <span className="text-lg">{t('about.cta.start_assessment')}</span>
                      <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </Container>
    </div>
  );
};

export default Support;
