import React, { useContext } from 'react';
import { 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  List,
  Box
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MenuContext } from '../contexts/MenuContext';
import { useLocation } from 'react-router-dom';

const MenuGroup = ({ title, icon, id, children }) => {
  const { expandedGroups, toggleMenuGroup } = useContext(MenuContext);
  const isOpen = !!expandedGroups[id];
  const location = useLocation();
  
  // Check if any child route is active
  const childPaths = React.Children.map(children, child => child.props.to);
  const isActive = childPaths && childPaths.some(path => location.pathname === path);

  return (
    <>
      <ListItem 
        button 
        onClick={() => toggleMenuGroup(id)}
        sx={{ 
          pl: 2,
          position: 'relative',
          backgroundColor: isActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
          color: isActive ? 'primary.main' : 'text.primary',
          transition: 'all 0.2s ease',
          borderRadius: '8px',
          mx: 1,
          mb: 0.5,
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
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
            opacity: 0.7
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
            fontWeight: isActive || isOpen ? 500 : 400,
          }}
        />
        {isOpen ? (
          <ExpandLess sx={{ transition: 'transform 0.3s', transform: 'rotate(0deg)' }} />
        ) : (
          <ExpandMore sx={{ transition: 'transform 0.3s', transform: 'rotate(0deg)' }} />
        )}
      </ListItem>
      <Collapse 
        in={isOpen} 
        timeout="auto" 
        unmountOnExit
        sx={{
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <List 
          component="div" 
          disablePadding
          sx={{
            position: 'relative',
            '&:before': {
              content: '""',
              position: 'absolute',
              left: '32px',
              top: '8px',
              bottom: '8px',
              width: '1px',
              backgroundColor: 'divider',
              opacity: 0.6
            }
          }}
        >
          {children}
        </List>
      </Collapse>
    </>
  );
};

export default MenuGroup;