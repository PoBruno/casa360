import React, { useContext, useEffect, useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Box } from '@mui/material';
import { Menu as MenuIcon, ExitToApp as LogoutIcon, Home as HomeIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { HouseContext } from '../../contexts/HouseContext';
import api from '../../services/api';

const Header = ({ sidebarOpen, toggleSidebar }) => {
  const { logout, user } = useContext(AuthContext);
  const { selectedHouseId, clearSelectedHouse } = useContext(HouseContext);
  const [selectedHouse, setSelectedHouse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch selected house details if a house is selected
    const fetchHouseDetails = async () => {
      if (!selectedHouseId) {
        setSelectedHouse(null);
        return;
      }

      try {
        const response = await api.get(`/api/houses/my-houses`);
        const house = response.data.houses.find(h => h.id === selectedHouseId);
        setSelectedHouse(house || null);
      } catch (error) {
        console.error('Error fetching house details:', error);
        setSelectedHouse(null);
      }
    };

    fetchHouseDetails();
  }, [selectedHouseId]);

  const handleLogout = () => {
    logout();
    clearSelectedHouse();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton color="inherit" onClick={toggleSidebar} edge="start" sx={{ mr: 2 }}>
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          Casa360
          {selectedHouse && (
            <Typography component="span" sx={{ ml: 2, fontSize: '0.8rem', opacity: 0.9 }}>
              • Casa: {selectedHouse.house_name}
            </Typography>
          )}
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              {user.email}
            </Typography>
            
            {selectedHouseId && (
              <IconButton 
                color="inherit" 
                size="small"
                onClick={() => clearSelectedHouse()}
                title="Desselecionar casa"
                sx={{ mr: 1 }}
              >
                <HomeIcon fontSize="small" />
                <CloseIcon fontSize="small" sx={{ position: 'absolute', bottom: 0, right: 0 }} />
              </IconButton>
            )}
            
            <Button 
              color="inherit" 
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="small"
            >
              Sair
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;