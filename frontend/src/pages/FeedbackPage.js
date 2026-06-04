import React from 'react';
import FeedbackForm from '../components/FeedbackForm';
import TranslatedText from '../components/ui/TranslatedText';

const FeedbackPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FeedbackForm />
    </div>
  );
};

export default FeedbackPage;
