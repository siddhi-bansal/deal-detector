import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Computed property for authentication state
  const isAuthenticated = !!(user && token);

  // Check for stored auth data on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authToken, userData) => {
    try {
      // Store auth data
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(authToken);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear stored data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      console.log('Logout successful - auth data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  };

  // Debug function to force clear auth data
  const clearAuthData = async () => {
    try {
      await AsyncStorage.clear(); // Clear all AsyncStorage data
      setToken(null);
      setUser(null);
      console.log('All auth data forcefully cleared');
      return true;
    } catch (error) {
      console.error('Error force clearing auth data:', error);
      return false;
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
      setUser(updatedUserData);
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  };

  // Get authorization header for API calls
  const getAuthHeader = () => {
    return token ? `Bearer ${token}` : null;
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    clearAuthData,
    isAuthenticated,
    getAuthHeader,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
