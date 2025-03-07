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
  MenuItem
} from '@mui/material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import EntityTable from '../../components/common/EntityTable';
import api from '../../services/api';

const categorySchema = Yup.object().shape({
  name: Yup.string()
    .required('Nome é obrigatório')
    .min(2, 'Nome muito curto')
    .max(100, 'Nome muito longo'),
  description: Yup.string()
    .max(500, 'Descrição muito longa'),
  parent_category_id: Yup.number()
    .nullable()
});

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [parentCategories, setParentCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  
  const selectedHouseId = localStorage.getItem('selectedHouseId');

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/house/${selectedHouseId}/finance-category`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Falha ao carregar categorias', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedHouseId]);

  useEffect(() => {
    if (selectedHouseId) {
      fetchCategories();
    }
  }, [selectedHouseId, fetchCategories]);

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleOpenAddDialog = () => {
    setEditingCategory(null);
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (editingCategory) {
        await api.put(`/api/house/${selectedHouseId}/finance-category/${editingCategory.id}`, values);
        showNotification('Categoria atualizada com sucesso!', 'success');
      } else {
        await api.post(`/api/house/${selectedHouseId}/finance-category`, values);
        showNotification('Categoria criada com sucesso!', 'success');
      }
      resetForm();
      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showNotification('Erro ao salvar categoria', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    if (window.confirm(`Deseja realmente excluir a categoria "${category.name}"?`)) {
      try {
        await api.delete(`/api/house/${selectedHouseId}/finance-category/${category.id}`);
        showNotification('Categoria excluída com sucesso!', 'success');
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        showNotification('Erro ao excluir categoria', 'error');
      }
    }
  };

  const getParentCategoryName = (parentId) => {
    const parent = categories.find(cat => cat.id === parentId);
    return parent ? parent.name : '-';
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'name', label: 'Nome' },
    { 
      id: 'parent_category_id', 
      label: 'Categoria Pai',
      format: (value) => value ? getParentCategoryName(value) : 'Categoria Principal'
    },
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
          Selecione uma casa para gerenciar categorias.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <EntityTable
        title="Categorias"
        data={categories}
        columns={columns}
        isLoading={loading}
        onAdd={handleOpenAddDialog}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
        addButtonLabel="Nova Categoria"
      />

      {/* Dialog for Add/Edit */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
        </DialogTitle>
        <Formik
          initialValues={{
            name: editingCategory?.name || '',
            description: editingCategory?.description || '',
            parent_category_id: editingCategory?.parent_category_id || ''
          }}
          validationSchema={categorySchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, errors, touched, values, setFieldValue }) => (
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

                <FormControl 
                  fullWidth 
                  margin="normal"
                  error={touched.parent_category_id && Boolean(errors.parent_category_id)}
                >
                  <InputLabel id="parent-category-label">Categoria Pai</InputLabel>
                  <Select
                    labelId="parent-category-label"
                    value={values.parent_category_id}
                    onChange={(e) => setFieldValue('parent_category_id', e.target.value)}
                    label="Categoria Pai"
                  >
                    <MenuItem value="">
                      <em>Nenhuma</em>
                    </MenuItem>
                    {parentCategories.map((category) => (
                      <MenuItem 
                        key={category.id} 
                        value={category.id}
                        disabled={editingCategory && editingCategory.id === category.id}
                      >
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Field
                  as={TextField}
                  name="description"
                  label="Descrição"
                  fullWidth
                  margin="normal"
                  multiline
                  rows={4}
                  error={touched.description && Boolean(errors.description)}
                  helperText={touched.description && errors.description}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog} color="secondary">
                  Cancelar
                </Button>
                <Button type="submit" color="primary" disabled={isSubmitting}>
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
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Category;