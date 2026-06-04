import React, { useState, useEffect } from 'react';
import ChildSelector from './ChildSelector';
import { motion } from 'framer-motion';
import { CheckCircledIcon } from '@radix-ui/react-icons';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import TranslatedText from '../ui/TranslatedText';
import PricingCard from './PricingCard';

// Define specific assessments
const specificAssessmentTypes = [
  {
    id: 'adhd',
    title: 'ADHD Screening',
    description: 'Attention-Deficit/Hyperactivity Disorder assessment for children aged 4-17',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path
          d="M12 16.01C14.2091 16.01 16 14.2191 16 12.01C16 9.80087 14.2091 8.01001 12 8.01001C9.79086 8.01001 8 9.80087 8 12.01C8 14.2191 9.79086 16.01 12 16.01Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M3 12C3 10.1807 4.24892 6.29168 7 3C9.23005 6.3078 12.877 4.65779 15 3C19.6674 6.25309 21.0571 10.4308 21 12V15C21 18.5 19 21 12 21C5 21 3 18.5 3 15V12Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M12 8V4M12 8L14 6M12 8L10 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: 'text-primary',
    bgColor: 'bg-primary',
    iconBg: 'from-primary-600 to-primary',
    borderColor: 'border-primary/30',
    glassClass: 'glassmorphism-primary',
    bgGradient: 'from-primary-50 to-primary-100 dark:from-primary/20 dark:to-primary/10',
    subtitle: 'Attention & Focus',
    benefits: [
      'Based on Vanderbilt Assessment Scales & DSM-5 criteria',
      'Ages 4-17 years old',
      '15-20 minute completion time',
    ],
  },
  {
    id: 'autism',
    title: 'Autism Screening',
    description: 'Autism Spectrum Disorder screening for children aged 2-17',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path
          d="M14 19C17.771 19 19.657 19 20.828 17.828C22 16.657 22 14.771 22 11C22 7.229 22 5.343 20.828 4.172C19.657 3 17.771 3 14 3H10C6.229 3 4.343 3 3.172 4.172C2 5.343 2 7.229 2 11C2 14.771 2 16.657 3.172 17.828C4.343 19 6.229 19 10 19H14Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M12 19V22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 22H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M8 11V10C8 7.79086 9.79086 6 12 6V6C14.2091 6 16 7.79086 16 10V11"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M8 11C8.55228 11 9 11.4477 9 12C9 12.5523 8.55228 13 8 13C7.44772 13 7 12.5523 7 12C7 11.4477 7.44772 11 8 11Z"
          fill="currentColor"
        />
        <path
          d="M16 11C16.5523 11 17 11.4477 17 12C17 12.5523 16.5523 13 16 13C15.4477 13 15 12.5523 15 12C15 11.4477 15.4477 11 16 11Z"
          fill="currentColor"
        />
      </svg>
    ),
    color: 'text-secondary',
    bgColor: 'bg-secondary',
    iconBg: 'from-secondary-600 to-secondary',
    borderColor: 'border-secondary/30',
    glassClass: 'glassmorphism-secondary',
    bgGradient: 'from-secondary-50 to-secondary-100 dark:from-secondary/20 dark:to-secondary/10',
    subtitle: 'Social & Communication',
    benefits: [
      'Based on M-CHAT and CARS scales',
      'Ages 2-17 years old',
      '15-20 minute completion time',
    ],
  },
  {
    id: 'dyslexia',
    title: 'Dyslexia Screening',
    description: 'Reading and language processing assessment for children aged 5-17',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-8 h-8">
        <path
          d="M8 4H6.2C5.0799 4 4.51984 4 4.09202 4.21799C3.71569 4.40973 3.40973 4.71569 3.21799 5.09202C3 5.51984 3 6.0799 3 7.2V16.8C3 17.9201 3 18.4802 3.21799 18.908C3.40973 19.2843 3.71569 19.5903 4.09202 19.782C4.51984 20 5.0799 20 6.2 20H8M8 4C8 5.80688 8 6.71031 8.29065 7.44115C8.56668 8.12401 9.03766 8.71403 9.64112 9.1282C10.3111 9.585 11.2447 9.73344 13.112 10.0303L18.374 10.8301C19.6637 11.0213 20.3086 11.1169 20.8092 11.3485C21.2632 11.5602 21.6487 11.882 21.9321 12.2831C22.2501 12.7347 22.4065 13.3351 22.7194 14.5361C23.0323 15.737 23.0661 16.3911 22.9483 16.9514C22.8425 17.452 22.6166 17.9164 22.2915 18.2917C21.9279 18.7115 21.3585 18.9966 20.2196 19.5668L10.8642 24"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14 15L12 13M14 15L16 13M14 15V9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    color: 'text-accent',
    bgColor: 'bg-accent',
    iconBg: 'from-accent-600 to-accent',
    borderColor: 'border-accent/30',
    glassClass: 'glassmorphism-accent',
    bgGradient: 'from-accent-50 to-accent-100 dark:from-accent/20 dark:to-accent/10',
    subtitle: 'Reading & Language',
    benefits: [
      'Evaluates reading and spelling challenges',
      'Ages 5-17 years old',
      '15-20 minute completion time',
    ],
  },
];

