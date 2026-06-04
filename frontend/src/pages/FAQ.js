import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import MetaHead from '../components/ui/MetaHead';
import Button from '../components/ui/Button';
import Container from '../components/ui/Container';
import TranslatedText from '../components/ui/TranslatedText';
import { useAuth } from '../contexts/AuthContext';

// Icons
import {
  ChevronDownIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// FAQ data
const faqs = [
  {
    id: 1,
    question: 'How accurate are the screening assessments?',
    answer:
      'Our assessments are based on validated clinical screening tools with high sensitivity and specificity rates. However, they are designed as initial screening tools, not replacements for professional clinical evaluation. The results provide a starting point for discussion with healthcare providers.',
  },
  {
    id: 2,
    question: 'At what age can I assess my child?',
    answer:
      'Our screening tools are designed for children aged 2-17 years. Different assessments are calibrated for specific age ranges: ADHD (4-17 years), Autism Spectrum (2-17 years), and Dyslexia (5-17 years). The questions adapt based on the age you enter for your child.',
  },
  {
    id: 3,
    question: 'How long does an assessment take to complete?',
    answer:
      'Most assessments take 20-35 minutes to complete. You can save your progress and return later if needed. After submission, results are available immediately, and a detailed report is generated within 24 hours.',
  },
  {
    id: 4,
    question: "Are my child's data and assessment results private?",
    answer:
      'Yes, we take privacy very seriously. All data is encrypted and stored securely. Assessment results are only accessible to you through your password-protected account. We never share individual data with third parties without explicit consent. You can review our full privacy policy for more details.',
  },
  {
    id: 5,
    question: 'What happens after I receive the assessment results?',
    answer:
      "If the results indicate potential concerns, you'll receive a detailed report with next steps and resources tailored to your child's profile. This includes educational materials, local specialist recommendations, and support group information. We recommend sharing these results with your child's healthcare provider.",
  },
  {
    id: 6,
    question: 'Can I assess multiple children under one account?',
    answer:
      "Yes, you can add multiple child profiles to your parent account and complete separate assessments for each child. Each child's information and results are kept separate and organized in your dashboard.",
  },
  {
    id: 7,
    question: 'Do you offer assessments in languages other than English?',
    answer:
      "Currently, our assessments are available in English and Spanish. We're working to add more languages in the future. Please check our language settings in your account preferences.",
  },
  {
    id: 8,
    question: 'How often should I repeat an assessment?',
    answer:
      "For monitoring purposes, we recommend repeating assessments every 6-12 months or if you notice significant changes in behavior or development. The platform will remind you when it's time for a follow-up assessment.",
  },
];

const FAQ = () => {
  const [openItem, setOpenItem] = useState(null);

  const toggleItem = id => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      <MetaHead
        title="FAQ - CogniKidz"
        description="Find answers to common questions about CogniKidz early detection tools for ADHD, autism, and dyslexia."
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
        {/* Header Section */}
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
              <TranslatedText>Common Questions</TranslatedText>
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-text dark:text-dark-text leading-tight">
            <TranslatedText>Frequently Asked</TranslatedText>{' '}
            <span className="animated-gradient-text">
              <TranslatedText>Questions</TranslatedText>
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            <TranslatedText>
              Find answers to common questions about our platform and services. Get the information
              you need to start your child's developmental journey.
            </TranslatedText>
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glassmorphism-card rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]"
            >
              <button
                className={`flex justify-between items-center w-full px-6 py-5 text-left focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-inset transition-colors duration-300 ${
                  openItem === faq.id
                    ? 'text-primary dark:text-primary-300'
                    : 'text-text dark:text-dark-text hover:text-primary dark:hover:text-primary-300'
                }`}
                onClick={() => toggleItem(faq.id)}
                aria-expanded={openItem === faq.id}
              >
                <span className="text-lg font-semibold pr-4">
                  <TranslatedText>{faq.question}</TranslatedText>
                </span>
                <ChevronDownIcon
                  className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                    openItem === faq.id
                      ? 'transform rotate-180 text-primary dark:text-primary-300'
                      : 'text-gray-400 dark:text-gray-500'
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

        {/* Contact CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="glassmorphism-card rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/20 dark:bg-primary/30 rounded-full mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-primary dark:text-primary-300" />
            </div>
            <h3 className="text-2xl font-bold text-text dark:text-dark-text mb-4">
              <TranslatedText>Still have questions?</TranslatedText>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <TranslatedText>
                Our support team is here to help you every step of the way. Get personalized
                assistance for your child's developmental journey.
              </TranslatedText>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                as={Link}
                to="/contact"
                variant="primary"
                size="lg"
                className="shadow-colored-lg hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Contact Support
              </Button>
              <Button
                as={Link}
                to="/assessment"
                variant="outline"
                size="lg"
                className="hover:translate-y-[-2px] transition-all duration-300"
              >
                Start Assessment
              </Button>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
};

export default FAQ;
