import { useState, useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../utils/animations';

/**
 * Custom hook for handling animation states in components
 *
 * @param {Object} options - Animation options
 * @param {boolean} options.triggerOnScroll - Whether to trigger animation on scroll into view
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @param {number} options.delay - Delay in ms before animation starts
 * @param {boolean} options.once - Whether to trigger animation only once
 * @returns {Object} - Animation state and ref to attach to the element
 */
const useAnimation = ({ triggerOnScroll = true, threshold = 0.1, delay = 0, once = true } = {}) => {
  const [isVisible, setIsVisible] = useState(!triggerOnScroll);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const elementRef = useRef(null);

  // Check for reduced motion preference
  useEffect(() => {
    setIsReducedMotion(prefersReducedMotion());
  }, []);

  // Handle scroll-based animation
  useEffect(() => {
    // If not triggering on scroll, animation should be visible immediately
    if (!triggerOnScroll) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setIsVisible(true);
          setHasAnimated(true);
        }, delay);
        return () => clearTimeout(timer);
      }
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    // If reduced motion is preferred, set visible immediately
    if (isReducedMotion) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    // Skip if animation already happened and once is true
    if (hasAnimated && once) return;

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Add delay if specified
          if (delay > 0) {
            setTimeout(() => {
              setIsVisible(true);
              setHasAnimated(true);
            }, delay);
          } else {
            setIsVisible(true);
            setHasAnimated(true);
          }

          // Unobserve if we only want to animate once
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          // If not once, toggle visibility based on intersection
          setIsVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [triggerOnScroll, threshold, delay, once, hasAnimated, isReducedMotion]);

  return {
    ref: elementRef,
    isVisible,
    hasAnimated,
    isReducedMotion,
    // Helper properties for common animation libraries
    framerState: isVisible ? 'visible' : 'hidden',
    cssClass: isVisible ? 'in-view' : '',
  };
};

export default useAnimation;
