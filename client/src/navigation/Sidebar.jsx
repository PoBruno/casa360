import React, { useContext } from 'react';
import {
  Box,
  Drawer,
  Divider,
  Toolbar,
  Typography,
  List,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Category as CategoryIcon,
  ReceiptLong as ReceiptIcon,
  MonetizationOn as FinanceIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import MenuGroup from './MenuGroup';
import MenuItem from './MenuItem';
import { ThemeContext } from '../contexts/ThemeContext';
import { HouseContext } from '../contexts/HouseContext';

const drawerWidth = 240;

const Sidebar = ({ open }) => {
  const { theme } = useContext(ThemeContext);
  const { selectedHouseId } = useContext(HouseContext);
  const isDark = theme === 'dark';

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          background: isDark ? 
            'linear-gradient(180deg, rgba(30,33,42,0.95) 0%, rgba(30,33,42,0.98) 100%)' : 
            'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(250,252,255,0.98) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: isDark ? '5px 0 15px rgba(0,0,0,0.2)' : '2px 0 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
        },
      }}
    >
      <Toolbar 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1
        }}
      >
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 700,
            background: isDark ? 
              'linear-gradient(45deg, #64B5F6 30%, #42A5F5 90%)' : 
              'linear-gradient(45deg, #1565C0 30%, #1976D2 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Casa 360
        </Typography>
      </Toolbar>
      
      <Box 
        sx={{ 
          overflow: 'auto',
          py: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <List component="nav" disablePadding>
          <MenuItem title="Dashboard" icon={<DashboardIcon />} to="/" />
          <MenuItem title="Casa" icon={<HomeIcon />} to="/casa" />
          
          <Divider sx={{ my: 1.5, mx: 2, opacity: 0.6 }} />
          
          {selectedHouseId && (
            <>
              <MenuGroup id="finance-settings" title="Configurações Financeiras" icon={<SettingsIcon />}>
                <MenuItem title="Frequência" icon={<ScheduleIcon />} to="/finance-settings/frequency" nested />
                <MenuItem title="Centro de Custo" icon={<AccountBalanceIcon />} to="/finance-settings/cost-center" nested />
                <MenuItem title="Categorias" icon={<CategoryIcon />} to="/finance-settings/category" nested />
                <MenuItem title="Moedas" icon={<MoneyIcon />} to="/finance-settings/currency" nested />
              </MenuGroup>
              
              <MenuGroup id="user-management" title="Gestão de Usuários" icon={<PeopleIcon />}>
                <MenuItem title="Pagadores" icon={<PersonIcon />} to="/user-management/payer" nested />
                <MenuItem title="Usuários" icon={<PersonIcon />} to="/user-management/users" nested />
                <MenuItem title="Usuários Pagadores" icon={<PeopleIcon />} to="/user-management/payer-users" nested />
              </MenuGroup>
              
              <MenuGroup id="finance-operations" title="Operações Financeiras" icon={<FinanceIcon />}>
                <MenuItem title="Entradas" icon={<ReceiptIcon />} to="/finance-operations/entries" nested />
                <MenuItem title="Parcelas" icon={<PaymentIcon />} to="/finance-operations/installments" nested />
                <MenuItem title="Transações" icon={<PaymentIcon />} to="/finance-operations/transactions" nested />
              </MenuGroup>
            </>
          )}
          
          <Divider sx={{ my: 1.5, mx: 2, opacity: 0.6 }} />
          
          <MenuItem title="Configurações" icon={<SettingsIcon />} to="/settings/configuration" />
        </List>
        
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: 'center',
              opacity: 0.6
            }}
          >
            Casa360 © 2025
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;