// General assessment as a separate variable
const generalAssessment = {
  id: 'general',
  title: 'Comprehensive Multi-Disorder Screening',
  description:
    'Enhanced 7-question screening that evaluates ADHD, Autism, Dyslexia, and general developmental concerns to identify which areas may need further assessment',
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-10 h-10">
      <path
        d="M12 16.01C14.2091 16.01 16 14.2191 16 12.01C16 9.80087 14.2091 8.01001 12 8.01001C9.79086 8.01001 8 9.80087 8 12.01C8 14.2191 9.79086 16.01 12 16.01Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M3 12C3 10.1807 4.24892 6.29168 7 3C9.23005 6.3078 12.877 4.65779 15 3C19.6674 6.25309 21.0571 10.4308 21 12V15C21 18.5 19 21 12 21C5 21 3 18.5 3 15V12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ),
  features: [
    'Enhanced 15-question comprehensive screening',
    'Evaluates ADHD, Autism, Dyslexia, and general development',
    'Age-appropriate questions covering multiple disorder areas',
    'Cross-disorder risk analysis with specific percentages',
    'Identifies primary area of concern and secondary considerations',
    'Takes 20-35 minutes to complete',
    'Provides recommendations for further specialized assessments',
  ],
};

// Multimedia Assessment Technologies for Autism, ADHD, and Dyslexia
const multimediaAssessmentTypes = [
  {
    id: 'autism-multimedia',
    title: 'Autism Image Assessment',
    description:
      'Simple image comparison tasks to evaluate social understanding through positive and negative scenarios',
    subtitle: 'Image Comparison',
    ageRange: '3-16 years',
    duration: '20-35 minutes',
    type: 'multimedia',
    gradient: 'from-blue-500 to-indigo-600',
    hoverGradient: 'hover:from-blue-600 hover:to-indigo-700',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
    borderColor: 'border-blue-300/30',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500',
    iconBg: 'from-blue-600 to-indigo-600',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        className="w-8 h-8"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    features: ['Side-by-Side Image Comparison', 'Social Scenario Analysis'],
    benefits: ['Compare social scenarios', 'Quick 15-20 minute assessment'],
    assessmentMethods: ['Image comparison tasks', 'Social scenario analysis'],
  },
  // {
  //   id: 'adhd-multimedia',
  //   title: 'ADHD Image Assessment',
  //   description: 'Image-based attention and focus evaluation through visual comparison tasks',
  //   subtitle: 'Attention Analysis',
  //   ageRange: '5-17 years',
  //   duration: '15-20 minutes',
  //   type: 'multimedia',
  //   gradient: 'from-orange-500 to-red-500',
  //   hoverGradient: 'hover:from-orange-600 hover:to-red-600',
  //   bgGradient: 'from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20',
  //   borderColor: 'border-orange-300/30',
  //   color: 'text-orange-600',
  //   bgColor: 'bg-orange-500',
  //   iconBg: 'from-orange-600 to-red-500',
  //   icon: (
  //     <svg
  //       xmlns="http://www.w3.org/2000/svg"
  //       viewBox="0 0 24 24"
  //       fill="none"
  //       className="w-8 h-8"
  //       stroke="currentColor"
  //       strokeWidth="1.5"
  //     >
  //       <circle cx="12" cy="12" r="10" />
  //       <path d="M12 8v4l3 3" />
  //     </svg>
  //   ),
  //   features: ['Focus Comparison Tasks', 'Attention Pattern Analysis'],
  //   benefits: ['Evaluate attention patterns', 'Quick 15-20 minute assessment'],
  //   assessmentMethods: ['Attention comparison tasks', 'Focus pattern analysis'],
  // },
  // {
  //   id: 'dyslexia-multimedia',
  //   title: 'Dyslexia Image Assessment',
  //   description: 'Visual pattern and letter recognition tasks through image comparison exercises',
  //   subtitle: 'Pattern Recognition',
  //   ageRange: '6-16 years',
  //   duration: '15-20 minutes',
  //   type: 'multimedia',
  //   gradient: 'from-purple-500 to-pink-500',
  //   hoverGradient: 'hover:from-purple-600 hover:to-pink-600',
  //   bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
  //   borderColor: 'border-purple-300/30',
  //   color: 'text-purple-600',
  //   bgColor: 'bg-purple-500',
  //   iconBg: 'from-purple-600 to-pink-500',
  //   icon: (
  //     <svg
  //       xmlns="http://www.w3.org/2000/svg"
  //       viewBox="0 0 24 24"
  //       fill="none"
  //       className="w-8 h-8"
  //       stroke="currentColor"
  //       strokeWidth="1.5"
  //     >
  //       <path d="M4 7V4h16v3" />
  //       <path d="M9 20h6" />
  //       <path d="M12 4v16" />
  //     </svg>
  //   ),
  //   features: ['Letter Pattern Comparison', 'Visual Recognition Tasks'],
  //   benefits: ['Compare letter patterns', 'Quick 15-20 minute assessment'],
  //   assessmentMethods: ['Pattern comparison tasks', 'Letter recognition analysis'],
  // },
];

