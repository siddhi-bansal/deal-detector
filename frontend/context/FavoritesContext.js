import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);

  // Load favorites from storage on app start
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  };

  const toggleFavorite = (coupon) => {
    const isCurrentlyFavorite = favorites.some(fav => fav.id === coupon.id);
    
    let newFavorites;
    if (isCurrentlyFavorite) {
      // Remove from favorites
      newFavorites = favorites.filter(fav => fav.id !== coupon.id);
    } else {
      // Add to favorites
      newFavorites = [...favorites, { ...coupon, isFavorite: true }];
    }
    
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
    return !isCurrentlyFavorite; // Return new favorite status
  };

  const isFavorite = (couponId) => {
    return favorites.some(fav => fav.id === couponId);
  };

  const removeFavorite = (couponId) => {
    const newFavorites = favorites.filter(fav => fav.id !== couponId);
    setFavorites(newFavorites);
    saveFavorites(newFavorites);
  };

  const getFavoritesCount = () => {
    return favorites.length;
  };

  return (
    <FavoritesContext.Provider value={{
      favorites,
      toggleFavorite,
      isFavorite,
      removeFavorite,
      getFavoritesCount,
    }}>
      {children}
    </FavoritesContext.Provider>
  );
};
