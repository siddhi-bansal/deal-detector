import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';

export const AddCouponScreen = () => {
  const [formData, setFormData] = useState({
    company: '',
    offerTitle: '',
    offerDescription: '',
    discountAmount: '',
    discountType: 'percentage',
    couponCode: '',
    expiryDate: '',
    websiteUrl: '',
    offerUrl: '',
    termsAndConditions: '',
    minimumPurchase: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCoupon = () => {
    // Basic validation
    if (!formData.company || !formData.offerTitle || !formData.discountAmount) {
      Alert.alert('Required Fields', 'Please fill in company name, offer title, and discount amount.');
      return;
    }

    // Here you would typically save to your backend or local storage
    Alert.alert(
      'Coupon Saved!', 
      'Your coupon has been added successfully.',
      [{ text: 'OK', onPress: () => resetForm() }]
    );
  };

  const resetForm = () => {
    setFormData({
      company: '',
      offerTitle: '',
      offerDescription: '',
      discountAmount: '',
      discountType: 'percentage',
      couponCode: '',
      expiryDate: '',
      websiteUrl: '',
      offerUrl: '',
      termsAndConditions: '',
      minimumPurchase: '',
    });
  };

  const DiscountTypeSelector = () => (
    <View style={styles.discountTypeContainer}>
      {['percentage', 'fixed_amount', 'free_shipping', 'other'].map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.discountTypeButton,
            formData.discountType === type && styles.discountTypeButtonActive
          ]}
          onPress={() => handleInputChange('discountType', type)}
        >
          <Text style={[
            styles.discountTypeText,
            formData.discountType === type && styles.discountTypeTextActive
          ]}>
            {type.replace('_', ' ').toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.addCouponContainer} showsVerticalScrollIndicator={true}>
          <View style={styles.addCouponHeader}>
            <Ionicons name="add-circle" size={32} color="#10b981" />
            <Text style={styles.addCouponTitle}>Add New Coupon</Text>
          </View>

          {/* Company Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Company Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.company}
              onChangeText={(value) => handleInputChange('company', value)}
              placeholder="e.g., Amazon, Nike, Target"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Offer Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Offer Title *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.offerTitle}
              onChangeText={(value) => handleInputChange('offerTitle', value)}
              placeholder="e.g., Summer Sale, Black Friday Deal"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Offer Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Offer Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.offerDescription}
              onChangeText={(value) => handleInputChange('offerDescription', value)}
              placeholder="Describe the offer details..."
              placeholderTextColor="#9ca3af"
              multiline={true}
              numberOfLines={3}
            />
          </View>

          {/* Discount Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Discount Amount *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.discountAmount}
              onChangeText={(value) => handleInputChange('discountAmount', value)}
              placeholder="e.g., 20%, $50, Free"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Discount Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Discount Type</Text>
            <DiscountTypeSelector />
          </View>

          {/* Coupon Code */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Coupon Code</Text>
            <TextInput
              style={styles.textInput}
              value={formData.couponCode}
              onChangeText={(value) => handleInputChange('couponCode', value)}
              placeholder="e.g., SAVE20, WELCOME50"
              placeholderTextColor="#9ca3af"
              autoCapitalize="characters"
            />
          </View>

          {/* Expiry Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expiry Date</Text>
            <TextInput
              style={styles.textInput}
              value={formData.expiryDate}
              onChangeText={(value) => handleInputChange('expiryDate', value)}
              placeholder="YYYY-MM-DD or MM/DD/YYYY"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Website URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Website URL</Text>
            <TextInput
              style={styles.textInput}
              value={formData.websiteUrl}
              onChangeText={(value) => handleInputChange('websiteUrl', value)}
              placeholder="https://example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Offer URL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Offer URL</Text>
            <TextInput
              style={styles.textInput}
              value={formData.offerUrl}
              onChangeText={(value) => handleInputChange('offerUrl', value)}
              placeholder="Direct link to the offer"
              placeholderTextColor="#9ca3af"
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>

          {/* Terms and Conditions */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Terms & Conditions</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.termsAndConditions}
              onChangeText={(value) => handleInputChange('termsAndConditions', value)}
              placeholder="Enter any terms, restrictions, or conditions..."
              placeholderTextColor="#9ca3af"
              multiline={true}
              numberOfLines={3}
            />
          </View>

          {/* Minimum Purchase */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Minimum Purchase</Text>
            <TextInput
              style={styles.textInput}
              value={formData.minimumPurchase}
              onChangeText={(value) => handleInputChange('minimumPurchase', value)}
              placeholder="e.g., $50, $100"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.addCouponActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={resetForm}
            >
              <Ionicons name="refresh-outline" size={20} color="#10b981" />
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </TouchableOpacity>

            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.actionButton, { flex: 1, marginLeft: 15 }]}
            >
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, flex: 1 }}
                onPress={handleSaveCoupon}
              >
                <Ionicons name="save-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Save Coupon</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};
