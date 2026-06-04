import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { prefersReducedMotion } from '../../utils/animations';

/**
 * MotionWrapper - A Framer Motion component that applies animation variants with accessibility support
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to animate
 * @param {Object} props.variants - Animation variants (hidden/visible states)
 * @param {string} props.className - Additional classes
 * @param {number} props.delay - Animation delay in seconds
 * @param {number} props.duration - Animation duration in seconds
 * @param {boolean} props.animate - Whether to animate (defaults to true)
 * @param {string} props.as - HTML element to render (default: div)
 * @param {function} props.onAnimationComplete - Callback when animation completes
 * @returns {React.ReactElement}
 */
const MotionWrapper = ({
  children,
  variants,
  className = '',
  delay = 0,
  duration = 0.5,
  animate = true,
  as = 'div',
  onAnimationComplete,
  ...props
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  // Default transition
  const transition = {
    duration,
    delay,
    ease: [0.25, 0.1, 0.25, 1], // Custom easing
  };

  // If user prefers reduced motion, use a simplified animation
  const accessibleVariants = reducedMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } },
      }
    : variants;

  const Component = motion[as];

  return (
    <Component
      initial="hidden"
      animate={animate ? 'visible' : 'hidden'}
      exit="hidden"
      variants={accessibleVariants}
      transition={transition}
      className={className}
      onAnimationComplete={onAnimationComplete}
      {...props}
    >
      {children}
    </Component>
  );
};

/**
 * Example usage:
 *
 * <MotionWrapper
 *   variants={FADE_UP}
 *   delay={0.2}
 *   className="bg-white p-4 rounded-lg"
 * >
 *   <h2>Animated Content</h2>
 * </MotionWrapper>
 */

export default MotionWrapper;
