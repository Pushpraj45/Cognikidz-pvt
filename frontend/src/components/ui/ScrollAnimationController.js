import { useEffect } from 'react';
import { prefersReducedMotion } from '../../utils/animations';

/**
 * ScrollAnimationController - Adds scroll-based animation functionality to the application
 *
 * This component initializes intersection observers to handle animate-on-scroll
 * elements throughout the application.
 */
const ScrollAnimationController = () => {
  useEffect(() => {
    // Skip if user prefers reduced motion
    if (prefersReducedMotion()) return;

    // Function to handle elements becoming visible
    const handleIntersection = (entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Add the in-view class to trigger the animation
          entry.target.classList.add('in-view');

          // Once animated, we can stop observing this element
          observer.unobserve(entry.target);
        }
      });
    };

    // Create an intersection observer for animation elements
    const animationObserver = new IntersectionObserver(handleIntersection, {
      threshold: 0.1, // Trigger when 10% of the element is visible
      rootMargin: '0px 0px -50px 0px', // Slightly before scrolling to the element
    });

    // Select all elements with the animate-on-scroll class
    const animationElements = document.querySelectorAll('.animate-on-scroll');

    // Observe each animation element
    animationElements.forEach(element => {
      animationObserver.observe(element);
    });

    // Cleanup on unmount
    return () => {
      if (animationObserver) {
        animationElements.forEach(element => {
          animationObserver.unobserve(element);
        });
      }
    };
  }, []);

  // This component doesn't render anything - it just adds the scroll behavior
  return null;
};

export default ScrollAnimationController;
