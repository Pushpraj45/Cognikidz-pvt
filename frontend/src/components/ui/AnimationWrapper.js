import React, { useEffect, useState, useRef } from 'react';

/**
 * AnimationWrapper - A component that handles animations with accessibility in mind
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to animate
 * @param {string} props.animation - Animation class from tailwind (e.g., 'animate-fade-in')
 * @param {string} props.className - Additional classes to apply
 * @param {boolean} props.animateOnScroll - Whether to trigger animation on scroll
 * @param {number} props.delay - Delay in ms before animation starts (for non-scroll animations)
 * @param {number} props.threshold - Scroll threshold (0-1) determining when animation triggers
 * @param {string} props.tag - HTML tag to use for the wrapper
 * @param {string} props.id - Optional ID for the wrapper element
 * @returns {React.ReactElement}
 */
const AnimationWrapper = ({
  children,
  animation = 'animate-fade-in',
  className = '',
  animateOnScroll = false,
  delay = 0,
  threshold = 0.2,
  tag = 'div',
  id,
  ...props
}) => {
  const [shouldAnimate, setShouldAnimate] = useState(!animateOnScroll);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const elementRef = useRef(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = e => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Handle scroll-based animations
  useEffect(() => {
    if (!animateOnScroll || prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              setShouldAnimate(true);
            }, delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [animateOnScroll, delay, prefersReducedMotion, threshold]);

  // Handle non-scroll animations with delay
  useEffect(() => {
    if (animateOnScroll || prefersReducedMotion) return;

    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, animateOnScroll, prefersReducedMotion]);

  // Determine classes to apply
  const animationClass = shouldAnimate && !prefersReducedMotion ? animation : '';
  const combinedClassName = `${className} ${animationClass}`.trim();

  // Apply opacity-0 initially for smoother animations when they trigger
  const initialClass =
    animateOnScroll && !shouldAnimate && !prefersReducedMotion ? 'opacity-0' : '';
  const finalClassName = `${combinedClassName} ${initialClass}`.trim();

  // Create element with appropriate tag
  const CustomTag = tag;

  return (
    <CustomTag
      ref={elementRef}
      className={finalClassName}
      id={id}
      {...props}
      aria-hidden={prefersReducedMotion && animationClass ? 'true' : 'false'}
    >
      {children}
    </CustomTag>
  );
};

export default AnimationWrapper;
