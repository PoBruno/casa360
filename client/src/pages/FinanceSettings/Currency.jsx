import React, { useState, useEffect } from 'react';
import { Box, Alert, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Typography, Snackbar } from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import EntityTable from '../../components/common/EntityTable';
import api from '../../services/api';

const currencySchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(50, 'Nome muito longo'),
  symbol: Yup.string()
    .required('Símbolo é obrigatório')
    .max(10, 'Símbolo muito longo'),
  exchange_rate: Yup.number()
    .required('Taxa de câmbio é obrigatória')
    .positive('Taxa deve ser positiva')
});

const Currency = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  useEffect(() => {
    if (selectedHouseId) {
      fetchCurrencies();
    }
  }, [selectedHouseId]);

  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-currency`);
      setCurrencies(response.data);
    } catch (error) {
      console.error('Error fetching currencies:', error);
      showNotification('Falha ao carregar moedas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCurrency(null);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleOpenAddDialog = () => {
    setEditingCurrency(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (currency) => {
    setEditingCurrency(currency);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingCurrency) {
        await api.put(`/api/house/${selectedHouseId}/finance-currency/${editingCurrency.id}`, values);
        showNotification('Moeda atualizada com sucesso', 'success');
      } else {
        await api.post(`/api/house/${selectedHouseId}/finance-currency`, values);
        showNotification('Moeda criada com sucesso', 'success');
      }
      handleCloseDialog();
      resetForm();
      fetchCurrencies();
    } catch (error) {
      console.error('Error saving currency:', error);
      showNotification('Erro ao salvar moeda', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (currency) => {
    if (window.confirm(`Deseja realmente excluir a moeda "${currency.name}"?`)) {
      try {
        await api.delete(`/api/house/${selectedHouseId}/finance-currency/${currency.id}`);
        showNotification('Moeda excluída com sucesso', 'success');
        fetchCurrencies();
      } catch (error) {
        console.error('Error deleting currency:', error);
        showNotification('Erro ao excluir moeda', 'error');
      }
    }
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nome' },
    { id: 'symbol', label: 'Símbolo' },
    { id: 'exchange_rate', label: 'Taxa de Câmbio' },
    {
      id: 'created_at',
      label: 'Criado em',
      format: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Moedas
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpenAddDialog}>
        Adicionar Moeda
      </Button>
      <EntityTable
        columns={columns}
        data={currencies}
        loading={loading}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
      />
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{editingCurrency ? 'Editar Moeda' : 'Adicionar Moeda'}</DialogTitle>
        <DialogContent>
          <Formik
            initialValues={editingCurrency || { name: '', symbol: '', exchange_rate: '' }}
            validationSchema={currencySchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <Field
                  as={TextField}
                  name="name"
                  label="Nome"
                  fullWidth
                  margin="dense"
                  error={touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
                <Field
                  as={TextField}
                  name="symbol"
                  label="Símbolo"
                  fullWidth
                  margin="dense"
                  error={touched.symbol && !!errors.symbol}
                  helperText={touched.symbol && errors.symbol}
                />
                <Field
                  as={TextField}
                  name="exchange_rate"
                  label="Taxa de Câmbio"
                  type="number"
                  fullWidth
                  margin="dense"
                  error={touched.exchange_rate && !!errors.exchange_rate}
                  helperText={touched.exchange_rate && errors.exchange_rate}
                />
                <DialogActions>
                  <Button onClick={handleCloseDialog} color="primary">
                    Cancelar
                  </Button>
                  <Button type="submit" color="primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>
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
};

export default Currency;