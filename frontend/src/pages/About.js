import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  AcademicCapIcon,
  BeakerIcon,
  ChartBarIcon,
  HeartIcon,
  BoltIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { RocketIcon } from '@radix-ui/react-icons';
import TranslatedText from '../components/ui/TranslatedText';
import { TranslatedButtonList } from '../components/ui/TranslatedList';

// Enhanced Glass morphism components with better effects
const GlassMorphism = ({ children, className = '', delay = 0, colorAccent = 'primary' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`glassmorphism-card rounded-xl shadow-colored-lg hover:shadow-colored-xl transition-all duration-300 hover:translate-y-[-2px] ${className}`}
  >
    <div className="relative">
      <div
        className={`absolute inset-0 bg-gradient-to-br from-${colorAccent}/3 to-transparent rounded-xl`}
      ></div>
      <div className="relative z-10">{children}</div>
    </div>
  </motion.div>
);

const ColoredGlassMorphism = ({
  children,
  className = '',
  delay = 0,
  fromColor = 'primary',
  toColor = 'purple',
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    className={`glassmorphism-card rounded-xl shadow-colored-lg hover:shadow-colored-xl transition-all duration-300 hover:translate-y-[-2px] border-${fromColor}/10 dark:border-${fromColor}/20 ${className}`}
  >
    <div className="relative">
      <div
        className={`absolute inset-0 bg-gradient-to-br from-${fromColor}/5 to-${toColor}/3 dark:from-${fromColor}/8 dark:to-${toColor}/5 rounded-xl`}
      ></div>
      <div className="relative z-10">{children}</div>
    </div>
  </motion.div>
);

const FloatingElement = ({ children, className = '', delay = 0, direction = 1 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: 1,
      y: [0, direction * 10, 0],
    }}
    transition={{
      duration: 0.7,
      delay,
      ease: [0.22, 1, 0.36, 1],
      y: {
        duration: 6,
        repeat: Infinity,
        repeatType: 'reverse',
        ease: 'easeInOut',
      },
    }}
    className={className}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-100px' }}
  >
    {children}
  </motion.div>
);

// Enhanced animated gradient text like in Blog page
const AnimatedGradientText = ({ children, className = '' }) => (
  <span
    className={`bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient bg-300% ${className}`}
  >
    {children}
  </span>
);

