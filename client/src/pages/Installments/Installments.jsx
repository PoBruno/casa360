import React, { useCallback, useEffect, useState, useContext } from 'react';
import { Box, Typography, CircularProgress, Paper, Snackbar, Alert, Button, Chip } from '@mui/material';
import { HouseContext } from '../../contexts/HouseContext';
import api from '../../services/api';

function Installments() {
  const { selectedHouseId } = useContext(HouseContext);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  const fetchInstallments = useCallback(async () => {
    if (!selectedHouseId) return;
    try {
      setLoading(true);
      setError('');
      // Fix: Add '/api' prefix to the endpoint URL
      const response = await api.get(`/api/house/${selectedHouseId}/finance-installments`);
      setInstallments(response.data);
    } catch (err) {
      setError('Failed to load installments. Please try again later.');
      console.error(err);
      showNotification('Erro ao carregar parcelas', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]);

  useEffect(() => {
    fetchInstallments();
  }, [selectedHouseId, fetchInstallments]);

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleMarkPaid = async (installmentId) => {
    try {
      await api.put(`/api/house/${selectedHouseId}/finance-installments/${installmentId}/status`, {
        status: 'paid'
      });
      showNotification('Parcela marcada como paga com sucesso!', 'success');
      // Refresh installments after marking one as paid
      fetchInstallments();
    } catch (error) {
      console.error('Error marking installment as paid:', error);
      showNotification('Erro ao marcar parcela como paga', 'error');
    }
  };

  if (!selectedHouseId) {
    return (
      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Selecione uma casa para visualizar as parcelas.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Get status chip with appropriate color
  const getStatusChip = (status) => {
    let color = 'default';
    let label = status;
    
    switch (status) {
      case 'paid':
        color = 'success';
        label = 'Pago';
        break;
      case 'pending':
        color = 'primary';
        label = 'Pendente';
        break;
      case 'overdue':
        color = 'error';
        label = 'Atrasado';
        break;
      default:
        color = 'default';
    }
    
    return <Chip label={label} color={color} size="small" />;
  };

  // Format date function
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Parcelas</Typography>
      {installments.length === 0 ? (
        <Typography>Nenhuma parcela encontrada.</Typography>
      ) : (
        installments.map((item) => (
          <Paper key={item.id} sx={{ mb: 2, p: 2, borderLeft: item.is_income ? '4px solid green' : '4px solid red' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">{item.entry_description}</Typography>
              {getStatusChip(item.status)}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="body1">
                <strong>Valor:</strong> {formatCurrency(item.amount)}
              </Typography>
              <Typography variant="body1">
                <strong>Vencimento:</strong> {formatDate(item.due_date)}
              </Typography>
              <Typography variant="body1">
                <strong>Parcela:</strong> #{item.installment_number}
              </Typography>
              <Typography variant="body1" sx={{ color: item.is_income ? 'green' : 'red' }}>
                <strong>Tipo:</strong> {item.is_income ? 'Receita' : 'Despesa'}
              </Typography>
            </Box>
            {item.status !== 'paid' && (
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  onClick={() => handleMarkPaid(item.id)}
                >
                  Marcar como Pago
                </Button>
              </Box>
            )}
          </Paper>
        ))
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Installments;