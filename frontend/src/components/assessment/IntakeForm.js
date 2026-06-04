import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { AssessmentLoader } from '../ui/LogoLoader';
import { LanguageContext } from '../../contexts/LanguageContext';

/**
 * IntakeForm Component
 *
 * A multi-step form that collects all required information before starting an assessment.
 * The form is divided into sections for better user experience.
 */
const IntakeForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { language } = useContext(LanguageContext);

  // Form state management
  const [currentStep, setCurrentStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingAssessment, setIsStartingAssessment] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Basic Demographics
    childName: '',
    age: '',
    gender: '',
    grade: '',
    schoolName: '',

    // Parent/Guardian Details
    parentName: '',
    parentEmail: '',
    parentPhone: '',

    // Primary Concerns & History
    primaryConcerns: '',
    previousAssessments: false,
    familyHistory: {
      has: false,
      details: '',
    },

    // Developmental & Medical History
    milestoneDelays: {
      walking: '',
      talking: '',
      toiletTraining: '',
    },
    speechMilestones: {
      firstWords: '',
      sentences: '',
    },
    sensorySensitivities: [],
    medicalConditions: '',
    priorTherapies: [],

    // Behavioral & Social Functioning
    attentionLevel: 3,
    emotionRegulation: '',
    peerInteraction: '',
    routineTransitions: '',

    // Cognitive & Academic Skills
    readingLevel: '',
    mathDifficulties: '',
    memoryDirections: '',

    // Strengths & Interests
    areasOfStrength: '',
    motivators: '',

    // Environment & Lifestyle
    homeEnvironment: '',
    screenTime: '',

    // Consent & Logistics
    dataConsent: false,
    contactMethod: '',
    sessionPreference: '',
  });

  // Handle input changes
  const handleChange = e => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      // Handle nested objects like milestoneDelays.walking
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle multi-select changes
  const handleMultiSelect = (name, value) => {
    setFormData(prev => {
      const currentValues = [...prev[name]];

      if (currentValues.includes(value)) {
        return {
          ...prev,
          [name]: currentValues.filter(item => item !== value),
        };
      } else {
        return {
          ...prev,
          [name]: [...currentValues, value],
        };
      }
    });
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();

    // Validation
    if (!formData.childName || !formData.age || !formData.parentName || !formData.parentEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.dataConsent) {
      toast.error('You must consent to data processing to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Submitting intake data:', formData);

      // API call to save intake data
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for CORS with credentials
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log('Intake submission response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error saving intake data');
      }

      // Store the intake ID for starting the assessment
      setFormData(prev => ({
        ...prev,
        intakeId: data.intake?._id || data.intakeId || data._id,
      }));

      // Success
      setSaved(true);

      // If onSuccess callback provided, call it with the response data
      if (onSuccess) {
        onSuccess(data);
      }

      toast.success('Information saved successfully!');
    } catch (error) {
      console.error('Error saving intake data:', error);
      toast.error(error.message || 'Error saving information. Please try again.');

      // Additional error handling attempts
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        toast.error('Network connection issue. Please check your internet connection.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start assessment with saved data
  const handleStartAssessment = async () => {
    if (isStartingAssessment) return;

    setIsStartingAssessment(true);
    try {
      if (!formData.intakeId) {
        console.error('No intake ID available to start assessment');
        toast.error('Missing intake information. Please try again.');
        return;
      }

      console.log(
        'Starting assessment with intake ID:',
        formData.intakeId,
        'and language:',
        language
      );

      // 🔍 DEBUG: Log language parameter flow from frontend IntakeForm
      console.log('🔍 [LANGUAGE DEBUG] Frontend IntakeForm Language Flow:', {
        component: 'IntakeForm',
        intakeId: formData.intakeId,
        contextLanguage: language,
        languageType: typeof language,
        languageUndefined: language === undefined,
        languageNull: language === null,
        formDataKeys: Object.keys(formData),
        hasLanguageInFormData: 'language' in formData,
        formDataLanguage: formData.language,
        languageContextValue: language,
        localStorageLanguage: localStorage.getItem('cognikidz_language'),
        navigatorLanguage: navigator.language,
        navigatorLanguages: navigator.languages
      });

      // Add a brief delay to show the loader
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Navigate directly to assessment page with intake ID and language
      // The assessment page will handle the API call to start the actual assessment
      navigate('/assessment', {
        state: {
          intakeId: formData.intakeId,
          language: language, // Pass language to assessment page
        },
        search: `?intakeId=${formData.intakeId}&language=${language}`,
      });

      toast.success('Starting your assessment...');
    } catch (error) {
      console.error('Error starting assessment:', error);
      toast.error(error.message || 'Unable to start assessment. Please try again.');
    } finally {
      setIsStartingAssessment(false);
    }
  };

  // Navigate between form steps
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 9));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">Assessment Intake Form</h1>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(step => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`w-8 h-8 rounded-full ${
                step === currentStep
                  ? 'bg-blue-600 text-white'
                  : step < currentStep
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 9) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Basic Demographics */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Basic Demographics</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Child's Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="childName"
                value={formData.childName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="0"
                max="18"
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not-to-say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Current Grade</label>
              <input
                type="text"
                name="grade"
                value={formData.grade}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">School Name</label>
              <input
                type="text"
                name="schoolName"
                value={formData.schoolName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        {/* Step 2: Parent/Guardian Details */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Parent/Guardian Details</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Parent/Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Parent/Guardian Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="parentEmail"
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Parent/Guardian Phone</label>
              <input
                type="tel"
                name="parentPhone"
                value={formData.parentPhone}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        {/* Step 3: Primary Concerns & History */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Primary Concerns & History</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">Primary Concerns / Observations</label>
              <textarea
                name="primaryConcerns"
                value={formData.primaryConcerns}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border rounded"
                placeholder="Please describe your main concerns or observations about your child's development, learning, or behavior"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="flex items-center mb-2 font-medium">
                <input
                  type="checkbox"
                  name="previousAssessments"
                  checked={formData.previousAssessments}
                  onChange={handleChange}
                  className="mr-2"
                />
                Previous Assessments Completed
              </label>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Family History of ADHD/Autism/Dyslexia
              </label>
              <div className="space-y-2 ml-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="familyHistory.has"
                    checked={formData.familyHistory.has === true}
                    onChange={() =>
                      setFormData(prev => ({
                        ...prev,
                        familyHistory: { ...prev.familyHistory, has: true },
                      }))
                    }
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="familyHistory.has"
                    checked={formData.familyHistory.has === false}
                    onChange={() =>
                      setFormData(prev => ({
                        ...prev,
                        familyHistory: { ...prev.familyHistory, has: false },
                      }))
                    }
                    className="mr-2"
                  />
                  No
                </label>
              </div>

              {formData.familyHistory.has && (
                <div className="mt-2">
                  <label className="block mb-2 font-medium">Details</label>
                  <textarea
                    name="familyHistory.details"
                    value={formData.familyHistory.details}
                    onChange={handleChange}
                    rows="3"
                    className="w-full p-2 border rounded"
                    placeholder="Please provide details about family history"
                  ></textarea>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Developmental & Medical History */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Developmental & Medical History</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">Milestone Delays (age in months)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block mb-1 text-sm">Walking</label>
                  <input
                    type="number"
                    name="milestoneDelays.walking"
                    value={formData.milestoneDelays.walking}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-2 border rounded"
                    placeholder="Months"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Talking</label>
                  <input
                    type="number"
                    name="milestoneDelays.talking"
                    value={formData.milestoneDelays.talking}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-2 border rounded"
                    placeholder="Months"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Toilet Training</label>
                  <input
                    type="number"
                    name="milestoneDelays.toiletTraining"
                    value={formData.milestoneDelays.toiletTraining}
                    onChange={handleChange}
                    min="0"
                    className="w-full p-2 border rounded"
                    placeholder="Months"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Speech & Language Milestones</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm">First Words (age)</label>
                  <input
                    type="text"
                    name="speechMilestones.firstWords"
                    value={formData.speechMilestones.firstWords}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm">Sentences (age)</label>
                  <input
                    type="text"
                    name="speechMilestones.sentences"
                    value={formData.speechMilestones.sentences}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Sensory Sensitivities</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {['Sounds', 'Touch', 'Taste', 'Smells', 'Visual', 'Movement'].map(sensitivity => (
                  <label key={sensitivity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sensorySensitivities.includes(sensitivity)}
                      onChange={() => handleMultiSelect('sensorySensitivities', sensitivity)}
                      className="mr-2"
                    />
                    {sensitivity}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Medical Conditions & Medications</label>
              <textarea
                name="medicalConditions"
                value={formData.medicalConditions}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded"
                placeholder="List any diagnosed conditions and current medications"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Prior Therapies/Interventions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  'Speech Therapy',
                  'Occupational Therapy',
                  'Physical Therapy',
                  'Behavioral Therapy',
                  'Psychological Support',
                  'Educational Support',
                ].map(therapy => (
                  <label key={therapy} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.priorTherapies.includes(therapy)}
                      onChange={() => handleMultiSelect('priorTherapies', therapy)}
                      className="mr-2"
                    />
                    {therapy}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Behavioral & Social Functioning */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Behavioral & Social Functioning</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">Attention & Activity Level (1-5)</label>
              <div className="flex items-center space-x-2">
                <span>Low 1</span>
                <input
                  type="range"
                  name="attentionLevel"
                  value={formData.attentionLevel}
                  onChange={handleChange}
                  min="1"
                  max="5"
                  className="flex-grow"
                />
                <span>5 High</span>
              </div>
              <div className="text-center mt-1">{formData.attentionLevel}</div>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Emotion Regulation</label>
              <div className="space-y-2">
                {['Excellent', 'Good', 'Average', 'Challenging', 'Very Difficult'].map(level => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="emotionRegulation"
                      value={level}
                      checked={formData.emotionRegulation === level}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Peer Interaction</label>
              <div className="space-y-2">
                {[
                  'Very Social',
                  'Somewhat Social',
                  'Neutral',
                  'Somewhat Isolated',
                  'Very Isolated',
                ].map(level => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="peerInteraction"
                      value={level}
                      checked={formData.peerInteraction === level}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Routine & Transitions</label>
              <div className="space-y-2">
                {[
                  'Handles Easily',
                  'Minor Difficulty',
                  'Moderate Difficulty',
                  'Significant Difficulty',
                  'Extreme Difficulty',
                ].map(level => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="routineTransitions"
                      value={level}
                      checked={formData.routineTransitions === level}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Cognitive & Academic Skills */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Cognitive & Academic Skills</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">Reading & Writing Level</label>
              <select
                name="readingLevel"
                value={formData.readingLevel}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Level</option>
                <option value="Above Grade Level">Above Grade Level</option>
                <option value="At Grade Level">At Grade Level</option>
                <option value="Slightly Below Grade Level">Slightly Below Grade Level</option>
                <option value="Significantly Below Grade Level">
                  Significantly Below Grade Level
                </option>
                <option value="Not Applicable">Not Applicable</option>
              </select>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Math & Problem-Solving Difficulties</label>
              <textarea
                name="mathDifficulties"
                value={formData.mathDifficulties}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded"
                placeholder="Describe any challenges with math, counting, or problem-solving"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Memory & Following Multistep Directions
              </label>
              <div className="space-y-2">
                {['Excellent', 'Good', 'Average', 'Difficult', 'Very Difficult'].map(level => (
                  <label key={level} className="flex items-center">
                    <input
                      type="radio"
                      name="memoryDirections"
                      value={level}
                      checked={formData.memoryDirections === level}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {level}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Strengths & Interests */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Strengths & Interests</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Areas of Strength / Enjoyed Activities
              </label>
              <textarea
                name="areasOfStrength"
                value={formData.areasOfStrength}
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border rounded"
                placeholder="What activities does your child excel at or particularly enjoy?"
              ></textarea>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Motivators & Rewards</label>
              <textarea
                name="motivators"
                value={formData.motivators}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded"
                placeholder="What motivates your child? What rewards are effective?"
              ></textarea>
            </div>
          </div>
        )}

        {/* Step 8: Environment & Lifestyle */}
        {currentStep === 8 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Environment & Lifestyle</h2>

            <div className="form-group">
              <label className="block mb-2 font-medium">Home & School Environment</label>
              <input
                type="text"
                name="homeEnvironment"
                value={formData.homeEnvironment}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Describe support systems at home and school"
              />
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">
                Daily Screen Time & Preferred Activities
              </label>
              <input
                type="text"
                name="screenTime"
                value={formData.screenTime}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="Hours of screen time and preferred activities"
              />
            </div>
          </div>
        )}

        {/* Step 9: Consent & Logistics */}
        {currentStep === 9 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Consent & Logistics</h2>

            <div className="form-group">
              <label className="flex items-start mb-2 font-medium">
                <input
                  type="checkbox"
                  name="dataConsent"
                  checked={formData.dataConsent}
                  onChange={handleChange}
                  className="mr-2 mt-1"
                  required
                />
                <span>
                  I consent to the processing of this data for assessment purposes.{' '}
                  <span className="text-red-500">*</span>
                </span>
              </label>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Preferred Contact Method</label>
              <select
                name="contactMethod"
                value={formData.contactMethod}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Method</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text Message</option>
              </select>
            </div>

            <div className="form-group">
              <label className="block mb-2 font-medium">Session Scheduling Preferences</label>
              <input
                type="datetime-local"
                name="sessionPreference"
                value={formData.sessionPreference}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              Previous
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < 9 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>
      </form>

      {/* Start Assessment button shown after successful save */}
      {saved && !isStartingAssessment && (
        <div className="mt-6 text-center">
          <p className="text-green-600 mb-4">
            Information saved successfully! Ready to begin the assessment.
          </p>
          <button
            onClick={handleStartAssessment}
            disabled={isStartingAssessment}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStartingAssessment ? 'Starting Assessment...' : 'Start Assessment'}
          </button>
        </div>
      )}

      {/* Show AssessmentLoader when starting assessment */}
      {isStartingAssessment && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <AssessmentLoader
            message="Preparing your assessment..."
            stage="Setting up personalized questions"
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700"
          />
        </div>
      )}
    </div>
  );
};

IntakeForm.propTypes = {
  onSuccess: PropTypes.func,
};

export default IntakeForm;
