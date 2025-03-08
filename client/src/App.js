import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
import { HouseProvider } from './contexts/HouseContext';
import { MenuProvider } from './contexts/MenuContext';
import { ThemeContext } from './contexts/ThemeContext';

// Layout Components
import Layout from './components/common/Layout';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Routes
import routes from './routes';

// Debug Components
import ApiDebugger from './components/debug/ApiDebugger';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  console.log('ProtectedRoute component rendering', { token });
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Create MUI Theme with better contrast and accessibility
const lightTheme = createTheme({
  palette: {
    primary: {
      main: '#1565C0', // Deeper blue for better contrast
      light: '#4791db',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#E91E63', // More vibrant pink
      light: '#F48FB1',
      dark: '#C2185B',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa', // Subtle off-white for less eye strain
      paper: '#ffffff',   // Pure white for cards
    },
    text: {
      primary: '#212121', // Very dark gray, almost black
      secondary: '#5f6368', // Medium gray for secondary text
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#64B5F6', // Brighter blue that stands out on dark backgrounds
      light: '#90CAF9',
      dark: '#42A5F5',
      contrastText: '#000000', // Black text on bright blue for better contrast
    },
    secondary: {
      main: '#FF4081', // Bright pink that pops on dark backgrounds
      light: '#FF80AB',
      dark: '#F50057',
      contrastText: '#000000', // Black text on bright pink
    },
    background: {
      default: '#121212', // Darker background
      paper: 'rgba(37, 37, 37, 0.9)', // Less transparent for better contrast
    },
    text: {
      primary: '#FFFFFF', // Pure white for main text
      secondary: '#B0BEC5', // Lighter gray-blue for secondary text
    },
    divider: 'rgba(255, 255, 255, 0.15)', // More visible divider
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(8px)',
          boxShadow: '0 8px 20px 0 rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0))',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: '0 3px 10px 0 rgba(0, 0, 0, 0.3)',
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.3)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(50, 50, 50, 0.8)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(100, 181, 246, 0.2)',
          },
        },
      },
    },
  },
});

function App() {
  // Use the ThemeContext to get the current theme
  const { theme } = useContext(ThemeContext);

  // Determine which theme to use based on the theme context
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;

  console.log('App component rendering with theme:', theme); // Debug log

  return (
    <MuiThemeProvider theme={currentTheme}>
      <CssBaseline />
      <AuthProvider>
        <HouseProvider>
          <MenuProvider>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes - Generated from routes configuration */}
              {routes.map((route) => (
                <Route 
                  key={route.path} 
                  path={route.path}
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <route.component />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              ))}
            </Routes>
            
            {/* Debug tool */}
            <ApiDebugger />
          </MenuProvider>
        </HouseProvider>
      </AuthProvider>
    </MuiThemeProvider>
  );
}

export default App;
