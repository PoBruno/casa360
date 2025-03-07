import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert
} from '@mui/material';
import { AuthContext } from '../../contexts/AuthContext';

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Nome muito curto')
    .max(50, 'Nome muito longo')
    .required('Nome é obrigatório'),
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Senhas não conferem')
    .required('Confirmação de senha é obrigatória')
});

const Register = () => {
  const { register } = useContext(AuthContext);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (values, { setSubmitting }) => {
    try {
      if (values.password !== values.confirmPassword) {
        setError('Senhas não conferem');
        return;
      }

      await register({
        username: values.username,
        email: values.email,
        password: values.password
      });
      
      // After successful registration, navigate to login
      navigate('/login', { 
        state: { message: 'Cadastro realizado com sucesso. Faça login para continuar.' } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar usuário');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Casa360
          </Typography>
          <Typography component="h2" variant="h6" align="center" gutterBottom>
            Cadastro
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Formik
            initialValues={{ 
              username: '', 
              email: '', 
              password: '', 
              confirmPassword: '' 
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleRegister}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <Field
                  as={TextField}
                  name="username"
                  label="Nome"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={touched.username && Boolean(errors.username)}
                  helperText={touched.username && errors.username}
                />
                <Field
                  as={TextField}
                  name="email"
                  label="Email"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                />
                <Field
                  as={TextField}
                  name="password"
                  label="Senha"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                />
                <Field
                  as={TextField}
                  name="confirmPassword"
                  label="Confirmar Senha"
                  type="password"
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  helperText={touched.confirmPassword && errors.confirmPassword}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  sx={{ mt: 3, mb: 2 }}
                >
                  Cadastrar
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    Já tem uma conta? Faça login
                  </Link>
                </Box>
              </Form>
            )}
          </Formik>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;