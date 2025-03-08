import React, { useState, useEffect, useCallback, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { 
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  MonetizationOn as MoneyIcon,
  AccessTime as TimeIcon,
  Warning as WarningIcon,
  CreditCard as CreditCardIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import { HouseContext } from '../../contexts/HouseContext';

// Schema de validação para edição completa de parcela
const installmentSchema = Yup.object().shape({
  due_date: Yup.date().required('Data de vencimento é obrigatória'),
  amount: Yup.number()
    .required('Valor é obrigatório')
    .min(0.01, 'Valor deve ser maior que zero'),
  status: Yup.string()
    .required('Status é obrigatório')
    .oneOf(['pending', 'paid', 'overdue'], 'Status inválido')
});

function Installments() {
  const { selectedHouseId } = useContext(HouseContext);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  // Estados para diálogos
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [amountDialogOpen, setAmountDialogOpen] = useState(false);
  const [currentInstallment, setCurrentInstallment] = useState(null);
  const [newAmount, setNewAmount] = useState('');
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchInstallments = useCallback(async () => {
    if (!selectedHouseId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/api/house/${selectedHouseId}/finance-installments`);
      setInstallments(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching installments:', err);
      setError('Erro ao buscar parcelas. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]);

  useEffect(() => {
    fetchInstallments();
  }, [selectedHouseId, fetchInstallments]);

  const showNotification = (message, severity = 'success') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  // Funções para gerenciamento de diálogos
  const handleOpenEditDialog = (installment) => {
    setCurrentInstallment(installment);
    setEditDialogOpen(true);
  };

  const handleOpenAmountDialog = (installment) => {
    setCurrentInstallment(installment);
    setNewAmount(installment.amount);
    setAmountDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setEditDialogOpen(false);
    setAmountDialogOpen(false);
    setCurrentInstallment(null);
    setNewAmount('');
  };

  // Funções para operações CRUD
  const handleMarkPaid = async (installmentId) => {
    try {
      await api.put(`/api/house/${selectedHouseId}/finance-installments/${installmentId}/status`, {
        status: 'paid'
      });
      
      showNotification('Parcela marcada como paga com sucesso!');
      fetchInstallments(); // Recarrega os dados
    } catch (error) {
      console.error('Error marking installment as paid:', error);
      showNotification('Erro ao marcar parcela como paga.', 'error');
    }
  };

  const handleUpdateAmount = async () => {
    if (!currentInstallment) return;
    
    try {
      await api.patch(`/api/house/${selectedHouseId}/finance-installments/${currentInstallment.id}`, {
        amount: parseFloat(newAmount)
      });
      
      showNotification('Valor da parcela atualizado com sucesso!');
      fetchInstallments(); // Recarrega os dados
      handleCloseDialogs();
    } catch (error) {
      console.error('Error updating installment amount:', error);
      showNotification('Erro ao atualizar valor da parcela.', 'error');
    }
  };

  const handleSubmitEdit = async (values) => {
    if (!currentInstallment) return;
    
    try {
      await api.put(`/api/house/${selectedHouseId}/finance-installments/${currentInstallment.id}`, {
        due_date: values.due_date,
        amount: parseFloat(values.amount),
        status: values.status,
        finance_entries_id: currentInstallment.finance_entries_id,
        installment_number: currentInstallment.installment_number
      });
      
      showNotification('Parcela atualizada com sucesso!');
      fetchInstallments(); // Recarrega os dados
      handleCloseDialogs();
    } catch (error) {
      console.error('Error updating installment:', error);
      showNotification('Erro ao atualizar parcela.', 'error');
    }
  };

  const handleDelete = async (installmentId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      await api.delete(`/api/house/${selectedHouseId}/finance-installments/${installmentId}`);
      
      showNotification('Parcela excluída com sucesso!');
      fetchInstallments(); // Recarrega os dados
    } catch (error) {
      console.error('Error deleting installment:', error);
      showNotification('Erro ao excluir parcela.', 'error');
    }
  };

  // Funções para filtros e ordenação
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Funções de formatação
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'paid':
        return (
          <Chip 
            icon={<CheckCircleIcon />} 
            label="Pago" 
            color="success" 
            variant="outlined" 
            size="small" 
          />
        );
      case 'overdue':
        return (
          <Chip 
            icon={<WarningIcon />} 
            label="Vencido" 
            color="error" 
            variant="outlined" 
            size="small" 
          />
        );
      case 'pending':
        return (
          <Chip 
            icon={<TimeIcon />} 
            label="Pendente" 
            color="warning" 
            variant="outlined" 
            size="small" 
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Filtra e ordena as parcelas
  const filteredInstallments = installments.filter(item => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  }).sort((a, b) => {
    const dateA = new Date(a.due_date);
    const dateB = new Date(b.due_date);
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
  });

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
      <Box>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" component="h1">
          Parcelas
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={handleSortOrderChange}
            startIcon={sortOrder === 'asc' ? <TimeIcon /> : <TimeIcon sx={{ transform: 'rotate(180deg)' }} />}
          >
            {sortOrder === 'asc' ? 'Mais antigas primeiro' : 'Mais recentes primeiro'}
          </Button>
          
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              label="Status"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="pending">Pendentes</MenuItem>
              <MenuItem value="paid">Pagos</MenuItem>
              <MenuItem value="overdue">Vencidos</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      {filteredInstallments.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">Nenhuma parcela encontrada.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredInstallments.map((installment) => (
            <Grid item xs={12} sm={6} md={4} key={installment.id}>
              <Card sx={{ 
                position: 'relative',
                borderLeft: installment.is_income ? '5px solid green' : '5px solid red',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}>
                <CardContent>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" noWrap title={installment.entry_description}>
                      {installment.entry_description}
                    </Typography>
                    {getStatusChip(installment.status)}
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Valor:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(installment.amount)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Vencimento:
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(installment.due_date)}
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Parcela:
                      </Typography>
                      <Typography variant="body1">
                        #{installment.installment_number}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tipo:
                      </Typography>
                      <Typography variant="body1" sx={{ color: installment.is_income ? 'success.main' : 'error.main' }}>
                        {installment.is_income ? 'Receita' : 'Despesa'}
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Tooltip title="Editar parcela">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenEditDialog(installment)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Alterar valor">
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => handleOpenAmountDialog(installment)}
                      >
                        <MoneyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {installment.status !== 'paid' && (
                      <Tooltip title="Marcar como pago">
                        <Button 
                          variant="outlined" 
                          color="success" 
                          startIcon={<CreditCardIcon />}
                          size="small"
                          onClick={() => handleMarkPaid(installment.id)}
                          sx={{ flexGrow: 1 }}
                        >
                          Pagar
                        </Button>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Excluir parcela">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDelete(installment.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Diálogo para edição completa de parcela */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseDialogs}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar Parcela</DialogTitle>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Formik
            initialValues={{
              due_date: currentInstallment ? new Date(currentInstallment.due_date) : new Date(),
              amount: currentInstallment ? currentInstallment.amount : '',
              status: currentInstallment ? currentInstallment.status : 'pending',
            }}
            validationSchema={installmentSchema}
            onSubmit={handleSubmitEdit}
            enableReinitialize
          >
            {({ values, setFieldValue, errors, touched, isSubmitting }) => (
              <Form>
                <DialogContent>
                  <DatePicker
                    label="Data de Vencimento"
                    value={values.due_date}
                    onChange={(date) => setFieldValue('due_date', date)}
                    slotProps={{
                      textField: {
                        margin: 'normal',
                        fullWidth: true,
                        error: touched.due_date && Boolean(errors.due_date),
                        helperText: touched.due_date && errors.due_date
                      }
                    }}
                  />
                  
                  <TextField
                    name="amount"
                    label="Valor"
                    fullWidth
                    margin="normal"
                    type="number"
                    value={values.amount}
                    onChange={(e) => setFieldValue('amount', e.target.value)}
                    error={touched.amount && Boolean(errors.amount)}
                    helperText={touched.amount && errors.amount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                    }}
                  />
                  
                  <FormControl 
                    fullWidth 
                    margin="normal"
                    error={touched.status && Boolean(errors.status)}
                  >
                    <InputLabel>Status</InputLabel>
                    <Field
                      as={Select}
                      name="status"
                      label="Status"
                    >
                      <MenuItem value="pending">Pendente</MenuItem>
                      <MenuItem value="paid">Pago</MenuItem>
                      <MenuItem value="overdue">Vencido</MenuItem>
                    </Field>
                    {touched.status && errors.status && (
                      <Typography color="error" variant="caption">
                        {errors.status}
                      </Typography>
                    )}
                  </FormControl>
                  
                  {currentInstallment && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Entrada: {currentInstallment.entry_description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Parcela #{currentInstallment.installment_number}
                      </Typography>
                    </Box>
                  )}
                </DialogContent>
                
                <DialogActions>
                  <Button onClick={handleCloseDialogs} color="inherit">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    color="primary" 
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Salvar'}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </LocalizationProvider>
      </Dialog>

      {/* Diálogo para alteração rápida de valor */}
      <Dialog 
        open={amountDialogOpen} 
        onClose={handleCloseDialogs}
      >
        <DialogTitle>Alterar Valor da Parcela</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Novo Valor"
            type="number"
            fullWidth
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">R$</InputAdornment>,
            }}
          />
          {currentInstallment && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Valor atual: {formatCurrency(currentInstallment.amount)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentInstallment.entry_description} - Parcela #{currentInstallment.installment_number}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs} color="inherit">Cancelar</Button>
          <Button onClick={handleUpdateAmount} color="primary" variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Installments;