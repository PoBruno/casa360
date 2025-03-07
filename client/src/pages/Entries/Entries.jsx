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
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import EntityTable from '../../components/common/EntityTable';
import api from '../../services/api';

const entrySchema = Yup.object().shape({
  user_id: Yup.number().required('Usuário é obrigatório'),
  finance_cc_id: Yup.number().required('Centro de custo é obrigatório'),
  finance_category_id: Yup.number().required('Categoria é obrigatória'),
  finance_payer_id: Yup.number().required('Pagador é obrigatório'),
  finance_currency_id: Yup.number().required('Moeda é obrigatória'),
  finance_frequency_id: Yup.number().required('Frequência é obrigatória'),
  is_income: Yup.boolean(),
  amount: Yup.number().required('Valor é obrigatório').min(0.01, 'Valor deve ser maior que zero'),
  start_date: Yup.date().required('Data inicial é obrigatória'),
  description: Yup.string().max(255, 'Descrição deve ter no máximo 255 caracteres'),
  installments_count: Yup.number().min(1, 'Mínimo de 1 parcela'),
  is_fixed: Yup.boolean(),
  is_recurring: Yup.boolean(),
  payment_day: Yup.number().min(1, 'Dia deve ser maior que 0').max(31, 'Dia deve ser menor que 32')
});

const Entries = () => {
  const [entries, setEntries] = useState([]);
  const [users, setUsers] = useState([]);
  const [costCenters, setCostCenters] = useState([]);
  const [categories, setCategories] = useState([]);
  const [payers, setPayers] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-entries`);
      setEntries(response.data);
    } catch (error) {
      console.error('Error fetching entries:', error);
      showNotification('Falha ao carregar entradas financeiras', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]);

  const fetchRelatedData = useCallback(async () => {
    try {
      const [usersRes, ccRes, catRes, payersRes, currenciesRes, freqRes] = await Promise.all([
        api.get(`/api/house/${selectedHouseId}/finance-users`),
        api.get(`/api/house/${selectedHouseId}/finance-cc`),
        api.get(`/api/house/${selectedHouseId}/finance-category`),
        api.get(`/api/house/${selectedHouseId}/finance-payer`),
        api.get(`/api/house/${selectedHouseId}/finance-currency`),
        api.get(`/api/house/${selectedHouseId}/finance-frequency`)
      ]);
      
      setUsers(usersRes.data);
      setCostCenters(ccRes.data);
      setCategories(catRes.data);
      setPayers(payersRes.data);
      setCurrencies(currenciesRes.data);
      setFrequencies(freqRes.data);
    } catch (error) {
      console.error('Error fetching related data:', error);
      showNotification('Falha ao carregar dados relacionados', 'error');
    }
  }, [selectedHouseId]);

  useEffect(() => {
    if (selectedHouseId) {
      fetchEntries();
      fetchRelatedData();
    }
  }, [selectedHouseId, fetchEntries, fetchRelatedData]);

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEntry(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditingEntry(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (entry) => {
    setEditingEntry(entry);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingEntry) {
        await api.put(`/api/house/${selectedHouseId}/finance-entries/${editingEntry.id}`, values);
        showNotification('Entrada atualizada com sucesso', 'success');
      } else {
        await api.post(`/api/house/${selectedHouseId}/finance-entries`, values);
        showNotification('Entrada criada com sucesso', 'success');
      }
      handleCloseDialog();
      resetForm();
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      showNotification('Erro ao salvar entrada', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry) => {
    if (window.confirm(`Deseja realmente excluir a entrada "${entry.description}"?`)) {
      try {
        await api.delete(`/api/house/${selectedHouseId}/finance-entries/${entry.id}`);
        showNotification('Entrada excluída com sucesso', 'success');
        fetchEntries();
      } catch (error) {
        console.error('Error deleting entry:', error);
        showNotification('Erro ao excluir entrada', 'error');
      }
    }
  };

  const columns = [
    { id: 'description', label: 'Descrição' },
    { 
      id: 'amount', 
      label: 'Valor', 
      format: (value, row) => `${row.is_income ? '+' : '-'} ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` 
    },
    { id: 'start_date', label: 'Data Inicial', format: (value) => new Date(value).toLocaleDateString() },
    { id: 'payment_day', label: 'Dia de Pagamento' },
    { id: 'is_recurring', label: 'Recorrente', format: (value) => value ? 'Sim' : 'Não' }
  ];

  if (!selectedHouseId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Por favor, selecione uma casa para gerenciar entradas financeiras.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Entradas Financeiras"
        data={entries}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
        addButtonLabel="Nova Entrada"
      />
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        message={notification.message} 
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEntry ? 'Editar Entrada' : 'Nova Entrada'}
        </DialogTitle>
        <Formik
          initialValues={{
            user_id: editingEntry?.user_id || '',
            finance_cc_id: editingEntry?.finance_cc_id || '',
            finance_category_id: editingEntry?.finance_category_id || '',
            finance_payer_id: editingEntry?.finance_payer_id || '',
            finance_currency_id: editingEntry?.finance_currency_id || '',
            finance_frequency_id: editingEntry?.finance_frequency_id || '',
            is_income: editingEntry?.is_income || false,
            amount: editingEntry?.amount || '',
            start_date: editingEntry?.start_date || new Date(),
            end_date: editingEntry?.end_date || null,
            description: editingEntry?.description || '',
            installments_count: editingEntry?.installments_count || 1,
            is_fixed: editingEntry?.is_fixed || false,
            is_recurring: editingEntry?.is_recurring || false,
            payment_day: editingEntry?.payment_day || 1
          }}
          validationSchema={entrySchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ values, errors, touched, handleChange, setFieldValue, isSubmitting }) => (
            <Form>
              <DialogContent>
                {/* Form fields for all the necessary data */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={values.is_income}
                      onChange={(e) => setFieldValue('is_income', e.target.checked)}
                      name="is_income"
                    />
                  }
                  label="É receita?"
                />
                
                {/* More form fields */}
                
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="primary">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" disabled={isSubmitting}>
                  {editingEntry ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default Entries;