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
  const [isDevMode, setIsDevMode] = useState(false);

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
      const storedDevMode = await AsyncStorage.getItem('isDevMode');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsDevMode(storedDevMode ? JSON.parse(storedDevMode) : false);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (authToken, userData, devMode = false) => {
    try {
      // Store auth data
      await AsyncStorage.setItem('authToken', authToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('isDevMode', JSON.stringify(devMode));
      
      // Update state
      setToken(authToken);
      setUser(userData);
      setIsDevMode(devMode);
      
      return true;
    } catch (error) {
      console.error('Error storing auth data:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Clear stored auth data
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('isDevMode');
      
      // Clear state
      setToken(null);
      setUser(null);
      setIsDevMode(false);
      
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
