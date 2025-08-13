import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../styles/styles';

export const TypeFilter = ({ selectedType, onTypeChange, coupons }) => {
  // Extract unique types from coupons and add "All" option
  const getUniqueTypes = () => {
    const types = new Set();
    coupons.forEach(coupon => {
      if (coupon.offer_type) {
        types.add(coupon.offer_type);
      }
    });
    return ['all', ...Array.from(types)];
  };

  const types = getUniqueTypes();

  const getTypeLabel = (type) => {
    switch (type) {
      case 'all':
        return 'All';
      case 'discount':
        return 'Discount';
      case 'coupon':
        return 'Coupon';
      case 'free_shipping':
        return 'Free Ship';
      case 'bogo':
        return 'BOGO';
      case 'free_gift':
        return 'Free Gift';
      case 'loyalty_points':
        return 'Points';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'all':
        return 'apps-outline';
      case 'discount':
        return 'trending-down-outline';
      case 'coupon':
        return 'ticket-outline';
      case 'free_shipping':
        return 'car-outline';
      case 'bogo':
        return 'copy-outline';
      case 'free_gift':
        return 'gift-outline';
      case 'loyalty_points':
        return 'star-outline';
      default:
        return 'bookmark-outline';
    }
  };

  const getTypeCount = (type) => {
    if (type === 'all') return coupons.length;
    return coupons.filter(coupon => coupon.offer_type === type).length;
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.typeFilterScrollContent}
    >
      {types.map((type) => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeFilterButton,
            selectedType === type && styles.typeFilterButtonActive
          ]}
          onPress={() => onTypeChange(type)}
        >
          <Ionicons 
            name={getTypeIcon(type)} 
            size={16} 
            color={selectedType === type ? '#ffffff' : '#10b981'} 
            style={{ marginRight: 6 }}
          />
          <Text style={[
            styles.typeFilterText,
            selectedType === type && styles.typeFilterTextActive,
            { marginRight: 6 }
          ]}>
            {getTypeLabel(type)}
          </Text>
          <View style={[
            styles.typeFilterBadge,
            selectedType === type && styles.typeFilterBadgeActive
          ]}>
            <Text style={[
              styles.typeFilterBadgeText,
              selectedType === type && styles.typeFilterBadgeTextActive
            ]}>
              {getTypeCount(type)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
