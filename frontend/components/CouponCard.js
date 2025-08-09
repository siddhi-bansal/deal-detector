import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';

export const CouponCard = ({ coupon, onPress }) => {
  const getDiscountColor = (discountType) => {
    switch (discountType) {
      case 'percentage':
        return '#4CAF50'; // Green
      case 'fixed_amount':
        return '#2196F3'; // Blue
      case 'free_shipping':
        return '#FF9800'; // Orange
      case 'other':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Gray
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

  return (
    <TouchableOpacity 
      style={[styles.card, expiringSoon && styles.urgentCard]}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.companyRow}>
          <Ionicons 
            name={getOfferTypeIcon(coupon.offer_type)} 
            size={20} 
            color={getDiscountColor(coupon.discount_type)} 
          />
          <Text style={styles.companyName}>{coupon.company}</Text>
        </View>
        {coupon.discount_amount && (
          <View style={[styles.discountBadge, { backgroundColor: getDiscountColor(coupon.discount_type) }]}>
            <Text style={styles.discountText}>{coupon.discount_amount}</Text>
          </View>
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
        <View style={styles.urgencyBadge}>
          <Ionicons name="flash" size={12} color="#fff" />
          <Text style={styles.urgencyText}>
            {coupon.urgency_indicators[0]}
          </Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={styles.tapForMore}>Tap for details</Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
    </TouchableOpacity>
  );
};
