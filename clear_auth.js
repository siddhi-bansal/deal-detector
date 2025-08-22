// Quick script to clear AsyncStorage auth data
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearAuth = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
    console.log('Auth data cleared!');
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

clearAuth();
