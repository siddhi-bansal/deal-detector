import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';

export const SearchAndSort = ({ searchQuery, setSearchQuery, sortBy, setSortBy, resultsCount }) => {
  const sortOptions = [
    { key: 'company', label: 'Company' },
    { key: 'discount', label: 'Discount' },
    { key: 'expiry', label: 'Expiry' },
    { key: 'type', label: 'Type' }
  ];

  return (
    <>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search coupons, companies, discounts..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortOptions}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortButton,
                sortBy === option.key && styles.sortButtonActive
              ]}
              onPress={() => setSortBy(option.key)}
            >
              <Text style={[
                styles.sortButtonText,
                sortBy === option.key && styles.sortButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {resultsCount} coupon{resultsCount !== 1 ? 's' : ''} found
        </Text>
      </View>
    </>
  );
};
