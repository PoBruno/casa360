import React, { useContext, useState } from 'react';
import { 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  List,
  Box,
  Tooltip,
  Popper,
  Paper,
  ClickAwayListener
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { MenuContext } from '../contexts/MenuContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

const MenuGroup = ({ title, icon, id, children, collapsed = false }) => {
  const { expandedGroups, toggleMenuGroup } = useContext(MenuContext);
  const { showSidebarTooltips } = useContext(ThemeContext);
  const isOpen = !!expandedGroups[id];
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Check if any child route is active
  const childPaths = React.Children.map(children, child => child.props.to);
  const isActive = childPaths && childPaths.some(path => location.pathname === path);

  const handleClick = (event) => {
    if (collapsed) {
      // In collapsed mode, show/hide the floating menu on click
      setAnchorEl(anchorEl ? null : event.currentTarget);
    } else {
      // In expanded mode, use the normal toggle behavior
      toggleMenuGroup(id);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const popperOpen = Boolean(anchorEl);
  const popperId = popperOpen ? `menu-group-${id}` : undefined;

  // Create the icon element with or without tooltip based on preference
  const iconElement = (
    <ListItemIcon sx={{ minWidth: '40px', color: isActive ? 'primary.main' : 'inherit' }}>
      {icon}
    </ListItemIcon>
  );

  return (
    <>
      <ListItem 
        button 
        onClick={handleClick}
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
          } : {},
          // Visual indicator for expanded state in collapsed mode
          '&:after': collapsed && (isOpen || popperOpen) ? {
            content: '""',
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '5px',
            height: '5px',
            backgroundColor: 'primary.main',
            borderRadius: '50%',
          } : {}
        }}
      >
        {showSidebarTooltips && collapsed ? (
          <Tooltip title={title} placement="right" arrow>
            {iconElement}
          </Tooltip>
        ) : iconElement}
        
        {!collapsed && (
          <ListItemText 
            primary={title} 
            primaryTypographyProps={{
              fontWeight: isActive || isOpen ? 500 : 400,
              noWrap: true,
            }}
          />
        )}
        
        {!collapsed && (
          isOpen ? (
            <ExpandLess sx={{ transition: 'transform 0.3s' }} />
          ) : (
            <ExpandMore sx={{ transition: 'transform 0.3s' }} />
          )
        )}
      </ListItem>

      {/* Floating menu for collapsed sidebar */}
      {collapsed && (
        <Popper
          id={popperId}
          open={popperOpen}
          anchorEl={anchorEl}
          placement="right-start"
          sx={{ zIndex: 1200 }}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, -5],
              },
            },
          ]}
        >
          <ClickAwayListener onClickAway={handleClose}>
            <Paper 
              elevation={4}
              sx={{ 
                minWidth: 180,
                borderRadius: '8px',
                overflow: 'hidden',
                mt: 1
              }}
            >
              <Box sx={{ pt: 1, pb: 1 }}>
                <List component="div" disablePadding dense>
                  {React.Children.map(children, child => 
                    React.cloneElement(child, { collapsed: false, onClick: handleClose })
                  )}
                </List>
              </Box>
            </Paper>
          </ClickAwayListener>
        </Popper>
      )}

      {/* Normal collapsible section for expanded sidebar */}
      {!collapsed && (
        <Collapse 
          in={isOpen} 
          timeout="auto"
          unmountOnExit
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
      )}
    </>
  );
};

export default MenuGroup;