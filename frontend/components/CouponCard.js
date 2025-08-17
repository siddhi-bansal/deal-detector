import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { getOfferTypeColors, getOfferTypeLabel, getOfferTypeIcon } from '../utils/offerTypeColors';
import { styles } from '../styles/styles';

export const CouponCard = ({ coupon, onPress }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [logoError, setLogoError] = useState(false);

  // Use logo data directly from coupon response - no need to fetch
  const logoUrl = coupon.company_logo_url;
  const logoLoading = false; // No loading needed since data comes with coupon

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No expiry date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const getDaysUntilExpiry = (dateStr) => {
    if (!dateStr) return null;
    try {
      const expiryDate = new Date(dateStr);
      const today = new Date();
      const diffTime = expiryDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const expiringSoon = isExpiringSoon(coupon.expiry_date);
  const daysLeft = getDaysUntilExpiry(coupon.expiry_date);

  const handleCardPress = () => {
    onPress(coupon);
  };

  const handleFavoritePress = (e) => {
    e.stopPropagation(); // Prevent card press when tapping heart
    toggleFavorite(coupon);
  };

  return (
    <TouchableOpacity 
      style={[styles.card, expiringSoon && styles.urgentCard]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      {/* Header with Company Logo and Name */}
      <View style={styles.cardHeader}>
        <View style={styles.companyRow}>
          <View style={styles.logoContainer}>
            {logoUrl && !logoError ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.companyLogo}
                resizeMode="contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <View style={styles.fallbackIconContainer}>
                <Ionicons 
                  name="business" 
                  size={24} 
                  color="#9ca3af" 
                />
              </View>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {coupon.email_sender_company || coupon.company}
            </Text>
            {coupon.offer_brand && coupon.offer_brand !== (coupon.email_sender_company || coupon.company) && (
              <Text style={styles.offerBrandName}>
                {coupon.offer_brand}
              </Text>
            )}
            {/* Discount Type Tag */}
            <View style={[
              styles.discountTypeTag,
              {
                backgroundColor: getOfferTypeColors(coupon.offer_type).background,
                borderColor: getOfferTypeColors(coupon.offer_type).border
              }
            ]}>
              <Text style={[
                styles.discountTypeText,
                { color: getOfferTypeColors(coupon.offer_type).text }
              ]}>
                {getOfferTypeLabel(coupon.offer_type)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.cardContent}>
        {/* Discount Title */}
        <Text style={styles.discountTitle} numberOfLines={2}>
          {coupon.offer_title || coupon.offer_description || 'Special Offer'}
        </Text>
        
        {/* Discount Amount Badge */}
        {coupon.discount_amount && (
          <View style={styles.discountAmountContainer}>
            <LinearGradient
              colors={getOfferTypeColors(coupon.offer_type).gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.discountBadge}
            >
              <Text style={styles.discountText}>{coupon.discount_amount}</Text>
            </LinearGradient>
          </View>
        )}
      </View>

      {/* Footer with Favorite Button and Expiry */}
      <View style={styles.cardFooterContainer}>
        {/* Favorite Button Row */}
        <View style={styles.favoriteRow}>
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={handleFavoritePress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFavorite(coupon.id) ? 'heart' : 'heart-outline'} 
              size={20} 
              color={isFavorite(coupon.id) ? '#ef4444' : '#9ca3af'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Expiry Info Row */}
        <View style={styles.cardFooter}>
          <View style={styles.expiryInfo}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={[styles.expiryText, expiringSoon && styles.urgentText]}>
              {coupon.expiry_date ? formatDate(coupon.expiry_date) : 'No expiry'}
            </Text>
            {daysLeft !== null && daysLeft <= 7 && (
              <View style={[styles.urgencyDot, expiringSoon && styles.urgentDot]} />
            )}
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
};
