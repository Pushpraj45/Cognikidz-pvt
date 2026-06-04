import React, { useState, useEffect } from 'react';
import { BellIcon, EnvelopeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    reportNotifications: true,
    highPriorityReports: true,
    criticalReports: true,
    weeklyDigests: true,
    monthlyReports: false,
    assessmentReminders: true,
    systemUpdates: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Load current preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      if (response.data.success && response.data.user.notificationPreferences) {
        setPreferences(response.data.user.notificationPreferences);
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async newPreferences => {
    try {
      setSaving(true);
      await api.put('/auth/profile', {
        notificationPreferences: newPreferences,
      });

      toast.success('Notification preferences updated successfully!');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = key => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const PreferenceToggle = ({ label, description, value, onToggle, icon: Icon }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-white dark:bg-gray-600 rounded-lg">
          <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        disabled={saving}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          value ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
        } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <BellIcon className="h-6 w-6 text-indigo-600" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Email Notification Preferences
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose which notifications you'd like to receive via email
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Essential Notifications
          </h4>
          <div className="space-y-3">
            <PreferenceToggle
              label="Email Notifications"
              description="Enable or disable all email notifications"
              value={preferences.emailNotifications}
              onToggle={() => handleToggle('emailNotifications')}
              icon={EnvelopeIcon}
            />

            <PreferenceToggle
              label="Critical Reports"
              description="Urgent reports requiring immediate attention"
              value={preferences.criticalReports}
              onToggle={() => handleToggle('criticalReports')}
              icon={XCircleIcon}
            />

            <PreferenceToggle
              label="High Priority Reports"
              description="Important reports about your child's progress"
              value={preferences.highPriorityReports}
              onToggle={() => handleToggle('highPriorityReports')}
              icon={CheckCircleIcon}
            />
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            Report Notifications
          </h4>
          <div className="space-y-3">
            <PreferenceToggle
              label="All Report Notifications"
              description="Get notified when new assessment reports are generated"
              value={preferences.reportNotifications}
              onToggle={() => handleToggle('reportNotifications')}
              icon={BellIcon}
            />

            <PreferenceToggle
              label="Assessment Reminders"
              description="Reminders for upcoming assessments and follow-ups"
              value={preferences.assessmentReminders}
              onToggle={() => handleToggle('assessmentReminders')}
              icon={BellIcon}
            />
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Digest Reports</h4>
          <div className="space-y-3">
            <PreferenceToggle
              label="Weekly Digests"
              description="Weekly summary of your child's progress and activities"
              value={preferences.weeklyDigests}
              onToggle={() => handleToggle('weeklyDigests')}
              icon={EnvelopeIcon}
            />

            <PreferenceToggle
              label="Monthly Reports"
              description="Comprehensive monthly progress reports"
              value={preferences.monthlyReports}
              onToggle={() => handleToggle('monthlyReports')}
              icon={EnvelopeIcon}
            />
          </div>
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">System Updates</h4>
          <div className="space-y-3">
            <PreferenceToggle
              label="System Updates"
              description="Updates about new features and platform improvements"
              value={preferences.systemUpdates}
              onToggle={() => handleToggle('systemUpdates')}
              icon={BellIcon}
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <BellIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Email Delivery Status</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              All notifications are sent from our secure email system. Check your spam folder if you
              don't receive expected emails.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
