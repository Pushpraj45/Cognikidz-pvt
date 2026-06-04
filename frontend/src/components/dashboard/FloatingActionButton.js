import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AssessmentTypeSelector from './AssessmentTypeSelector';

// Icons
import { PlusIcon } from '@radix-ui/react-icons';

const FloatingActionButton = ({ childrenData = [] }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(null);

  const handleClick = () => {
    // If there's only one child, open the selector directly
    if (childrenData.length === 1) {
      setSelectedChildId(childrenData[0]._id);
      setIsOpen(true);
    }
    // If there are multiple children, open a child selector first
    else if (childrenData.length > 1) {
      setIsOpen(true);
    }
    // If no children, redirect to add child page
    else {
      navigate('/add-child');
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedChildId(null);
  };

  const handleSelectType = (childId, assessmentType) => {
    // Map assessment type to the correct route format
    let routeType = assessmentType;

    // Set proper route type for assessment forms
    if (assessmentType === 'asd') {
      routeType = 'asd'; // This is correctly mapped in routes to AutismForm
    }

    // Navigate to the correct assessment form with childId
    navigate(`/assessment/${routeType}/form/${childId}`);
  };

  return (
    <>
      <motion.div
        className="fixed right-8 bottom-8 z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative">
          {/* Decorative glow effect */}
          <div className="absolute inset-0 bg-gradient-radial from-accent/30 to-transparent rounded-full blur-xl -z-10 scale-150"></div>

          <button
            onClick={handleClick}
            className="bg-gradient-to-r from-accent to-accent-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center border border-white/20 dark:border-accent-700/30 transition-all duration-300"
            aria-label="New Assessment"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>
      </motion.div>

      <AssessmentTypeSelector
        isOpen={isOpen}
        onClose={handleClose}
        onSelectType={handleSelectType}
        childId={selectedChildId || (childrenData[0] && childrenData[0]._id) || ''}
      />
    </>
  );
};

export default FloatingActionButton;