// Badge component like in Landing page
const Badge = ({ children, icon: Icon, className = '' }) => (
  <div
    className={`inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
  >
    <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
      <Icon className="h-4 w-4" />
    </span>
    <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
      {children}
    </span>
  </div>
);

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

const About = () => {
  // Team members data with translations
  const teamMembers = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Founder & Child Psychologist',
      bio: 'Dr. Johnson has over 15 years of experience in child psychology and development, specializing in early identification of learning differences.',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      color: 'primary',
    },
    {
      name: 'Michael Chen',
      role: 'Chief Technology Officer',
      bio: 'With a background in AI and educational technology, Michael leads our development team in creating accessible and effective assessment tools.',
      image:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      color: 'secondary',
    },
    {
      name: 'Emma Rodriguez',
      role: 'Educational Specialist',
      bio: 'Emma brings 10 years of classroom experience and a specialization in special education to help bridge clinical insights with practical applications.',
      image:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      color: 'accent',
    },
    {
      name: 'Dr. James Wilson',
      role: 'Research Director',
      bio: 'Leading our research initiatives, Dr. Wilson ensures all our assessment tools are based on the latest scientific evidence and best practices.',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80',
      color: 'primary',
    },
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background relative overflow-hidden">
      {/* Enhanced background decorations following Landing page pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 to-transparent opacity-60 dark:opacity-30"></div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-radial from-secondary/10 to-transparent rounded-full dark:from-secondary/5"></div>
        <div className="absolute bottom-40 left-20 w-[600px] h-[600px] bg-gradient-radial from-accent/10 to-transparent rounded-full dark:from-accent/5"></div>
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-gradient-radial from-primary/8 to-transparent rounded-full dark:from-primary/4"></div>

        {/* Decorative dots like in Landing page */}
        <div className="absolute top-[30%] left-[15%] w-3 h-3 bg-primary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[25%] right-[10%] w-2 h-2 bg-accent rounded-full animate-pulse-light"></div>
        <div className="absolute top-[80%] right-[30%] w-2 h-2 bg-secondary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[60%] left-[5%] w-2 h-2 bg-primary rounded-full animate-pulse-light"></div>
        <div className="absolute top-[45%] right-[8%] w-1.5 h-1.5 bg-accent rounded-full animate-pulse-light"></div>
        <div className="absolute top-[70%] left-[25%] w-1.5 h-1.5 bg-secondary rounded-full animate-pulse-light"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-24 pb-24 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-5xl mx-auto"
        >
          {/* Enhanced Hero Section */}
          <motion.div variants={slideIn} className="text-center mb-24">
            <Badge icon={SparklesIcon}>
              <TranslatedText>About Our Mission</TranslatedText>
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-8 leading-tight">
              <TranslatedText>About</TranslatedText>{' '}
              <AnimatedGradientText>CogniKidz</AnimatedGradientText>
            </h1>
            <motion.p
              className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <TranslatedText>
                Empowering parents with insights into their children's cognitive development through
                accessible, scientific assessment tools.
              </TranslatedText>
            </motion.p>
          </motion.div>

          {/* Enhanced Mission Statement */}
          <motion.div className="p-12 md:p-20 mb-24 rounded-2xl bg-gradient-to-br from-primary/10 via-blue-500/5 to-secondary/10 dark:from-primary/20 dark:via-blue-500/10 dark:to-secondary/20 border border-primary/20 dark:border-primary/30 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="lg:w-1/2 space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="bg-primary/20 dark:bg-primary/30 rounded-full p-4 text-primary dark:text-primary-300">
                    <RocketIcon className="h-10 w-10" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">
                    <TranslatedText>Our</TranslatedText>{' '}
                    <AnimatedGradientText>
                      <TranslatedText>Mission</TranslatedText>
                    </AnimatedGradientText>
                  </h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  <TranslatedText>
                    At CogniKidz, we believe every child deserves the opportunity to reach their
                    full potential. Our mission is to make early identification of learning
                    differences accessible to all families, regardless of location or resources.
                  </TranslatedText>
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  <TranslatedText>
                    Through our scientifically validated assessment tools, we aim to empower parents
                    with insights that can lead to earlier intervention, personalized support
                    strategies, and better outcomes for children with diverse learning needs.
                  </TranslatedText>
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  <TranslatedText>
                    We're committed to bridging the gap between clinical expertise and everyday
                    parenting, making it easier for families to understand and support their
                    children's unique cognitive profiles.
                  </TranslatedText>
                </p>
              </div>
              <FloatingElement className="lg:w-1/2" delay={0.3} direction={1}>
                <div className="relative">
                  <div className="absolute -inset-6 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-2xl blur-xl"></div>
                  <img
                    src="https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?q=80&w=800&auto=format&fit=crop"
                    alt="Child development and assessment"
                    className="rounded-xl shadow-2xl w-full h-auto relative z-10"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-xl z-20"></div>
                </div>
              </FloatingElement>
            </div>
          </motion.div>

          {/* Enhanced Our Story */}
          <motion.div className="mb-24" variants={slideIn}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <TranslatedText>Our</TranslatedText>{' '}
                <AnimatedGradientText>
                  <TranslatedText>Story</TranslatedText>
                </AnimatedGradientText>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                <TranslatedText>
                  Born from a college project that became a mission to transform child development
                </TranslatedText>
              </p>
            </div>
            <GlassMorphism className="p-10 md:p-16" delay={0.2} colorAccent="blue">
              <div className="space-y-6">
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  <TranslatedText>
                    CogniKidz began as an ambitious idea during a college project exhibition.
                    Pushpraj, then in his second year of college, saw an opportunity that others
                    overlooked. While his project exhibition group had this innovative concept for
                    child development assessment tools, nobody was ready to build it on a large
                    scale.
                  </TranslatedText>
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  <TranslatedText>
                    But Pushpraj knew this idea had the potential to make a real difference. He
                    shared his vision with his hostel mates - Devendra, Aman, and Tanjul. Together,
                    they saw what others couldn't the possibility of creating something that could
                    truly help families understand and support their children's development.
                  </TranslatedText>
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  <TranslatedText>
                    Devendra took on the challenge of developing the initial webpage, laying the
                    foundation for what would become our comprehensive platform. What started as a
                    college project has evolved into a mission-driven platform focused on helping
                    children reach their full potential.
                  </TranslatedText>
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                  <TranslatedText>
                    Today, we are working on managing child development data and finding innovative
                    ways to help bring out each child's unique potential. Our journey from a college
                    dormitory idea to a platform serving families reflects our commitment to making
                    child development assessment accessible, scientifically sound, and truly helpful
                    for parents everywhere.
                  </TranslatedText>
                </p>
              </div>
            </GlassMorphism>
          </motion.div>

          {/* Enhanced Our Values */}
          <motion.div className="mb-24" variants={slideIn}>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <TranslatedText>Our</TranslatedText>{' '}
                <AnimatedGradientText>
                  <TranslatedText>Values</TranslatedText>
                </AnimatedGradientText>
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                <TranslatedText>The principles that guide everything we do</TranslatedText>
              </p>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-10"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {[
                {
                  icon: BeakerIcon,
                  title: 'Scientific Excellence',
                  desc: 'All our tools are grounded in peer-reviewed research and validated with clinical rigor.',
                  color: 'primary',
                  gradient: 'from-blue-500 to-primary',
                },
                {
                  icon: HeartIcon,
                  title: 'Accessibility',
                  desc: "We're committed to making our tools available to families of all backgrounds and circumstances.",
                  color: 'secondary',
                  gradient: 'from-secondary to-green-500',
                },
                {
                  icon: BoltIcon,
                  title: 'Empowerment',
                  desc: 'We believe in giving parents actionable insights, not just data, empowering them to better support their children.',
                  color: 'accent',
                  gradient: 'from-accent to-orange-500',
                },
              ].map((value, index) => (
                <motion.div
                  key={index}
                  variants={slideIn}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group"
                >
                  <GlassMorphism className="p-8 text-center h-full" colorAccent={value.color}>
                    <div className="relative">
                      <div
                        className={`w-20 h-20 bg-gradient-to-br ${value.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-colored-md group-hover:shadow-colored-lg transition-all duration-300 group-hover:scale-110`}
                      >
                        <value.icon className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        <TranslatedText>{value.title}</TranslatedText>
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg leading-relaxed">
                        <TranslatedText>{value.desc}</TranslatedText>
                      </p>
                    </div>
                  </GlassMorphism>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Enhanced Team Section - COMMENTED OUT FOR NOW */}
          {/* 
          <motion.div className="mb-20" variants={slideIn}>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Meet Our <AnimatedGradientText>Team</AnimatedGradientText>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                Experts passionate about helping every child reach their potential
              </p>
            </div>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  variants={slideIn}
                  whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
                  className="group"
                >
                  <GlassMorphism className="overflow-hidden" colorAccent={member.color}>
                    <div className="flex flex-col sm:flex-row h-full">
                      <div className="sm:w-1/3 relative">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br from-${member.color}/30 to-${member.color}/10 mix-blend-overlay z-10`}
                        ></div>
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-48 sm:h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="sm:w-2/3 p-6 sm:p-8 flex flex-col justify-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {member.name}
                        </h3>
                        <p
                          className={`text-${member.color} dark:text-${member.color}-300 font-medium mb-4`}
                        >
                          {member.role}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  </GlassMorphism>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          */}

          {/* Enhanced CTA Section */}
          <motion.div
            className="p-10 md:p-16 text-center rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 dark:from-primary/20 dark:via-secondary/10 dark:to-accent/20 border border-primary/20 dark:border-primary/30 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="bg-primary/20 dark:bg-primary/30 rounded-full p-4 text-primary dark:text-primary-300">
                  <AcademicCapIcon className="h-10 w-10" />
                </div>
                <h2 className="text-4xl md:text-5xl font-bold">
                  Join Our <AnimatedGradientText>Mission</AnimatedGradientText>
                </h2>
              </div>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-12 leading-relaxed">
                Whether you're a parent seeking support, a professional in education or psychology,
                or someone passionate about helping children thrive, we invite you to join our
                community.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/support"
                    className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1 min-w-[220px]"
                  >
                    <span className="text-base sm:text-lg">Get in Touch</span>
                    <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup"
                    className="group inline-flex items-center gap-3 bg-white dark:bg-gray-800 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl font-semibold px-8 py-4 transition-all duration-300 hover:scale-105 hover:-translate-y-1 min-w-[220px]"
                  >
                    <span className="text-base sm:text-lg">Start Your Journey</span>
                    <SparklesIcon className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
