import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Snackbar
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import EntityTable from '../../components/common/EntityTable';
import api from '../../services/api';

const payerUserSchema = Yup.object().shape({
  finance_payer_id: Yup.number()
    .required('Pagador é obrigatório'),
  user_id: Yup.number()
    .required('Usuário é obrigatório'),
  percentage: Yup.number()
    .required('Porcentagem é obrigatória')
    .min(1, 'Porcentagem deve ser maior que 0')
    .max(100, 'Porcentagem deve ser menor ou igual a 100')
});

const PayerUsers = () => {
  const [payerUsers, setPayerUsers] = useState([]);
  const [payers, setPayers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [editPayerUser, setEditPayerUser] = useState(null);
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Correct endpoint with /api prefix
      const payerUsersResponse = await api.get(`/api/house/${selectedHouseId}/finance-payer-users`);
      const payersResponse = await api.get(`/api/house/${selectedHouseId}/finance-payer`);
      const usersResponse = await api.get(`/api/house/${selectedHouseId}/finance-users`);
      
      setPayerUsers(payerUsersResponse.data);
      setPayers(payersResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]); // Include selectedHouseId as dependency

  useEffect(() => {
    if (selectedHouseId) {
      fetchData();
    }
  }, [selectedHouseId, fetchData]);

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditPayerUser(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditPayerUser(null);
    setDialogOpen(true);
  };

  const handleEdit = (payerUser) => {
    setEditPayerUser(payerUser);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editPayerUser) {
        await api.put(
          `/api/house/${selectedHouseId}/finance-payer-users/${values.finance_payer_id}/user/${values.user_id}`,
          { percentage: values.percentage }
        );
        showNotification('Relação atualizada com sucesso', 'success');
      } else {
        await api.post(`/api/house/${selectedHouseId}/finance-payer-users`, values);
        showNotification('Relação criada com sucesso', 'success');
      }
      handleCloseDialog();
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving payer-user relationship:', error);
      showNotification('Erro ao salvar relação', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (payerUser) => {
    if (window.confirm(`Deseja realmente excluir esta relação?`)) {
      try {
        await api.delete(
          `/api/house/${selectedHouseId}/finance-payer-users/${payerUser.finance_payer_id}/user/${payerUser.user_id}`
        );
        showNotification('Relação excluída com sucesso', 'success');
        fetchData();
      } catch (error) {
        console.error('Error deleting payer-user relationship:', error);
        showNotification('Erro ao excluir relação', 'error');
      }
    }
  };

  const columns = [
    { id: 'payer_name', label: 'Pagador' },
    { id: 'user_name', label: 'Usuário' },
    { id: 'percentage', label: 'Porcentagem (%)', format: (value) => `${value}%` }
  ];

  if (!selectedHouseId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Por favor, selecione uma casa para gerenciar relações de pagadores e usuários.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Relações entre Pagadores e Usuários"
        data={payerUsers}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Nova Relação"
      />
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        message={notification.message} 
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editPayerUser ? 'Editar Relação' : 'Nova Relação'}
        </DialogTitle>
        <Formik
          initialValues={{
            finance_payer_id: editPayerUser?.finance_payer_id || '',
            user_id: editPayerUser?.user_id || '',
            percentage: editPayerUser?.percentage || ''
          }}
          validationSchema={payerUserSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, values, setFieldValue }) => (
            <Form>
              <DialogContent>
                <FormControl fullWidth margin="normal" error={touched.finance_payer_id && Boolean(errors.finance_payer_id)}>
                  <InputLabel id="payer-label">Pagador</InputLabel>
                  <Select
                    labelId="payer-label"
                    value={values.finance_payer_id}
                    onChange={(e) => setFieldValue('finance_payer_id', e.target.value)}
                    label="Pagador"
                    disabled={!!editPayerUser}
                  >
                    {payers.map(payer => (
                      <MenuItem key={payer.id} value={payer.id}>{payer.name}</MenuItem>
                    ))}
                  </Select>
                  {touched.finance_payer_id && errors.finance_payer_id && (
                    <Typography color="error" variant="caption">
                      {errors.finance_payer_id}
                    </Typography>
                  )}
                </FormControl>

                <FormControl fullWidth margin="normal" error={touched.user_id && Boolean(errors.user_id)}>
                  <InputLabel id="user-label">Usuário</InputLabel>
                  <Select
                    labelId="user-label"
                    value={values.user_id}
                    onChange={(e) => setFieldValue('user_id', e.target.value)}
                    label="Usuário"
                    disabled={!!editPayerUser}
                  >
                    {users.map(user => (
                      <MenuItem key={user.id} value={user.id}>{user.name}</MenuItem>
                    ))}
                  </Select>
                  {touched.user_id && errors.user_id && (
                    <Typography color="error" variant="caption">
                      {errors.user_id}
                    </Typography>
                  )}
                </FormControl>

              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="primary">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" disabled={isSubmitting}>
                  {editPayerUser ? 'Salvar' : 'Adicionar'}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default PayerUsers;