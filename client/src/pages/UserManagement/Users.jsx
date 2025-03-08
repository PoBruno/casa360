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

const userSchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  account_status: Yup.string()
    .oneOf(['active', 'inactive'], 'Status inválido')
    .default('active'),
  wallet: Yup.number()
    .required('Valor Carteira')
    .min(0, 'Carteira não pode ser negativa')
});

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  useEffect(() => {
    if (selectedHouseId) {
      fetchUsers();
    }
  }, [selectedHouseId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching Users:', error);
      showNotification('Falha ao carregar Usuários', 'error');
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
    setEditingUser(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (user) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingUser) {
        await api.put(`/api/house/${selectedHouseId}/finance-users/${editingUser.id}`, values);
        showNotification('Usuário atualizado com sucesso', 'success');
      } else {
        await api.post(`/api/house/${selectedHouseId}/finance-users`, values);
        showNotification('Usuário criado com sucesso', 'success');
      }
      handleCloseDialog();
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      showNotification('Erro ao salvar usuário', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Deseja realmente excluir o Usuário "${user.name}"?`)) {
      try {
        await api.delete(`/api/house/${selectedHouseId}/finance-users/${user.id}`);
        showNotification('Usuário excluído com sucesso', 'success');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        showNotification('Erro ao excluir usuário', 'error');
      }
    }
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nome' },
    { id: 'email', label: 'Email' },
    { id: 'account_status', label: 'Status' },
    { id: 'wallet', label: 'Carteira' },
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
          Por favor, selecione uma casa para gerenciar Usuários.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Usuários"
        data={users}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
        addButtonLabel="Novo Usuário"
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: editingUser?.name || '',
            email: editingUser?.email || '',
            account_status: editingUser?.account_status || 'active',
            wallet: editingUser?.wallet || 0
          }}
          validationSchema={userSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, values, handleChange }) => (
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
                  name="email"
                  label="Email"
                  fullWidth
                  margin="normal"
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />

                <TextField
                  select
                  name="account_status"
                  label="Status"
                  fullWidth
                  margin="normal"
                  value={values.account_status}
                  onChange={handleChange}
                  error={touched.account_status && Boolean(errors.account_status)}
                  helperText={touched.account_status && errors.account_status}
                  SelectProps={{
                    native: true
                  }}
                >
                  
                <Field
                  as={TextField}
                  name="wallet"
                  label="Carteira"
                  fullWidth
                  margin="normal"
                  error={touched.wallet && Boolean(errors.wallet)}
                  helperText={touched.wallet && errors.wallet}
                />

                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </TextField>
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

export default Users;

