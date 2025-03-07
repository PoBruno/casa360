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
      const response = await api.get(`/api/house/${selectedHouseId}/finance-users`);
      setPayers(response.data);
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
        await api.put(`/house/${selectedHouseId}/finance-users/${editingPayer.id}`, values);
        showNotification('Usuário atualizado com sucesso', 'success');
      } else {
        await api.post(`/house/${selectedHouseId}/finance-users`, values);
        showNotification('Usuário criado com sucesso', 'success');
      }
      handleCloseDialog();
      resetForm();
      fetchPayers();
    } catch (error) {
      console.error('Error saving payer:', error);
      showNotification('Erro ao salvar Usuário', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (payer) => {
    if (window.confirm(`Deseja realmente excluir o Usuário "${payer.name}"?`)) {
      try {
        await api.delete(`/house/${selectedHouseId}/finance-payer/${payer.id}`);
        showNotification('Usuário excluído com sucesso', 'success');
        fetchPayers();
      } catch (error) {
        console.error('Error deleting payer:', error);
        showNotification('Erro ao excluir Usuário', 'error');
      }
    }
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nome' },
    { id: 'wallet', label: 'Carteira' },
    { id: 'account_status', label: 'Status' },
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
          Por favor, selecione uma casa para gerenciar Usuárioes.
        </Alert>
      </Box>
    );
  }

 