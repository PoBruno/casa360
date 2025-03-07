import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';

const MenuItem = ({ title, icon, to, nested = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <ListItem 
      button 
      component={RouterLink} 
      to={to}
      sx={{ 
        pl: nested ? 4 : 2,
        color: 'text.primary', // Fix purple link color
        position: 'relative',
        backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
        transition: 'all 0.2s ease',
        borderRadius: '8px',
        mx: 1,
        mb: 0.5,
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.12)',
        },
        '&:before': isActive ? {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: '4px',
          height: '60%',
          backgroundColor: 'primary.main',
          borderRadius: '0 4px 4px 0',
        } : {}
      }}
    >
      {icon && (
        <ListItemIcon 
          sx={{ 
            minWidth: '40px',
            color: isActive ? 'primary.main' : 'inherit'
          }}
        >
          {icon}
        </ListItemIcon>
      )}
      <ListItemText 
        primary={title} 
        primaryTypographyProps={{
          fontWeight: isActive ? 500 : 400,
          color: isActive ? 'primary.main' : 'inherit'
        }}
      />
      
      {isActive && (
        <Box 
          sx={{
            position: 'absolute',
            right: 8,
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            transition: 'all 0.3s ease',
          }}
        />
      )}
    </ListItem>
  );
};

export default MenuItem;