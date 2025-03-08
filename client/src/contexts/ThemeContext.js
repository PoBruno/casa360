import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get from localStorage or fallback to 'light'
    return localStorage.getItem('theme') || 'light';
  });

  // Add new state for tooltip preference
  const [showSidebarTooltips, setShowSidebarTooltips] = useState(() => {
    // Get from localStorage or default to true
    const saved = localStorage.getItem('showSidebarTooltips');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    // Store theme preference whenever it changes
    localStorage.setItem('theme', theme);
    // Also apply a data-theme attribute to the body for global CSS variables
    document.body.dataset.theme = theme;
  }, [theme]);

  // Add effect to save tooltip preference
  useEffect(() => {
    localStorage.setItem('showSidebarTooltips', JSON.stringify(showSidebarTooltips));
  }, [showSidebarTooltips]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebarTooltips = () => {
    setShowSidebarTooltips(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme,
      showSidebarTooltips,
      toggleSidebarTooltips
    }}>
      {children}
    </ThemeContext.Provider>
  );
};