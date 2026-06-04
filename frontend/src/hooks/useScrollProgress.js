import { useState, useEffect } from 'react';

const useScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const calculateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight === 0) {
        setScrollProgress(0);
        return;
      }

      const progress = (scrollTop / scrollHeight) * 100;
      setScrollProgress(Math.min(Math.max(progress, 0), 100));
    };

    const handleScroll = () => {
      requestAnimationFrame(calculateScrollProgress);
    };

    // Calculate initial progress
    calculateScrollProgress();

    // Add scroll event listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateScrollProgress, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', calculateScrollProgress);
    };
  }, []);

  return scrollProgress;
};

export default useScrollProgress;
