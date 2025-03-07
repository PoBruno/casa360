import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        // Use the correct endpoint for fetching user profile
        const response = await api.get('/api/auth/profile');
        setUser(response.data.user);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }, []);

  const login = async (email, password) => {
    try {
      console.log(`Attempting login to: ${api.defaults.baseURL}/api/auth/login`);
      console.log('Login credentials:', { email, password: '****' });
      
      const response = await api.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      
      console.log('Login successful, received token and user data');
      localStorage.setItem('token', token);
      setUser(user);
      return user;
    } catch (error) {
      console.error('Login error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: `${api.defaults.baseURL}/api/auth/login`
      });
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('selectedHouseId');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      authenticated: !!user, 
      user, 
      loading, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};