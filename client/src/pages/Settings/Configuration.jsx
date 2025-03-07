import React, { useState, useEffect, useContext } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext'; // Import ThemeContext
import api from '../../services/api';

// Schema for profile update
const profileSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Nome muito curto')
    .max(50, 'Nome muito longo')
    .required('Nome é obrigatório'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório')
});

// Schema for password change
const passwordSchema = Yup.object().shape({
  currentPassword: Yup.string()
    .required('Senha atual é obrigatória'),
  newPassword: Yup.string()
    .min(6, 'A nova senha deve ter pelo menos 6 caracteres')
    .required('Nova senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'As senhas não conferem')
    .required('Confirmação de senha é obrigatória')
});

// Schema for notifications settings
const notificationsSchema = Yup.object().shape({
  emailNotifications: Yup.boolean(),
  paymentReminders: Yup.boolean(),
  dueNotifications: Yup.boolean(),
  financialAlerts: Yup.boolean()
});

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      sx={{ py: 3 }}
    >
      {value === index && children}
    </Box>
  );
}

const Configuration = () => {
  const { user, logout } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    paymentReminders: true,
    dueNotifications: true,
    financialAlerts: false
  });
  const { theme, toggleTheme } = useContext(ThemeContext); // Use ThemeContext

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchNotificationSettings();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/auth/profile');
      setUserData(response.data.user);
    } catch (error) {
      showNotification('Erro ao buscar dados do usuário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      // This endpoint doesn't exist yet, but would be useful to add
      const response = await api.get('/api/users/notification-settings');
      if (response.data) {
        setNotificationSettings(response.data);
      }
    } catch (error) {
      // Fail silently - use defaults if endpoint doesn't exist yet
      console.log('Notification settings endpoint not implemented yet');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const showNotification = (message, severity) => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleUpdateProfile = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      const response = await api.put('/api/auth/update-profile', {
        username: values.username,
        email: values.email
      });
      
      showNotification('Perfil atualizado com sucesso', 'success');
      setUserData(response.data.user);
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao atualizar perfil',
        'error'
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (values, { setSubmitting, resetForm }) => {
    try {
      setLoading(true);
      await api.put('/api/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      showNotification('Senha atualizada com sucesso', 'success');
      resetForm();
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao atualizar senha',
        'error'
      );
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleUpdateNotifications = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      // This endpoint doesn't exist yet, but would be useful to add
      await api.put('/api/users/notification-settings', values);
      
      setNotificationSettings(values);
      showNotification('Preferências de notificação atualizadas', 'success');
    } catch (error) {
      showNotification(
        'Erro ao atualizar preferências de notificação',
        'error'
      );
      console.error('API endpoint not implemented:', error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Você tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/api/users/account');
      
      showNotification('Conta excluída com sucesso', 'success');
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Erro ao excluir conta',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" mb={3}>
          <Grid item>
            <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h5" gutterBottom>
              Configurações da Conta
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {userData?.email}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
            <Tab icon={<PersonIcon />} label="Perfil" id="settings-tab-0" />
            <Tab icon={<SecurityIcon />} label="Segurança" id="settings-tab-1" />
            <Tab icon={<NotificationsIcon />} label="Notificações" id="settings-tab-2" />
            <Tab icon={<SettingsIcon />} label="Avançado" id="settings-tab-3" />
          </Tabs>
        </Box>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Formik
            initialValues={{
              username: userData?.username || '',
              email: userData?.email || ''
            }}
            validationSchema={profileSchema}
            onSubmit={handleUpdateProfile}
            enableReinitialize
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      name="username"
                      label="Nome"
                      fullWidth
                      variant="outlined"
                      error={touched.username && Boolean(errors.username)}
                      helperText={touched.username && errors.username}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      name="email"
                      label="Email"
                      fullWidth
                      variant="outlined"
                      error={touched.email && Boolean(errors.email)}
                      helperText={touched.email && errors.email}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || loading}
                    >
                      {(isSubmitting || loading) ? <CircularProgress size={24} /> : 'Salvar Alterações'}
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Alterar Senha
          </Typography>
          <Formik
            initialValues={{
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            }}
            validationSchema={passwordSchema}
            onSubmit={handleChangePassword}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Field
                      as={TextField}
                      name="currentPassword"
                      label="Senha Atual"
                      type="password"
                      fullWidth
                      variant="outlined"
                      error={touched.currentPassword && Boolean(errors.currentPassword)}
                      helperText={touched.currentPassword && errors.currentPassword}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      name="newPassword"
                      label="Nova Senha"
                      type="password"
                      fullWidth
                      variant="outlined"
                      error={touched.newPassword && Boolean(errors.newPassword)}
                      helperText={touched.newPassword && errors.newPassword}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Field
                      as={TextField}
                      name="confirmPassword"
                      label="Confirmar Nova Senha"
                      type="password"
                      fullWidth
                      variant="outlined"
                      error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                      helperText={touched.confirmPassword && errors.confirmPassword}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || loading}
                    >
                      {(isSubmitting || loading) ? <CircularProgress size={24} /> : 'Alterar Senha'}
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Preferências de Notificação
          </Typography>
          <Formik
            initialValues={notificationSettings}
            validationSchema={notificationsSchema}
            onSubmit={handleUpdateNotifications}
            enableReinitialize
          >
            {({ isSubmitting, values, handleChange }) => (
              <Form>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.emailNotifications}
                          onChange={handleChange}
                          name="emailNotifications"
                          color="primary"
                        />
                      }
                      label="Receber notificações por email"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.paymentReminders}
                          onChange={handleChange}
                          name="paymentReminders"
                          color="primary"
                        />
                      }
                      label="Lembretes de pagamento"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.dueNotifications}
                          onChange={handleChange}
                          name="dueNotifications"
                          color="primary"
                        />
                      }
                      label="Notificações de vencimento"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={values.financialAlerts}
                          onChange={handleChange}
                          name="financialAlerts"
                          color="primary"
                        />
                      }
                      label="Alertas financeiros"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting || loading}
                    >
                      {(isSubmitting || loading) ? <CircularProgress size={24} /> : 'Salvar Preferências'}
                    </Button>
                  </Grid>
                </Grid>
              </Form>
            )}
          </Formik>
        </TabPanel>

        {/* Advanced Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            Configurações Avançadas
          </Typography>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium">
              Tema da Aplicação
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Escolha entre tema claro ou escuro para a interface.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button 
                variant={theme === 'light' ? 'contained' : 'outlined'} 
                color="primary"
                onClick={() => theme !== 'light' && toggleTheme()}
                startIcon={<LightModeIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  boxShadow: theme === 'light' ? 4 : 0,
                  backgroundColor: theme === 'light' ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: theme === 'light' ? 'primary.dark' : 'rgba(100, 181, 246, 0.08)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Tema Claro
              </Button>
              
              <Button 
                variant={theme === 'dark' ? 'contained' : 'outlined'} 
                color="primary"
                onClick={() => theme !== 'dark' && toggleTheme()}
                startIcon={<DarkModeIcon />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1.2,
                  boxShadow: theme === 'dark' ? 4 : 0,
                  backgroundColor: theme === 'dark' ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: theme === 'dark' ? 'primary.dark' : 'rgba(100, 181, 246, 0.08)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Tema Escuro
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle1" gutterBottom fontWeight="medium" color="error">
              Zona de Perigo
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Excluir sua conta é uma ação permanente e irá apagar todos os seus dados.
            </Typography>
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleDeleteAccount}
              disabled={loading}
              sx={{ borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Excluir Minha Conta'}
            </Button>
          </Box>
        </TabPanel>
      </Paper>

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

export default Configuration;