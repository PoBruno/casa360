import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Home as HomeIcon,
  Schedule as ScheduleIcon,
  Category as CategoryIcon,
  AccountBalance as AccountBalanceIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon
} from '@mui/icons-material';

const drawerWidth = 40;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Casa', icon: <HomeIcon />, path: '/casa' },
  { text: 'Frequência', icon: <ScheduleIcon />, path: '/frequency' },
  { text: 'Centro de Custo', icon: <CategoryIcon />, path: '/cost-center' },
  { text: 'Categorias', icon: <CategoryIcon />, path: '/category' },
  { text: 'Pagadores', icon: <PersonIcon />, path: '/payer' },
  { text: 'Usuários Pagadores', icon: <GroupIcon />, path: '/payer-users' },
  { text: 'Moedas', icon: <MoneyIcon />, path: '/currency' },
  { text: 'Entradas', icon: <ReceiptIcon />, path: '/entries' },
  { text: 'Parcelas', icon: <AccountBalanceIcon />, path: '/installments' },
  { text: 'Transações', icon: <PaymentIcon />, path: '/transactions' }
];

const Sidebar = ({ open }) => {
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
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem 
              button 
              key={item.text} 
              component={RouterLink} 
              to={item.path}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;