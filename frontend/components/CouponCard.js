import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { styles } from '../styles/styles';

export const CouponCard = ({ coupon, onPress }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);

  // Fetch company logo when component mounts
  useEffect(() => {
    const fetchLogo = async () => {
      if (!coupon.email_sender) {
        setLogoLoading(false);
        return;
      }

      try {
        // Replace with your actual IP address
        const response = await fetch(`http://192.168.86.32:8000/api/logo/${encodeURIComponent(coupon.email_sender)}`);
        const data = await response.json();
        
        if (data.success && data.logo_url) {
          setLogoUrl(data.logo_url);
        }
      } catch (error) {
        console.log('Error fetching logo:', error);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLogo();
  }, [coupon.email_sender]);
  const getDiscountGradient = (discountType) => {
    switch (discountType) {
      case 'percentage':
        return ['#22c55e', '#16a34a']; // Green gradient
      case 'fixed_amount':
        return ['#3b82f6', '#1d4ed8']; // Blue gradient
      case 'free_shipping':
        return ['#f59e0b', '#d97706']; // Orange gradient
      case 'other':
        return ['#a855f7', '#7c3aed']; // Purple gradient
      default:
        return ['#6b7280', '#4b5563']; // Gray gradient
    }
  };

  const getOfferTypeIcon = (offerType) => {
    switch (offerType) {
      case 'sale':
        return 'pricetag';
      case 'coupon':
        return 'ticket';
      case 'free_shipping':
        return 'car';
      case 'loyalty_points':
        return 'star';
      case 'free_item':
        return 'gift';
      case 'free_account':
        return 'person-add';
      default:
        return 'pricetag';
    }
  };

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

  const isUrgent = coupon.urgency_indicators && coupon.urgency_indicators.length > 0;
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
      <View style={styles.cardHeader}>
        <View style={styles.companyRow}>
          <View style={styles.logoContainer}>
            {logoUrl && !logoLoading ? (
              <>
                <Image
                  source={{ uri: logoUrl }}
                  style={styles.companyLogo}
                  onError={() => setLogoUrl(null)} // Fallback on error
                />
                <View style={styles.offerTypeBadge}>
                  <Ionicons 
                    name={getOfferTypeIcon(coupon.offer_type)} 
                    size={12} 
                    color="#fff" 
                  />
                </View>
              </>
            ) : (
              <View style={styles.fallbackIconContainer}>
                {logoLoading ? (
                  <View style={styles.logoSkeleton} />
                ) : (
                  <Ionicons 
                    name={getOfferTypeIcon(coupon.offer_type)} 
                    size={22} 
                    color={getDiscountGradient(coupon.discount_type)[0]} 
                  />
                )}
              </View>
            )}
          </View>
          <Text style={styles.companyName}>{coupon.company}</Text>
        </View>
        {coupon.discount_amount && (
          <LinearGradient
            colors={getDiscountGradient(coupon.discount_type)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.discountBadge}
          >
            <Text style={styles.discountText}>{coupon.discount_amount}</Text>
          </LinearGradient>
        )}
      </View>

      <Text style={styles.offerTitle}>{coupon.offer_title}</Text>
      <Text style={styles.offerDescription} numberOfLines={2}>
        {coupon.offer_description}
      </Text>

      {/* Show coupon code prominently on main card */}
      {coupon.coupon_code && (
        <View style={styles.mainCodeContainer}>
          <Ionicons name="ticket" size={16} color="#4CAF50" />
          <Text style={styles.mainCodeLabel}>Code:</Text>
          <Text style={styles.mainCodeText}>{coupon.coupon_code}</Text>
          <TouchableOpacity style={styles.copyButton}>
            <Ionicons name="copy" size={14} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardDetails}>
        {coupon.expiry_date && (
          <View style={styles.expiryContainer}>
            <Ionicons name="time" size={14} color="#666" />
            <Text style={[styles.expiryText, expiringSoon && styles.urgentText]}>
              Expires: {formatDate(coupon.expiry_date)}
            </Text>
            {daysLeft !== null && (
              <Text style={[
                styles.daysLeft,
                daysLeft <= 3 ? styles.urgentExpiry : 
                daysLeft <= 0 ? styles.expiredExpiry : styles.normalExpiry
              ]}>
                {daysLeft > 0 ? ` (${daysLeft} days left)` : 
                 daysLeft === 0 ? ' (Expires today!)' : ' (Expired)'}
              </Text>
            )}
          </View>
        )}

        {coupon.minimum_purchase && (
          <Text style={styles.minPurchase}>
            Min purchase: {coupon.minimum_purchase}
          </Text>
        )}
      </View>

      {isUrgent && (
        <LinearGradient
          colors={['#ef4444', '#dc2626']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.urgencyBadge}
        >
          <Ionicons name="flash" size={12} color="#fff" />
          <Text style={styles.urgencyText}>
            {coupon.urgency_indicators[0]}
          </Text>
        </LinearGradient>
      )}

      {/* Favorite Heart Button Row */}
      <View style={styles.favoriteRow}>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isFavorite(coupon.id) ? 'heart' : 'heart-outline'} 
            size={24} 
            color={isFavorite(coupon.id) ? '#ef4444' : '#9ca3af'} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.tapForMore}>Tap for details</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );
};
