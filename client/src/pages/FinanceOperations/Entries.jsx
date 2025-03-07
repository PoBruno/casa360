import React, { useState, useEffect, useCallback, useContext } from 'react';
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
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import EntityTable from '../../components/common/EntityTable';
import api from '../../services/api';
import { HouseContext } from '../../contexts/HouseContext';

// Esquema de validação para entradas financeiras
const entrySchema = Yup.object().shape({
  user_id: Yup.number().required('Usuário é obrigatório'),
  finance_cc_id: Yup.number().required('Centro de custo é obrigatório'),
  finance_category_id: Yup.number().required('Categoria é obrigatória'),
  finance_payer_id: Yup.number().required('Pagador é obrigatório'),
  finance_currency_id: Yup.number().required('Moeda é obrigatória'),
  finance_frequency_id: Yup.number().required('Frequência é obrigatória'),
  is_income: Yup.boolean(),
  amount: Yup.number()
    .required('Valor é obrigatório')
    .min(0.01, 'Valor deve ser maior que zero'),
  start_date: Yup.date().required('Data inicial é obrigatória'),
  end_date: Yup.date().nullable(),
  description: Yup.string().max(255, 'Descrição deve ter no máximo 255 caracteres'),
  installments_count: Yup.number()
    .required('Número de parcelas é obrigatório')
    .min(1, 'Mínimo de 1 parcela'),
  is_fixed: Yup.boolean(),
  is_recurring: Yup.boolean(),
  payment_day: Yup.number()
    .min(1, 'Dia deve ser maior que 0')
    .max(31, 'Dia deve ser menor que 32')
    .nullable()
    .when('is_recurring', {
      is: true,
      then: () => Yup.number().required('Dia de pagamento é obrigatório para recorrência')
    })
});

