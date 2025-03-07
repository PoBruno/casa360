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

const costCenterSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo'),
  description: Yup.string()
    .max(500, 'Descrição muito longa')
});

const CostCenter = () => {
  const [costCenters, setCostCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  useEffect(() => {
    if (selectedHouseId) {
      fetchCostCenters();
    }
  }, [selectedHouseId]);

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-cc`);
      setCostCenters(response.data);
    } catch (error) {
      console.error('Error fetching cost centers:', error);
      showNotification('Falha ao carregar centros de custo', 'error');
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
    setEditingCostCenter(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditingCostCenter(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (costCenter) => {
    setEditingCostCenter(costCenter);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingCostCenter) {
        await api.put(`/house/${selectedHouseId}/finance-cc/${editingCostCenter.id}`, values);
        showNotification('Centro de custo atualizado com sucesso!', 'success');
      } else {
        await api.post(`/house/${selectedHouseId}/finance-cc`, values);
        showNotification('Centro de custo criado com sucesso!', 'success');
      }
      
      resetForm();
      handleCloseDialog();
      fetchCostCenters();
    } catch (error) {
      console.error('Error saving cost center:', error);
      showNotification('Erro ao salvar centro de custo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (costCenter) => {
    if (window.confirm(`Deseja realmente excluir o centro de custo "${costCenter.name}"?`)) {
      try {
        await api.delete(`/house/${selectedHouseId}/finance-cc/${costCenter.id}`);
        showNotification('Centro de custo excluído com sucesso!', 'success');
        fetchCostCenters();
      } catch (error) {
        console.error('Error deleting cost center:', error);
        showNotification('Erro ao excluir centro de custo', 'error');
      }
    }
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nome' },
    { id: 'description', label: 'Descrição' },
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
          Selecione uma casa para gerenciar centros de custo.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Centros de Custo"
        data={costCenters}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
        addButtonLabel="Novo Centro de Custo"
      />

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCostCenter ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: editingCostCenter?.name || '',
            description: editingCostCenter?.description || ''
          }}
          validationSchema={costCenterSchema}
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
                  name="description"
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={4}
                  margin="normal"
                  error={touched.description && Boolean(errors.description)}
                  helperText={touched.description && errors.description}
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

export default CostCenter;