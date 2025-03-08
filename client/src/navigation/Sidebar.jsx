import React, { useContext } from 'react';
import {
  Box,
  Drawer,
  Divider,
  Toolbar,
  List,
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

// Define both widths for expanded and collapsed states
const drawerWidth = 300;
const collapsedDrawerWidth = 80;

const Sidebar = ({ open }) => {
  const { theme } = useContext(ThemeContext);
  const { selectedHouseId } = useContext(HouseContext);
  const isDark = theme === 'dark';

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={true} // Always keep drawer open, but change its width
      sx={{
        width: open ? drawerWidth : collapsedDrawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : collapsedDrawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          background: isDark ? 
            'linear-gradient(180deg, rgba(30,33,42,0.95) 0%, rgba(30,33,42,0.98) 100%)' : 
            'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(250,252,255,0.98) 100%)',
          backdropFilter: 'blur(10px)',
          boxShadow: isDark ? '5px 0 15px rgba(0,0,0,0.2)' : '2px 0 8px rgba(0,0,0,0.1)',
          transition: 'width 0.3s ease',
          overflowX: 'hidden', // Prevent horizontal overflow
          overflowY: 'auto', // Allow vertical scrolling in both states
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'hidden' }}>
        <List>
          <MenuItem 
            title="Dashboard" 
            icon={<DashboardIcon />} 
            to="/" 
            collapsed={!open}
          />
          <MenuItem 
            title="Casa" 
            icon={<HomeIcon />} 
            to="/casa" 
            collapsed={!open}
          />
          
          <Divider sx={{ my: 1.5, mx: 2, opacity: 0.6 }} />
          
          {selectedHouseId && (
            <>
              <MenuGroup 
                id="finance-settings" 
                title="Configurações Financeiras" 
                icon={<SettingsIcon />}
                collapsed={!open}
              >
                <MenuItem 
                  title="Frequência" 
                  icon={<ScheduleIcon />} 
                  to="/finance-settings/frequency" 
                  nested 
                  collapsed={!open} 
                />
                <MenuItem 
                  title="Centro de Custo" 
                  icon={<AccountBalanceIcon />} 
                  to="/finance-settings/cost-center" 
                  nested 
                  collapsed={!open} 
                />
                <MenuItem 
                  title="Categorias" 
                  icon={<CategoryIcon />} 
                  to="/finance-settings/category" 
                  nested 
                  collapsed={!open} 
                />
                <MenuItem 
                  title="Moedas" 
                  icon={<MoneyIcon />} 
                  to="/finance-settings/currency" 
                  nested 
                  collapsed={!open} 
                />
              </MenuGroup>
              
              <MenuGroup 
                id="user-management" 
                title="Gestão de Usuários" 
                icon={<PeopleIcon />}
                collapsed={!open}
              >
                <MenuItem 
                  title="Pagadores" 
                  icon={<PersonIcon />} 
                  to="/user-management/payer" 
                  nested 
                  collapsed={!open} 
                />
                <MenuItem 
                  title="Usuários" 
                  icon={<PersonIcon />} 
                  to="/user-management/users" 
                  nested 
                  collapsed={!open} 
                />
                <MenuItem 
                  title="Usuários Pagadores" 
                  icon={<PeopleIcon />} 
                  to="/user-management/payer-users" 
                  nested 
                  collapsed={!open} 
                />
              </MenuGroup>
              
              <MenuGroup 
                id="finance-operations" 
                title="Operações Financeiras" 
                icon={<FinanceIcon />}
                collapsed={!open}
              >
                <MenuItem 
                  title="Entradas" 
                  icon={<ReceiptIcon />} 
                  to="/finance-operations/entries" 
                  nested 
                  collapsed={!open} 
                />
                <MenuItem 
                  title="Parcelas" 
                  icon={<PaymentIcon />} 
                  to="/finance-operations/installments" 
                  nested 
                  collapsed={!open} 
                />
                <MenuItem 
                  title="Transações" 
                  icon={<PaymentIcon />} 
                  to="/finance-operations/transactions" 
                  nested 
                  collapsed={!open} 
                />
              </MenuGroup>
            </>
          )}
          
          <Divider sx={{ my: 1.5, mx: 2, opacity: 0.6 }} />
          
          <MenuItem 
            title="Configurações" 
            icon={<SettingsIcon />} 
            to="/settings/configuration" 
            collapsed={!open}
          />
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;