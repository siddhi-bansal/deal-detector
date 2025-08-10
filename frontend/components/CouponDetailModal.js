import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';

export const CouponDetailModal = ({ visible, coupon, onClose }) => {
  if (!coupon) return null;

  const handleLinkPress = (url, linkType) => {
    if (!url) {
      Alert.alert('No Link Available', `No ${linkType} link is available for this coupon.`);
      return;
    }

    Linking.openURL(url).catch(() => {
      Alert.alert('Error', `Unable to open ${linkType} link.`);
    });
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

  const daysLeft = getDaysUntilExpiry(coupon.expiry_date);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{coupon.company}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
            {/* Discount Badge */}
            <LinearGradient
              colors={['#ec4899', '#ef4444']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalDiscountBadge}
            >
              <Text style={styles.modalDiscountText}>{coupon.discount_amount}</Text>
              <Text style={styles.modalDiscountType}>{coupon.discount_type}</Text>
            </LinearGradient>

            {/* Offer Details */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Offer Details</Text>
              <Text style={styles.modalOfferText}>{coupon.offer_description}</Text>
            </View>

            {/* Expiry Information */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Expiry Information</Text>
              <Text style={styles.modalExpiryDate}>{formatDate(coupon.expiry_date)}</Text>
              {daysLeft !== null && (
                <Text style={[
                  styles.modalDaysLeft,
                  daysLeft <= 3 ? styles.urgentText : styles.normalText
                ]}>
                  {daysLeft > 0 ? `${daysLeft} days left` :
                    daysLeft === 0 ? 'Expires today!' : 'Expired'}
                </Text>
              )}
            </View>

            {/* Terms and Conditions */}
            {coupon.terms_and_conditions && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Terms & Conditions</Text>
                <Text style={styles.modalTermsText}>{coupon.terms_and_conditions}</Text>
              </View>
            )}

            {/* Coupon Code */}
            {coupon.coupon_code && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Coupon Code</Text>
                <View style={styles.couponCodeContainer}>
                  <Text style={styles.couponCodeText}>{coupon.coupon_code}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            {coupon.website_url && (
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.actionButton]}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 }}
                  onPress={() => handleLinkPress(coupon.website_url, 'website')}
                >
                  <Ionicons name="storefront-outline" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Visit Store</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            {coupon.offer_url && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleLinkPress(coupon.offer_url, 'offer')}
              >
                <Ionicons name="pricetag-outline" size={20} color="#6366f1" />
                <Text style={styles.secondaryButtonText}>View Offer</Text>
              </TouchableOpacity>
            )}

            {/* Go to Email Button */}
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionButton]}
            >
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 }}
                onPress={() => {}}
              >
                <Ionicons name="mail-outline" size={22} color="white" />
                <Text style={[styles.primaryButtonText, { color: 'white' }]}>Go to Email</Text>
              </TouchableOpacity>
            </LinearGradient>

            {!coupon.website_url && !coupon.offer_url && (
              <Text style={styles.noLinksText}>
                No direct links available for this coupon
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};
