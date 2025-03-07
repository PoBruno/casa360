import React, { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import EntityTable from '../../components/common/EntityTable';
import api from '../../services/api';

const frequencySchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(50, 'Nome muito longo'),
  days_interval: Yup.number()
    .required('Intervalo de dias é obrigatório')
    .min(1, 'Intervalo precisa ser maior que 0')
    .integer('Intervalo deve ser um número inteiro')
});

const Frequency = () => {
  const [frequencies, setFrequencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  useEffect(() => {
    if (selectedHouseId) {
      fetchFrequencies();
    }
  }, [selectedHouseId]);

  const fetchFrequencies = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-frequency`);
      setFrequencies(response.data);
    } catch (error) {
      console.error('Error fetching frequencies:', error);
      showNotification('Falha ao carregar frequências', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFrequency(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditingFrequency(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (frequency) => {
    setEditingFrequency(frequency);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingFrequency) {
        // Update existing frequency
        await api.put(`/api/house/${selectedHouseId}/finance-frequency/${editingFrequency.id}`, values);
        showNotification('Frequência atualizada com sucesso', 'success');
      } else {
        // Create a new frequency
        await api.post(`/api/house/${selectedHouseId}/finance-frequency`, values);
        showNotification('Frequência criada com sucesso', 'success');
      }
      
      resetForm();
      handleCloseDialog();
      fetchFrequencies();
    } catch (error) {
      console.error('Error saving frequency:', error);
      showNotification('Erro ao salvar frequência', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (frequency) => {
    if (window.confirm(`Deseja realmente excluir a frequência "${frequency.name}"?`)) {
      try {
        await api.delete(`/api/house/${selectedHouseId}/finance-frequency/${frequency.id}`);
        showNotification('Frequência excluída com sucesso', 'success');
        fetchFrequencies();
      } catch (error) {
        console.error('Error deleting frequency:', error);
        showNotification('Erro ao excluir frequência', 'error');
      }
    }
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nome' },
    { 
      id: 'days_interval', 
      label: 'Intervalo (dias)', 
      format: (value) => value ? `${value} dias` : 'N/A'
    },
    {
      id: 'created_at',
      label: 'Criado em',
      format: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    }
  ];

  if (!selectedHouseId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Selecione uma casa para gerenciar frequências.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Frequências"
        data={frequencies}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
        addButtonLabel="Nova Frequência"
      />

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFrequency ? 'Editar Frequência' : 'Nova Frequência'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: editingFrequency?.name || '',
            days_interval: editingFrequency?.days_interval || ''
          }}
          validationSchema={frequencySchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched }) => (
            <Form>
              <DialogContent>
                <Field
                  as={TextField}
                  name="name"
                  label="Nome"
                  fullWidth
                  margin="normal"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                />
                <Field
                  as={TextField}
                  name="days_interval"
                  label="Intervalo (dias)"
                  type="number"
                  fullWidth
                  margin="normal"
                  error={touched.days_interval && Boolean(errors.days_interval)}
                  helperText={touched.days_interval && errors.days_interval}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Cancelar</Button>
                <Button 
                  type="submit" 
                  color="primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      {/* Notification */}
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
};

export default Frequency;