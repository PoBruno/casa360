import React from 'react';
import { Box, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ py: 2, textAlign: 'center', mt: 'auto' }}>
      <Typography variant="body2" color="text.secondary">
        Casa360 © {new Date().getFullYear()} - Gerenciamento Financeiro Doméstico
      </Typography>
    </Box>
  );
};

export default Footer;