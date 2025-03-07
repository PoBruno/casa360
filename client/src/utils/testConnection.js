import api from '../services/api';

// Testing connection to backend
const testConnection = async () => {
  try {
    console.log('Testing API connection...');
    const response = await api.get('/api/auth/profile');
    console.log('Connection successful:', response.data);
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};

// Testing login
const testLogin = async (email, password) => {
  try {
    console.log('Testing login...');
    const response = await api.post('/api/auth/login', { email, password });
    console.log('Login successful:', response.data);
    return true;
  } catch (error) {
    console.error('Login test failed:', error);
    return false;
  }
};

// Test the login endpoint directly
const testApiLogin = async () => {
  try {
    console.log('Testing login endpoint...');
    const testCredentials = {
      email: 'bruno@domain.com', // Replace with valid credentials for testing
      password: '123'
    };
    
    // Log request details
    console.log('Sending request to:', `${api.defaults.baseURL}/api/auth/login`);
    console.log('With data:', testCredentials);
    
    const response = await api.post('/api/auth/login', testCredentials);
    console.log('Login test response:', response.data);
    return true;
  } catch (error) {
    console.error('Login test failed:', error.response?.data || error.message);
    // Look for specific error patterns
    if (error.response) {
      console.log('Status code:', error.response.status);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      console.log('No response received - network error');
    }
    return false;
  }
};

export { testConnection, testLogin, testApiLogin };