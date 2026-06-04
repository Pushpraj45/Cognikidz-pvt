import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a context for theme management
const ThemeContext = createContext();

// Available themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or default to light
  const [theme, setTheme] = useState(() => {
    // Check for system preference first if no saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }

    // Use system preference as fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEMES.DARK;
    }

    return THEMES.LIGHT;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update localStorage when theme changes and apply theme class
  useEffect(() => {
    // Save theme preference to localStorage for persistence
    localStorage.setItem('theme', theme);

    // Create smooth transition when changing themes
    setIsTransitioning(true);

    // Apply data-theme attribute for updated CSS variables approach
    if (theme === THEMES.DARK) {
      document.documentElement.setAttribute('data-theme', 'dark');
      // Keep the dark class for existing elements that might still use it
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      // Remove dark class
      document.documentElement.classList.remove('dark');
    }

    // Small delay to allow for transition
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    // Add transition style for smooth theme changes
    const style = document.createElement('style');
    style.innerHTML = `
      * {
        transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease !important;
      }
    `;

    document.head.appendChild(style);

    // Clean up
    return () => {
      document.head.removeChild(style);
    };
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = e => {
      // Only change if the user hasn't explicitly set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, THEMES, isTransitioning }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
