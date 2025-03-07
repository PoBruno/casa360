import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
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
    if (!selectedHouseId) return;
    
    try {
      setLoading(true);
      
      // Fetch payer users
      const payerUsersResponse = await api.get(`/api/house/${selectedHouseId}/finance-payer-users`);
      
      // Fetch payers
      const payersResponse = await api.get(`/api/house/${selectedHouseId}/finance-payer`);
      
      // Fetch users
      const usersResponse = await api.get(`/api/house/${selectedHouseId}/finance-users`);
      
      // Process data with related information
      const processedPayerUsers = payerUsersResponse.data.map(pu => {
        const payer = payersResponse.data.find(p => p.id === pu.finance_payer_id);
        const user = usersResponse.data.find(u => u.id === pu.user_id);
        
        return {
          ...pu,
          payer_name: payer ? payer.name : 'Desconhecido',
          user_name: user ? user.name : 'Desconhecido'
        };
      });
      
      setPayerUsers(processedPayerUsers);
      setPayers(payersResponse.data);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('Falha ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]);

  useEffect(() => {
    fetchData();
  }, [selectedHouseId, fetchData]);

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
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
        await api.put(`/api/house/${selectedHouseId}/finance-payer-users/${editPayerUser.finance_payer_id}/user/${editPayerUser.user_id}`, values);
        showNotification('Usuário do pagador atualizado com sucesso', 'success');
      } else {
        await api.post(`/api/house/${selectedHouseId}/finance-payer-users`, values);
        showNotification('Usuário do pagador criado com sucesso', 'success');
      }
      handleCloseDialog();
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving payer user:', error);
      showNotification('Erro ao salvar usuário do pagador', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (payerUser) => {
    if (window.confirm(`Deseja realmente excluir o usuário "${payerUser.user_name}" do pagador "${payerUser.payer_name}"?`)) {
      try {
        await api.delete(`/api/house/${selectedHouseId}/finance-payer-users/${payerUser.finance_payer_id}/user/${payerUser.user_id}`);
        showNotification('Usuário do pagador excluído com sucesso', 'success');
        fetchData();
      } catch (error) {
        console.error('Error deleting payer user:', error);
        showNotification('Erro ao excluir usuário do pagador', 'error');
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
          Por favor, selecione uma casa para gerenciar Usuários Pagadores.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Usuários Pagadores"
        data={payerUsers}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Novo Usuário Pagador"
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editPayerUser ? 'Editar Usuário Pagador' : 'Novo Usuário Pagador'}
        </DialogTitle>
        <Formik
          initialValues={{
            finance_payer_id: editPayerUser?.finance_payer_id || '',
            user_id: editPayerUser?.user_id || '',
            percentage: editPayerUser?.percentage || 100
          }}
          validationSchema={payerUserSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, values, handleChange }) => (
            <Form>
              <DialogContent>
                <FormControl fullWidth margin="normal" error={touched.finance_payer_id && Boolean(errors.finance_payer_id)}>
                  <InputLabel id="payer-select-label">Pagador</InputLabel>
                  <Select
                    labelId="payer-select-label"
                    name="finance_payer_id"
                    value={values.finance_payer_id}
                    onChange={handleChange}
                    label="Pagador"
                  >
                    {payers.map(payer => (
                      <MuiMenuItem key={payer.id} value={payer.id}>
                        {payer.name}
                      </MuiMenuItem>
                    ))}
                  </Select>
                  {touched.finance_payer_id && errors.finance_payer_id && (
                    <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                      {errors.finance_payer_id}
                    </Box>
                  )}
                </FormControl>

                <FormControl fullWidth margin="normal" error={touched.user_id && Boolean(errors.user_id)}>
                  <InputLabel id="user-select-label">Usuário</InputLabel>
                  <Select
                    labelId="user-select-label"
                    name="user_id"
                    value={values.user_id}
                    onChange={handleChange}
                    label="Usuário"
                  >
                    {users.map(user => (
                      <MuiMenuItem key={user.id} value={user.id}>
                        {user.name}
                      </MuiMenuItem>
                    ))}
                  </Select>
                  {touched.user_id && errors.user_id && (
                    <Box component="span" sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                      {errors.user_id}
                    </Box>
                  )}
                </FormControl>

                <Field
                  as={TextField}
                  name="percentage"
                  label="Porcentagem (%)"
                  type="number"
                  fullWidth
                  margin="normal"
                  error={touched.percentage && Boolean(errors.percentage)}
                  helperText={touched.percentage && errors.percentage}
                  inputProps={{ min: 1, max: 100 }}
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

export default PayerUsers;