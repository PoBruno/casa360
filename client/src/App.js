import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { HouseProvider } from './contexts/HouseContext';

// Layout Components
import Layout from './components/common/Layout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Main Pages
import Dashboard from './pages/Dashboard/Dashboard';
import Casa from './pages/Casa/Casa';
import Frequency from './pages/Frequency/Frequency';
import CostCenter from './pages/CostCenter/CostCenter';
import Category from './pages/Category/Category';
import Payer from './pages/Payer/Payer';
import PayerUsers from './pages/PayerUsers/PayerUsers';
import Currency from './pages/Currency/Currency';
import Entries from './pages/Entries/Entries';
import Installments from './pages/Installments/Installments';
import Transactions from './pages/Transactions/Transactions';

import ApiDebugger from './components/debug/ApiDebugger';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Create MUI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <HouseProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/casa" element={
                <ProtectedRoute>
                  <Layout>
                    <Casa />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/frequency" element={
                <ProtectedRoute>
                  <Layout>
                    <Frequency />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/cost-center" element={
                <ProtectedRoute>
                  <Layout>
                    <CostCenter />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/category" element={
                <ProtectedRoute>
                  <Layout>
                    <Category />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/payer" element={
                <ProtectedRoute>
                  <Layout>
                    <Payer />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/payer-users" element={
                <ProtectedRoute>
                  <Layout>
                    <PayerUsers />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/currency" element={
                <ProtectedRoute>
                  <Layout>
                    <Currency />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/entries" element={
                <ProtectedRoute>
                  <Layout>
                    <Entries />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/installments" element={
                <ProtectedRoute>
                  <Layout>
                    <Installments />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </HouseProvider>
      </AuthProvider>
      {process.env.NODE_ENV === 'development' && <ApiDebugger />}
    </ThemeProvider>
  );
}

export default App;
