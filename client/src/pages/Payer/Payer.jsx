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

const payerSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo')
});

const Payer = () => {
  const [payers, setPayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayer, setEditingPayer] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  useEffect(() => {
    if (selectedHouseId) {
      fetchPayers();
    }
  }, [selectedHouseId]);

  const fetchPayers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-payer`);
      setPayers(response.data);
    } catch (error) {
      console.error('Error fetching payers:', error);
      showNotification('Falha ao carregar pagadores', 'error');
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
    setEditingPayer(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditingPayer(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (payer) => {
    setEditingPayer(payer);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingPayer) {
        await api.put(`/house/${selectedHouseId}/finance-payer/${editingPayer.id}`, values);
        showNotification('Pagador atualizado com sucesso', 'success');
      } else {
        await api.post(`/house/${selectedHouseId}/finance-payer`, values);
        showNotification('Pagador criado com sucesso', 'success');
      }
      handleCloseDialog();
      resetForm();
      fetchPayers();
    } catch (error) {
      console.error('Error saving payer:', error);
      showNotification('Erro ao salvar pagador', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (payer) => {
    if (window.confirm(`Deseja realmente excluir o pagador "${payer.name}"?`)) {
      try {
        await api.delete(`/house/${selectedHouseId}/finance-payer/${payer.id}`);
        showNotification('Pagador excluído com sucesso', 'success');
        fetchPayers();
      } catch (error) {
        console.error('Error deleting payer:', error);
        showNotification('Erro ao excluir pagador', 'error');
      }
    }
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nome' },
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
          Por favor, selecione uma casa para gerenciar pagadores.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Pagadores"
        data={payers}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
        addButtonLabel="Novo Pagador"
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPayer ? 'Editar Pagador' : 'Novo Pagador'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: editingPayer?.name || ''
          }}
          validationSchema={payerSchema}
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

export default Payer;