const Entries = () => {
  const { selectedHouseId } = useContext(HouseContext);
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

  // Fetch entries from API
  const fetchEntries = useCallback(async () => {
    if (!selectedHouseId) return;
    
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

  // Fetch related data for dropdowns
  const fetchRelatedData = useCallback(async () => {
    if (!selectedHouseId) return;
    
    try {
      const [
        usersResponse,
        costCentersResponse,
        categoriesResponse,
        payersResponse,
        currenciesResponse,
        frequenciesResponse
      ] = await Promise.all([
        api.get(`/api/house/${selectedHouseId}/finance-users`),
        api.get(`/api/house/${selectedHouseId}/finance-cc`),
        api.get(`/api/house/${selectedHouseId}/finance-category`),
        api.get(`/api/house/${selectedHouseId}/finance-payer`),
        api.get(`/api/house/${selectedHouseId}/finance-currency`),
        api.get(`/api/house/${selectedHouseId}/finance-frequency`)
      ]);

      setUsers(usersResponse.data);
      setCostCenters(costCentersResponse.data);
      setCategories(categoriesResponse.data);
      setPayers(payersResponse.data);
      setCurrencies(currenciesResponse.data);
      setFrequencies(frequenciesResponse.data);
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
    setNotification({
      open: true,
      message,
      severity
    });
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
      // Garantir que os campos numéricos sejam enviados como números
      const processedValues = {
        ...values,
        amount: parseFloat(values.amount),
        installments_count: parseInt(values.installments_count, 10),
        payment_day: values.is_recurring ? parseInt(values.payment_day, 10) : null
      };

      if (editingEntry) {
        await api.put(`/api/house/${selectedHouseId}/finance-entries/${editingEntry.id}`, processedValues);
        showNotification('Entrada financeira atualizada com sucesso!', 'success');
      } else {
        await api.post(`/api/house/${selectedHouseId}/finance-entries`, processedValues);
        showNotification('Entrada financeira criada com sucesso!', 'success');
      }
      resetForm();
      handleCloseDialog();
      fetchEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      showNotification('Erro ao salvar entrada financeira', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry) => {
    if (window.confirm(`Deseja realmente excluir a entrada "${entry.description}"?`)) {
      try {
        await api.delete(`/api/house/${selectedHouseId}/finance-entries/${entry.id}`);
        showNotification('Entrada financeira excluída com sucesso!', 'success');
        fetchEntries();
      } catch (error) {
        console.error('Error deleting entry:', error);
        showNotification('Erro ao excluir entrada financeira', 'error');
      }
    }
  };

  // Formatar o valor da moeda
  const formatCurrency = (amount, currencyId) => {
    const currency = currencies.find(c => c.id === currencyId);
    const symbol = currency ? currency.symbol : 'R$';
    return `${symbol} ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const columns = [
    { id: 'id', label: 'ID' },
    { id: 'description', label: 'Descrição' },
    { 
      id: 'amount', 
      label: 'Valor', 
      format: (value, row) => {
        const prefix = row.is_income ? '+' : '-';
        return `${prefix} ${formatCurrency(value, row.finance_currency_id)}`;
      }
    },
    { 
      id: 'finance_cc_id', 
      label: 'Centro de Custo',
      format: (value) => {
        const cc = costCenters.find(c => c.id === value);
        return cc ? cc.name : 'N/A';
      }
    },
    { 
      id: 'finance_category_id', 
      label: 'Categoria',
      format: (value) => {
        const category = categories.find(c => c.id === value);
        return category ? category.name : 'N/A';
      }
    },
    { 
      id: 'start_date', 
      label: 'Data Inicial', 
      format: (value) => new Date(value).toLocaleDateString() 
    },
    { id: 'installments_count', label: 'Parcelas' },
    { id: 'is_recurring', label: 'Recorrente', format: (value) => value ? 'Sim' : 'Não' }
  ];

  if (!selectedHouseId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Selecione uma casa para gerenciar entradas financeiras.
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingEntry ? 'Editar Entrada' : 'Nova Entrada'}
        </DialogTitle>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  {/* Tipo de entrada com Switch para visualização melhor */}
                  <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography
                      component="span"
                      sx={{ 
                        color: !values.is_income ? 'error.main' : 'text.secondary',
                        fontWeight: !values.is_income ? 'bold' : 'regular'
                      }}
                    >
                      Despesa
                    </Typography>
                    
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={values.is_income}
                          onChange={(e) => setFieldValue('is_income', e.target.checked)}
                          name="is_income"
                          sx={{ 
                            mx: 2,
                            '& .MuiSvgIcon-root': { fontSize: 28 },
                            color: values.is_income ? 'success.main' : 'error.main'
                          }}
                        />
                      }
                      label=""
                    />
                    
                    <Typography 
                      component="span"
                      sx={{ 
                        color: values.is_income ? 'success.main' : 'text.secondary',
                        fontWeight: values.is_income ? 'bold' : 'regular'
                      }}
                    >
                      Receita
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Grid layout para formulário com 2 colunas */}
                  <Grid container spacing={2}>
                    {/* Primeira coluna */}
                    <Grid item xs={12} md={6}>
                      {/* Campo descrição */}
                      <TextField
                        name="description"
                        label="Descrição"
                        fullWidth
                        margin="normal"
                        value={values.description}
                        onChange={handleChange}
                        error={touched.description && Boolean(errors.description)}
                        helperText={touched.description && errors.description}
                      />

                      {/* Campo valor */}
                      <TextField
                        name="amount"
                        label="Valor"
                        fullWidth
                        margin="normal"
                        type="number"
                        inputProps={{ step: "0.01", min: "0.01" }}
                        value={values.amount}
                        onChange={handleChange}
                        error={touched.amount && Boolean(errors.amount)}
                        helperText={touched.amount && errors.amount}
                      />

                      {/* Campo moeda */}
                      <FormControl 
                        fullWidth 
                        margin="normal"
                        error={touched.finance_currency_id && Boolean(errors.finance_currency_id)}
                      >
                        <InputLabel>Moeda</InputLabel>
                        <Select
                          name="finance_currency_id"
                          value={values.finance_currency_id}
                          label="Moeda"
                          onChange={handleChange}
                        >
                          {currencies.map((currency) => (
                            <MenuItem key={currency.id} value={currency.id}>
                              {currency.symbol} - {currency.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.finance_currency_id && errors.finance_currency_id && (
                          <Typography color="error" variant="caption">
                            {errors.finance_currency_id}
                          </Typography>
                        )}
                      </FormControl>

                      {/* Campo centro de custo */}
                      <FormControl 
                        fullWidth 
                        margin="normal"
                        error={touched.finance_cc_id && Boolean(errors.finance_cc_id)}
                      >
                        <InputLabel>Centro de Custo</InputLabel>
                        <Select
                          name="finance_cc_id"
                          value={values.finance_cc_id}
                          label="Centro de Custo"
                          onChange={handleChange}
                        >
                          {costCenters.map((cc) => (
                            <MenuItem key={cc.id} value={cc.id}>
                              {cc.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.finance_cc_id && errors.finance_cc_id && (
                          <Typography color="error" variant="caption">
                            {errors.finance_cc_id}
                          </Typography>
                        )}
                      </FormControl>

                      {/* Campo categoria */}
                      <FormControl 
                        fullWidth 
                        margin="normal"
                        error={touched.finance_category_id && Boolean(errors.finance_category_id)}
                      >
                        <InputLabel>Categoria</InputLabel>
                        <Select
                          name="finance_category_id"
                          value={values.finance_category_id}
                          label="Categoria"
                          onChange={handleChange}
                        >
                          {categories.map((category) => (
                            <MenuItem key={category.id} value={category.id}>
                              {category.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.finance_category_id && errors.finance_category_id && (
                          <Typography color="error" variant="caption">
                            {errors.finance_category_id}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Segunda coluna */}
                    <Grid item xs={12} md={6}>
                      {/* Campo pagador */}
                      <FormControl 
                        fullWidth 
                        margin="normal"
                        error={touched.finance_payer_id && Boolean(errors.finance_payer_id)}
                      >
                        <InputLabel>Pagador</InputLabel>
                        <Select
                          name="finance_payer_id"
                          value={values.finance_payer_id}
                          label="Pagador"
                          onChange={handleChange}
                        >
                          {payers.map((payer) => (
                            <MenuItem key={payer.id} value={payer.id}>
                              {payer.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.finance_payer_id && errors.finance_payer_id && (
                          <Typography color="error" variant="caption">
                            {errors.finance_payer_id}
                          </Typography>
                        )}
                      </FormControl>

                      {/* Campo usuário */}
                      <FormControl 
                        fullWidth 
                        margin="normal"
                        error={touched.user_id && Boolean(errors.user_id)}
                      >
                        <InputLabel>Usuário Responsável</InputLabel>
                        <Select
                          name="user_id"
                          value={values.user_id}
                          label="Usuário Responsável"
                          onChange={handleChange}
                        >
                          {users.map((user) => (
                            <MenuItem key={user.id} value={user.id}>
                              {user.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.user_id && errors.user_id && (
                          <Typography color="error" variant="caption">
                            {errors.user_id}
                          </Typography>
                        )}
                      </FormControl>

                      {/* Campo data inicial */}
                      <DatePicker
                        label="Data Inicial"
                        value={values.start_date ? new Date(values.start_date) : null}
                        onChange={(date) => setFieldValue('start_date', date)}
                        slotProps={{
                          textField: {
                            margin: 'normal',
                            fullWidth: true,
                            error: touched.start_date && Boolean(errors.start_date),
                            helperText: touched.start_date && errors.start_date
                          }
                        }}
                      />

                      {/* Número de parcelas */}
                      <TextField
                        name="installments_count"
                        label="Número de Parcelas"
                        fullWidth
                        margin="normal"
                        type="number"
                        inputProps={{ min: "1", step: "1" }}
                        value={values.installments_count}
                        onChange={handleChange}
                        error={touched.installments_count && Boolean(errors.installments_count)}
                        helperText={touched.installments_count && errors.installments_count}
                      />

                      {/* Frequência */}
                      <FormControl 
                        fullWidth 
                        margin="normal"
                        error={touched.finance_frequency_id && Boolean(errors.finance_frequency_id)}
                      >
                        <InputLabel>Frequência</InputLabel>
                        <Select
                          name="finance_frequency_id"
                          value={values.finance_frequency_id}
                          label="Frequência"
                          onChange={handleChange}
                        >
                          {frequencies.map((frequency) => (
                            <MenuItem key={frequency.id} value={frequency.id}>
                              {frequency.name} ({frequency.days_interval} dias)
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.finance_frequency_id && errors.finance_frequency_id && (
                          <Typography color="error" variant="caption">
                            {errors.finance_frequency_id}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>

                    {/* Configurações adicionais com largura completa */}
                    <Grid item xs={12}>
                      <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Configurações adicionais
                        </Typography>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={values.is_fixed}
                                  onChange={handleChange}
                                  name="is_fixed"
                                />
                              }
                              label="Valor Fixo"
                            />
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={values.is_recurring}
                                  onChange={(e) => {
                                    setFieldValue('is_recurring', e.target.checked);
                                    if (!e.target.checked) {
                                      setFieldValue('payment_day', null);
                                    }
                                  }}
                                  name="is_recurring"
                                />
                              }
                              label="Recorrente"
                            />
                          </Grid>

                          {values.is_recurring && (
                            <Grid item xs={12} md={4}>
                              <TextField
                                name="payment_day"
                                label="Dia de Pagamento"
                                fullWidth
                                type="number"
                                inputProps={{ min: "1", max: "31", step: "1" }}
                                value={values.payment_day || ''}
                                onChange={handleChange}
                                error={touched.payment_day && Boolean(errors.payment_day)}
                                helperText={touched.payment_day && errors.payment_day}
                              />
                            </Grid>
                          )}

                          <Grid item xs={12}>
                            <DatePicker
                              label="Data Final (opcional)"
                              value={values.end_date ? new Date(values.end_date) : null}
                              onChange={(date) => setFieldValue('end_date', date)}
                              slotProps={{
                                textField: {
                                  margin: 'normal',
                                  fullWidth: true,
                                  error: touched.end_date && Boolean(errors.end_date),
                                  helperText: touched.end_date && errors.end_date
                                }
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>
                </DialogContent>
                <DialogActions>
                  <Button onClick={handleCloseDialog} color="inherit">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    color="primary" 
                    variant="contained"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : (editingEntry ? 'Salvar' : 'Adicionar')}
                  </Button>
                </DialogActions>
              </Form>
            )}
          </Formik>
        </LocalizationProvider>
      </Dialog>
    </Box>
  );
};

export default Entries;