// Interactive Assessment Technologies
const interactiveAssessmentTypes = [
  {
    id: 'adhd-interactive',
    title: 'Interactive ADHD Games',
    description:
      'Engage in dynamic, attention-focused games designed to assess and improve focus, impulse control, and executive functioning through interactive challenges and real-time feedback',
    subtitle: 'Focus & Attention Training',
    ageRange: '5-17 years',
    duration: '20-25 minutes',
    type: 'interactive',
    icon: (
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg transform rotate-45 animate-pulse-gentle"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-full animate-ping"></div>
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-bounce-soft"></div>
      </div>
    ),
    features: [
      '8 attention-focused games',
      'Real-time performance tracking',
      'Adaptive difficulty system',
      'Executive function assessment',
    ],
    benefits: [
      'Improves focus and concentration',
      'Builds impulse control skills',
      'Enhances working memory',
      'Provides detailed attention analytics',
    ],
    assessmentMethods: [
      'Sustained attention tasks',
      'Response inhibition games',
      'Working memory challenges',
      'Executive function evaluation',
    ],
    preview: (
      <div className="relative w-full h-64 rounded-lg overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
            alt="ADHD Focus Games"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 to-red-900/90"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 animate-pulse-slow"></div>

        {/* Floating attention elements */}
        <div className="absolute top-4 left-4 w-24 h-24 bg-white/10 rounded-lg backdrop-blur-sm animate-float">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
        </div>

        <div
          className="absolute top-8 right-8 w-20 h-20 bg-white/10 rounded-lg backdrop-blur-sm animate-float"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2v20M2 12h20" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-8 w-20 h-20 bg-white/10 rounded-lg backdrop-blur-sm animate-float"
          style={{ animationDelay: '1s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
            </svg>
          </div>
        </div>

        <div
          className="absolute bottom-4 right-4 w-24 h-24 bg-white/10 rounded-lg backdrop-blur-sm animate-float"
          style={{ animationDelay: '1.5s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        {/* Game stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-yellow-400 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                </svg>
                <span className="text-white text-sm">8 Games</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-yellow-400 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white text-sm">20-25 min</span>
              </div>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-yellow-400 mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-white text-sm">5-17 years</span>
            </div>
          </div>
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'dyslexia-interactive',
    title: 'Interactive Dyslexia Games',
    description:
      'Engage in fun, game-based activities designed to assess and improve reading skills through interactive challenges and rewards',
    subtitle: 'Game-Based Learning & Assessment',
    ageRange: '6-16 years',
    duration: '25-30 minutes',
    type: 'interactive',
    icon: (
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg transform rotate-45 animate-pulse-gentle"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-gradient-to-br from-primary to-secondary rounded-full"></div>
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent rounded-full animate-bounce-soft"></div>
      </div>
    ),
    features: [
      '10 engaging educational games',
      'Real-time progress tracking',
      'Adaptive difficulty levels',
      'Interactive rewards system',
    ],
    benefits: [
      'Makes learning fun and engaging',
      'Provides immediate feedback',
      'Builds confidence through achievements',
      'Personalized learning experience',
    ],
    assessmentMethods: [
      'Game-based skill assessment',
      'Performance analytics',
      'Progress monitoring',
      'Skill development tracking',
    ],
    preview: (
      <div className="relative w-full h-64 rounded-lg overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80"
            alt="Educational Games"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/90 to-secondary-900/90"></div>
        </div>

        {/* Animated background elements */}
        <div className="absolute inset-0 bg-noise opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 animate-pulse-slow"></div>

        {/* Floating game elements */}
        <div className="absolute top-4 left-4 w-24 h-24 bg-white/10 rounded-lg backdrop-blur-sm animate-float">
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>

        <div
          className="absolute top-8 right-8 w-20 h-20 bg-white/10 rounded-lg backdrop-blur-sm animate-float"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2v20M2 12h20" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>
        </div>

        <div
          className="absolute bottom-8 left-8 w-20 h-20 bg-white/10 rounded-lg backdrop-blur-sm animate-float"
          style={{ animationDelay: '1s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
            </svg>
          </div>
        </div>

        <div
          className="absolute bottom-4 right-4 w-24 h-24 bg-white/10 rounded-lg backdrop-blur-sm animate-float"
          style={{ animationDelay: '1.5s' }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        {/* Game stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-accent mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                </svg>
                <span className="text-white text-sm">10 Games</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 text-accent mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-white text-sm">25-30 min</span>
              </div>
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-accent mr-1"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-white text-sm">6-16 years</span>
            </div>
          </div>
        </div>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

// Add tab state for disorder sections
const disorderTabs = [
  { id: 'autism', label: 'Autism' },
  { id: 'adhd', label: 'ADHD' },
  { id: 'dyslexia', label: 'Dyslexia' },
];

const DisorderSelector = ({ initialDisorderType }) => {
  const [selectedDisorderType, setSelectedDisorderType] = useState(null);
  const [showChildSelector, setShowChildSelector] = useState(false);
  const [activeTab, setActiveTab] = useState(initialDisorderType || 'autism');
  const navigate = useNavigate();

  // Update active tab when initialDisorderType changes
  useEffect(() => {
    if (initialDisorderType && ['autism', 'adhd', 'dyslexia'].includes(initialDisorderType)) {
      setActiveTab(initialDisorderType);
    }
  }, [initialDisorderType]);

  const handleAssessmentSelect = disorderType => {
    setSelectedDisorderType(disorderType);
    setShowChildSelector(true);
  };

  const handleCloseChildSelector = () => {
    setShowChildSelector(false);
    setSelectedDisorderType(null);
  };

  // Filter cards for each tab
  const getCardsForTab = tab => {
    if (tab === 'autism') {
      // Text-based autism (from specificAssessmentTypes)
      const textCard = specificAssessmentTypes.find(a => a.id === 'autism');
      // Image-based autism (from multimediaAssessmentTypes)
      const imageCard = multimediaAssessmentTypes.find(a => a.id.startsWith('autism'));
      return [textCard, imageCard];
    } else if (tab === 'adhd') {
      // Text-based ADHD (from specificAssessmentTypes)
      const textCard = specificAssessmentTypes.find(a => a.id === 'adhd');
      // Game-based ADHD (from interactiveAssessmentTypes)
      const gameCard = interactiveAssessmentTypes.find(a => a.id === 'adhd-interactive');
      return [textCard, gameCard];
    } else if (tab === 'dyslexia') {
      // Text-based Dyslexia (from specificAssessmentTypes)
      const textCard = specificAssessmentTypes.find(a => a.id === 'dyslexia');
      // Game-based Dyslexia (from interactiveAssessmentTypes)
      const gameCard = interactiveAssessmentTypes.find(a => a.id === 'dyslexia-interactive');
      return [textCard, gameCard];
    }
    return [];
  };

  return (
    <div className="min-h-screen pb-16 px-4 sm:px-6 gradient-bg">
      {/* Header Section */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center mb-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full pl-1 pr-4 py-1 shadow-lg hover:shadow-xl transition-all duration-300">
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center mr-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <span className="text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
            <TranslatedText>Assessment Tools</TranslatedText>
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
          <TranslatedText>Specialized</TranslatedText>{' '}
          <span className="animated-gradient-text">
            <TranslatedText>Assessment Tools</TranslatedText>
          </span>
        </h1>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
          <TranslatedText>
            Our scientifically-validated screening tools are designed to identify developmental
            differences early
          </TranslatedText>
        </p>
      </div>
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
          <div className="flex">
            {disorderTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
              >
                <TranslatedText>{tab.label}</TranslatedText>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Comprehensive Assessment Card (always at top) */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ y: -8, scale: 1.025 }}
            onClick={() => handleAssessmentSelect(generalAssessment.id)}
            className="group cursor-pointer transition-transform duration-300"
          >
            <div className="relative h-full mb-4 mx-auto max-w-5xl">
              {/* Animated border/glow on hover */}
              <div className="absolute -inset-1 rounded-2xl pointer-events-none z-0">
                <div className="w-full h-full rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-60 blur-md transition-opacity duration-500 animate-pulse-slow"></div>
              </div>
              <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden h-full shadow-md group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-300 border border-gray-100 dark:border-gray-700 group-hover:border-primary/60 dark:group-hover:border-primary/60 z-10">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary via-secondary to-accent"></div>
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="mb-4 sm:mb-0 sm:mr-6 relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/40 dark:to-secondary-900/40 w-16 h-16 rounded-full flex items-center justify-center text-primary shadow-colored-md animate-float z-10">
                        {generalAssessment.icon}
                      </div>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                        {generalAssessment.title}
                      </h3>
                      <p className="text-base text-gray-600 dark:text-gray-300 mb-3 max-w-2xl mx-auto sm:mx-0">
                        {generalAssessment.description}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {generalAssessment.features.slice(0, 3).map((feature, idx) => (
                          <div
                            key={idx}
                            className="flex items-center backdrop-blur-sm bg-white/40 dark:bg-gray-800/40 rounded-lg px-2 py-1 shadow-colored-xs group-hover:shadow-colored-sm transition-all duration-300"
                          >
                            <div className="h-4 w-4 mr-2 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
                              <svg
                                className="h-2.5 w-2.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-200">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-center sm:justify-start">
                        <div className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-base px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                          <span className="font-medium">
                            <TranslatedText>Start Assessment</TranslatedText>
                          </span>
                          <svg
                            className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        {/* Disorder-specific cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {getCardsForTab(activeTab).map(
            (assessment, index) =>
              assessment && (
                <motion.div
                  key={assessment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  onClick={() => handleAssessmentSelect(assessment.id)}
                  className="group cursor-pointer"
                >
                  <div className="relative h-full">
                    {/* Card glow effect on hover */}
                    <div
                      className={`absolute -inset-0.5 bg-gradient-to-r ${assessment.iconBg || assessment.gradient} rounded-2xl blur opacity-0 group-hover:opacity-70 transition duration-500 dark:group-hover:opacity-100`}
                    ></div>
                    <div
                      className={`relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden h-full shadow-md group-hover:shadow-colored-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 group-hover:${assessment.borderColor || ''} group-hover:border-primary/50 dark:group-hover:border-primary/50`}
                    >
                      {/* Top wave/decoration */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${assessment.iconBg || assessment.gradient}`}
                      ></div>
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="relative">
                            <div
                              className={`absolute inset-0 ${assessment.bgColor ? assessment.bgColor + '/20' : ''} rounded-full blur-md`}
                            ></div>
                            <div
                              className={`relative ${assessment.bgColor ? assessment.bgColor + '/10 dark:' + assessment.bgColor + '/20' : ''} w-16 h-16 rounded-full flex items-center justify-center z-10`}
                            >
                              <div className={assessment.color}>{assessment.icon}</div>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-text dark:text-white">
                              <TranslatedText>{assessment.title}</TranslatedText>
                            </h3>
                            {assessment.subtitle && (
                              <p className={`${assessment.color} text-sm`}>
                                <TranslatedText>{assessment.subtitle}</TranslatedText>
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-base text-gray-600 dark:text-gray-300 mb-5">
                          <TranslatedText>{assessment.description}</TranslatedText>
                        </p>
                        {assessment.benefits && (
                          <ul className="space-y-3 mb-6">
                            {assessment.benefits.map((benefit, idx) => (
                              <li key={idx} className="flex items-start">
                                <CheckCircledIcon
                                  className={`h-5 w-5 ${assessment.color} mt-0.5 mr-2 flex-shrink-0`}
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                  <TranslatedText>{benefit}</TranslatedText>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="mt-auto">
                          <div className="group inline-flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium text-base px-6 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                            <span className="font-medium">
                              <TranslatedText>Start Assessment</TranslatedText>
                            </span>
                            <svg
                              className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
          )}
        </div>

        {/* Pricing Card - Always visible */}
        <div className="max-w-5xl mx-auto mb-8">
          <PricingCard />
        </div>
      </div>
      {showChildSelector && (
        <ChildSelector onClose={handleCloseChildSelector} disorderType={selectedDisorderType} />
      )}
    </div>
  );
};

export default DisorderSelector;
