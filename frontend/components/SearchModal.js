import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';

export const SearchModal = ({ 
  visible, 
  onClose, 
  searchQuery, 
  setSearchQuery, 
  sortBy, 
  setSortBy, 
  resultsCount 
}) => {
  const sortOptions = [
    { key: 'company', label: 'Company', icon: 'business-outline' },
    { key: 'discount', label: 'Discount', icon: 'pricetag-outline' },
    { key: 'expiry', label: 'Expiry', icon: 'calendar-outline' },
    { key: 'type', label: 'Type', icon: 'apps-outline' }
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <SafeAreaView style={styles.searchModalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Search & Filter</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

          {/* Search Input */}
          <View style={styles.searchModalInputContainer}>
            <Ionicons name="search" size={20} color="#10b981" style={styles.searchModalIcon} />
            <TextInput
              style={styles.searchModalInput}
              placeholder="Search coupons, companies, discounts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.searchModalClearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Sort Options */}
          <View style={styles.searchModalSortSection}>
            <Text style={styles.searchModalSortTitle}>Sort by</Text>
            <View style={styles.searchModalSortGrid}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.searchModalSortOption,
                    sortBy === option.key && styles.searchModalSortOptionActive
                  ]}
                  onPress={() => setSortBy(option.key)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={20} 
                    color={sortBy === option.key ? '#ffffff' : '#10b981'} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[
                    styles.searchModalSortText,
                    sortBy === option.key && styles.searchModalSortTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Results Count */}
          <View style={styles.searchModalResults}>
            <Ionicons name="receipt-outline" size={16} color="#6b7280" />
            <Text style={styles.searchModalResultsText}>
              {resultsCount} coupon{resultsCount !== 1 ? 's' : ''} found
            </Text>
          </View>

          {/* Apply Button */}
          <TouchableOpacity style={styles.searchModalApplyButton} onPress={onClose}>
            <Text style={styles.searchModalApplyText}>Apply Filters</Text>
          </TouchableOpacity>
          </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};
