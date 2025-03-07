import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, 
  CardActions, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, Chip,
  TextField
} from '@mui/material';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Add as AddIcon, Home as HomeIcon } from '@mui/icons-material';
import api from '../../services/api';
import { HouseContext } from '../../contexts/HouseContext';

const houseSchema = Yup.object().shape({
  houseName: Yup.string()
    .min(3, 'Nome muito curto')
    .max(50, 'Nome muito longo')
    .required('Nome da casa é obrigatório'),
});

const Casa = () => {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const { selectedHouseId, selectHouse } = useContext(HouseContext);

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/houses/my-houses');
      setHouses(response.data.houses || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching houses:', error);
      showNotification('Falha ao carregar casas. Por favor, tente novamente.', 'error');
      setLoading(false);
    }
  };

  const handleCreateHouse = async (values, { resetForm, setSubmitting }) => {
    try {
      await api.post('/api/houses', values);
      resetForm();
      setOpenDialog(false);
      showNotification('Casa criada com sucesso!', 'success');
      fetchHouses();
    } catch (error) {
      console.error('Error creating house:', error);
      showNotification('Falha ao criar casa. Por favor, tente novamente.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectHouse = (houseId) => {
    selectHouse(houseId);
    showNotification('Casa selecionada com sucesso!', 'success');
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Minhas Casas
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Nova Casa
        </Button>
      </Box>

      {houses.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Você não possui casas cadastradas.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Clique em "Nova Casa" para começar.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {houses.map((house) => (
            <Grid item xs={12} sm={6} md={4} key={house.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: selectedHouseId === house.id ? '2px solid #1976d2' : 'none',
                  boxShadow: selectedHouseId === house.id ? '0 0 10px rgba(25, 118, 210, 0.5)' : undefined
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h5" component="div">
                      {house.house_name}
                    </Typography>
                    {selectedHouseId === house.id && (
                      <Chip 
                        label="Selecionada" 
                        color="primary" 
                        size="small"
                        icon={<HomeIcon />}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    Função: {house.role === 'owner' ? 'Proprietário' : 'Convidado'}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Criada em: {new Date(house.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    variant={selectedHouseId === house.id ? "outlined" : "contained"}
                    color="primary"
                    onClick={() => handleSelectHouse(house.id)}
                    disabled={selectedHouseId === house.id}
                    fullWidth
                  >
                    {selectedHouseId === house.id ? 'Casa Selecionada' : 'Selecionar Casa'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Dialog for creating new house */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Criar Nova Casa</DialogTitle>
        <Formik
          initialValues={{ houseName: '' }}
          validationSchema={houseSchema}
          onSubmit={handleCreateHouse}
        >
          {({ isSubmitting }) => (
            <Form>
              <DialogContent>
                <Field
                  component={TextField}
                  name="houseName"
                  label="Nome da Casa"
                  fullWidth
                  variant="outlined"
                  margin="normal"
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Criando...' : 'Criar'}
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
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Casa;