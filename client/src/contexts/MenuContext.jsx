import React, { createContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
  const [expandedGroups, setExpandedGroups] = useState({});
  const location = useLocation();

  // Auto-expand menu group based on current route
  useEffect(() => {
    const path = location.pathname;
    
    if (path.startsWith('/finance-settings')) {
      setExpandedGroups(prev => ({ ...prev, 'finance-settings': true }));
    }
    
    if (path.startsWith('/user-management')) {
      setExpandedGroups(prev => ({ ...prev, 'user-management': true }));
    }
    
    if (path.startsWith('/finance-operations')) {
      setExpandedGroups(prev => ({ ...prev, 'finance-operations': true }));
    }
  }, [location.pathname]);

  const toggleMenuGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <MenuContext.Provider value={{ 
      expandedGroups,
      toggleMenuGroup
    }}>
      {children}
    </MenuContext.Provider>
  );
};