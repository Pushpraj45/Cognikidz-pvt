import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component - Automatically scrolls to top when route changes
 *
 * This component listens for route changes and scrolls the window to the top
 * ensuring users always start at the top of a new page.
 */
const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top whenever the pathname changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth', // You can change this to 'auto' for instant scroll
    });
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
};

export default ScrollToTop;
