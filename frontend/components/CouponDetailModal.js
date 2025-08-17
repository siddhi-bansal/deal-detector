import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, Linking, Alert, ActivityIndicator, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { getOfferTypeColors, getOfferTypeLabel, getOfferTypeIcon } from '../utils/offerTypeColors';
import { styles } from '../styles/styles';

export const CouponDetailModal = ({ visible, coupon, onClose }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailHtml, setEmailHtml] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Use logo and domain data directly from coupon response - no need to fetch
  const logoUrl = coupon?.company_logo_url;
  const logoLoading = false; // No loading needed since data comes with coupon
  const companyDomain = coupon?.company_domain;

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

  const handleFavoritePress = () => {
    toggleFavorite(coupon);
  };

  const fetchEmailHtml = async (messageId) => {
    try {
      setLoadingEmail(true);
      const response = await fetch(`http://192.168.86.32:8000/api/email_html/${messageId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.html_content) {
        setEmailHtml(data.html_content);
        setEmailModalVisible(true);
      } else {
        throw new Error(data.error || 'No HTML content found');
      }
    } catch (error) {
      console.error('Error fetching email HTML:', error);
      Alert.alert(
        'Error', 
        'Failed to load email content. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoToEmail = () => {
    if (!coupon.message_id) {
      Alert.alert(
        'No Email Available', 
        'No email link is available for this coupon.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    fetchEmailHtml(coupon.message_id);
  };

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
            <View style={styles.modalTitleContainer}>
              <View style={styles.modalLogoContainer}>
                {logoUrl && !logoError ? (
                  <Image
                    source={{ uri: logoUrl }}
                    style={styles.modalCompanyLogo}
                    resizeMode="contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <View style={styles.modalLogoPlaceholder}>
                    <Ionicons name="business" size={32} color="#9ca3af" />
                  </View>
                )}
              </View>
              <View style={styles.modalCompanyInfoContainer}>
                <Text style={styles.modalTitle}>{coupon.email_sender_company || coupon.offer_brand || coupon.company}</Text>
                {/* Company Category Tag */}
                {coupon.company_category && (
                  <View style={styles.companyCategoryTag}>
                    <Ionicons name="business-outline" size={12} color="#3b82f6" />
                    <Text style={styles.companyCategoryText}>
                      {coupon.company_category.charAt(0).toUpperCase() + coupon.company_category.slice(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.modalHeaderButtons}>
              <TouchableOpacity 
                onPress={handleFavoritePress} 
                style={[styles.closeButton, { marginRight: 10 }]}
              >
                <Ionicons 
                  name={isFavorite(coupon.id) ? 'heart' : 'heart-outline'} 
                  size={24} 
                  color={isFavorite(coupon.id) ? '#ef4444' : '#9ca3af'} 
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
            {/* Main Offer Section */}
            <View style={styles.modalSection}>
              <Text style={styles.modalOfferTitle}>{coupon.offer_title}</Text>
              <Text style={styles.modalOfferDescription}>{coupon.offer_description}</Text>
              
              {/* Offer Type Tag */}
              <View style={[
                styles.offerTypeTag,
                {
                  backgroundColor: getOfferTypeColors(coupon.offer_type).background,
                  borderColor: getOfferTypeColors(coupon.offer_type).border
                }
              ]}>
                <Text style={[
                  styles.offerTypeText,
                  { color: getOfferTypeColors(coupon.offer_type).text }
                ]}>
                  {getOfferTypeLabel(coupon.offer_type)}
                </Text>
              </View>
            </View>

            {/* Coupon Code Section */}
            {coupon.coupon_code && (
              <View style={styles.modalSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="ticket" size={20} color="#4CAF50" />
                  <Text style={styles.modalSectionTitle}>Coupon Code</Text>
                </View>
                <View style={styles.couponCodeContainer}>
                  <Text style={styles.couponCodeText}>{coupon.coupon_code}</Text>
                  <TouchableOpacity style={styles.copyCodeButton}>
                    <Ionicons name="copy" size={16} color="#4CAF50" />
                    <Text style={styles.copyCodeText}>Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Expiry Information */}
            <View style={styles.modalSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={20} color="#f59e0b" />
                <Text style={styles.modalSectionTitle}>Expiry Information</Text>
              </View>
              <View style={styles.expiryInfoContainer}>
                <Text style={styles.modalExpiryDate}>{formatDate(coupon.expiry_date)}</Text>
                {daysLeft !== null && (
                  <View style={[
                    styles.daysLeftBadge,
                    daysLeft <= 3 ? styles.urgentBadge : 
                    daysLeft <= 7 ? styles.soonBadge : styles.normalBadge
                  ]}>
                    <Text style={[
                      styles.daysLeftText,
                      daysLeft <= 3 ? styles.urgentText : styles.normalText
                    ]}>
                      {daysLeft > 0 ? `${daysLeft} days left` :
                        daysLeft === 0 ? 'Expires today!' : 'Expired'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Terms and Conditions */}
            {coupon.terms_and_conditions && (
              <View style={styles.modalSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text" size={20} color="#6b7280" />
                  <Text style={styles.modalSectionTitle}>Terms & Conditions</Text>
                </View>
                <Text style={styles.modalTermsText}>{coupon.terms_and_conditions}</Text>
              </View>
            )}

            {/* Email Information */}
            {(coupon.email_sender || coupon.email_subject) && (
              <View style={styles.modalSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="mail" size={20} color="#10b981" />
                  <Text style={styles.modalSectionTitle}>Email Details</Text>
                </View>
                {coupon.email_sender && (
                  <View style={styles.emailRow}>
                    <Text style={styles.emailLabel}>From:</Text>
                    <Text style={styles.emailValue}>{coupon.email_sender}</Text>
                  </View>
                )}
                {coupon.email_subject && (
                  <View style={styles.emailRow}>
                    <Text style={styles.emailLabel}>Subject:</Text>
                    <Text style={styles.emailValue}>{coupon.email_subject}</Text>
                  </View>
                )}
                {coupon.email_timestamp && (
                  <View style={styles.emailRow}>
                    <Text style={styles.emailLabel}>Received:</Text>
                    <Text style={styles.emailValue}>{formatDate(coupon.email_timestamp)}</Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            {/* Company Website Button */}
            {companyDomain && (
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.actionButton]}
              >
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 }}
                  onPress={() => handleLinkPress(`https://${companyDomain}`, 'company website')}
                >
                  <Ionicons name="globe-outline" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Visit {companyDomain}</Text>
                </TouchableOpacity>
              </LinearGradient>
            )}

            {coupon.website_url && (
              <LinearGradient
                colors={['#10b981', '#059669']}
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
                <Ionicons name="pricetag-outline" size={20} color="#10b981" />
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
                onPress={handleGoToEmail}
                disabled={loadingEmail}
              >
                {loadingEmail ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="mail-outline" size={22} color="white" />
                )}
                <Text style={[styles.primaryButtonText, { color: 'white' }]}>
                  {loadingEmail ? 'Loading...' : 'Go to Email'}
                </Text>
              </TouchableOpacity>
            </LinearGradient>

            {!companyDomain && !coupon.website_url && !coupon.offer_url && (
              <Text style={styles.noLinksText}>
                No direct links available for this coupon
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Email HTML Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.emailModalContainer}>
          {/* Email Modal Header */}
          <View style={styles.emailModalHeader}>
            <Text style={styles.emailModalTitle}>Original Email</Text>
            <TouchableOpacity 
              onPress={() => setEmailModalVisible(false)}
              style={styles.emailCloseButton}
            >
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* WebView for Email Content */}
          <WebView
            source={{ html: emailHtml }}
            style={styles.emailWebView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.emailLoadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.emailLoadingText}>Loading email...</Text>
              </View>
            )}
            onError={(error) => {
              console.error('WebView error:', error);
              Alert.alert('Error', 'Failed to load email content');
            }}
          />
        </View>
      </Modal>
    </Modal>
  );
};
