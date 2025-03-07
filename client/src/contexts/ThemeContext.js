import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get from localStorage or fallback to 'light'
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    // Store theme preference whenever it changes
    localStorage.setItem('theme', theme);
    // Also apply a data-theme attribute to the body for global CSS variables
    document.body.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};