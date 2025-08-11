import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { CouponCard } from '../components/CouponCard';
import { CouponDetailModal } from '../components/CouponDetailModal';
import { styles } from '../styles/styles';

export const FavoritesScreen = ({ navigation }) => {
  const { favorites, removeFavorite } = useFavorites();
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCardPress = (coupon) => {
    setSelectedCoupon(coupon);
    setModalVisible(true);
  };

  const handleRemoveFromFavorites = (couponId) => {
    removeFavorite(couponId);
  };

  const renderCouponCard = ({ item }) => (
    <CouponCard coupon={item} onPress={() => handleCardPress(item)} />
  );

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.favoritesHeader}>
          <Ionicons name="heart" size={32} color="#ef4444" />
          <Text style={styles.favoritesTitle}>Favorite Coupons</Text>
          <Text style={styles.favoritesSubtitle}>
            {favorites.length} saved coupon{favorites.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No favorite coupons yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the heart icon on any coupon to add it to your favorites
            </Text>
            <View style={styles.favoriteHintContainer}>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.favoriteHintBadge}
                >
                  <Ionicons name="home" size={16} color="white" />
                  <Text style={styles.favoriteHintText}>Go to Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderCouponCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.cardList}
            showsVerticalScrollIndicator={true}
          />
        )}

        <CouponDetailModal
          visible={modalVisible}
          coupon={selectedCoupon}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </LinearGradient>
  );
};
