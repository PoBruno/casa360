import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Typography,
  Snackbar,
  Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import EntityTable from '../../components/common/EntityTable';
import api from '../../services/api';

const transactionSchema = Yup.object().shape({
  user_id: Yup.number().required('Usuário é obrigatório'),
  finance_installments_id: Yup.number().nullable(),
  transaction_date: Yup.date().required('Data da transação é obrigatória'),
  amount: Yup.number().required('Valor é obrigatório').min(0.01, 'Valor deve ser maior que zero'),
  is_income: Yup.boolean(),
  description: Yup.string().required('Descrição é obrigatória').max(255, 'Descrição deve ter no máximo 255 caracteres'),
  status: Yup.string().oneOf(['pending', 'completed', 'canceled'], 'Status inválido').required('Status é obrigatório')
});

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showNotification('Falha ao carregar transações', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]);

  const fetchRelatedData = useCallback(async () => {
    try {
      const [usersResponse, installmentsResponse] = await Promise.all([
        api.get(`/house/${selectedHouseId}/finance-users`),
        api.get(`/house/${selectedHouseId}/finance-installments`)
      ]);
      
      setUsers(usersResponse.data);
      
      // Format installments for dropdown display
      const formattedInstallments = installmentsResponse.data.map(item => ({
        id: item.id,
        name: `#${item.installment_number} - ${item.entry_description} (${new Date(item.due_date).toLocaleDateString()})`
      }));
      
      setInstallments(formattedInstallments);
    } catch (error) {
      console.error('Error fetching related data:', error);
      showNotification('Erro ao carregar dados relacionados', 'error');
    }
  }, [selectedHouseId]);

  useEffect(() => {
    if (selectedHouseId) {
      fetchTransactions();
      fetchRelatedData();
    }
  }, [selectedHouseId, fetchTransactions, fetchRelatedData]);

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTransaction(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const payload = {
        ...values,
        transaction_date: values.transaction_date instanceof Date ? values.transaction_date.toISOString() : values.transaction_date,
        amount: Number(values.amount)
      };

      if (editingTransaction) {
        await api.put(`/house/${selectedHouseId}/finance-transactions/${editingTransaction.id}`, payload);
        showNotification('Transação atualizada com sucesso!', 'success');
      } else {
        await api.post(`/house/${selectedHouseId}/finance-transactions`, payload);
        showNotification('Transação criada com sucesso!', 'success');
      }

      // Refresh data and close dialog
      resetForm();
      setDialogOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
      showNotification(`Erro ao salvar transação: ${error.response?.data?.error || error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

    const getStatusChip = (status) => {
    let color, label;
    switch(status) {
        case 'completed':
        color = 'success';
        label = 'Completo';
        break;
        case 'pending':
        color = 'warning';
        label = 'Pendente';
        break;
        case 'canceled':
        color = 'error';
        label = 'Cancelado';
        break;
        default:
        color = 'default';
        label = status;
    }
    return <Chip label={label} color={color} size="small" />;
  };

  const columns = [
    { id: 'description', label: 'Descrição' },
    { 
      id: 'amount', 
      label: 'Valor', 
      format: (value, row) => `${row.is_income ? '+' : '-'} ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` 
    },
    { id: 'transaction_date', label: 'Data', format: (value) => new Date(value).toLocaleDateString() },
    { id: 'status', label: 'Status', format: (value) => getStatusChip(value) }
  ];

  if (!selectedHouseId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Por favor, selecione uma casa para gerenciar transações.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Transações"
        data={transactions}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        addButtonLabel="Nova Transação"
      />
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        message={notification.message} 
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Nova Transação</DialogTitle>
        <Formik
          initialValues={{
            user_id: '',
            finance_installments_id: null,
            transaction_date: new Date(),
            amount: '',
            is_income: false,
            description: '',
            status: 'pending'
          }}
          validationSchema={transactionSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, handleBlur, setFieldValue, isSubmitting }) => (
            <Form>
              <DialogContent>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="user_id-label">Usuário</InputLabel>
                  <Select
                    labelId="user_id-label"
                    id="user_id"
                    name="user_id"
                    value={values.user_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth margin="normal">
                  <InputLabel id="finance_installments_id-label">Parcelamento</InputLabel>
                  <Select
                    labelId="finance_installments_id-label"
                    id="finance_installments_id"
                    name="finance_installments_id"
                    value={values.finance_installments_id}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    {installments.map(installment => (
                      <MenuItem key={installment.id} value={installment.id}>
                        {installment.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Data da Transação"
                    value={values.transaction_date}
                    onChange={date => setFieldValue('transaction_date', date)}
                    renderInput={(params) => <TextField {...params} fullWidth margin="normal" />}
                  />
                </LocalizationProvider>

                <TextField
                  fullWidth
                  margin="normal"
                  id="amount"
                  name="amount"
                  label="Valor"
                  value={values.amount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      id="is_income"
                      name="is_income"
                      checked={values.is_income}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  }
                  label="É Receita?"
                />

                <TextField
                  fullWidth
                  margin="normal"
                  id="description"
                  name="description"
                  label="Descrição"
                  value={values.description}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={values.status}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  >
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="completed">Completo</MenuItem>
                    <MenuItem value="canceled">Cancelado</MenuItem>
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="secondary">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" disabled={isSubmitting}>
                  Salvar
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default Transactions;