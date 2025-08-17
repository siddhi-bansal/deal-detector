import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOfferTypeColors, getOfferTypeLabel, getOfferTypeIcon } from '../utils/offerTypeColors';
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
    if (type === 'all') return 'All';
    return getOfferTypeLabel(type);
  };

  const getTypeIcon = (type) => {
    if (type === 'all') return 'apps-outline';
    
    const baseIcon = getOfferTypeIcon(type);
    // Map to outline versions for filter display
    const outlineIcons = {
      'pricetag': 'pricetag-outline',
      'ticket': 'ticket-outline', 
      'car': 'car-outline',
      'copy': 'copy-outline',
      'gift': 'gift-outline',
      'star': 'star-outline'
    };
    
    return outlineIcons[baseIcon] || 'bookmark-outline';
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
      {types.map((type) => {
        const colors = type === 'all' ? null : getOfferTypeColors(type);
        const isSelected = selectedType === type;
        
        return (
          <TouchableOpacity
            key={type}
            style={[
              styles.typeFilterButton,
              isSelected && (type === 'all' 
                ? styles.typeFilterButtonActive 
                : {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 2
                  }
              )
            ]}
            onPress={() => onTypeChange(type)}
          >
            <Ionicons 
              name={getTypeIcon(type)} 
              size={16} 
              color={
                isSelected 
                  ? (type === 'all' ? '#ffffff' : colors.text)
                  : '#10b981'
              } 
              style={{ marginRight: 6 }}
            />
            <Text style={[
              styles.typeFilterText,
              isSelected && (type === 'all' 
                ? styles.typeFilterTextActive
                : { color: colors.text }
              ),
              { marginRight: 6 }
            ]}>
              {getTypeLabel(type)}
            </Text>
            <View style={[
              styles.typeFilterBadge,
              isSelected && (type === 'all'
                ? styles.typeFilterBadgeActive
                : {
                    backgroundColor: colors.border,
                  }
              )
            ]}>
              <Text style={[
                styles.typeFilterBadgeText,
                isSelected && styles.typeFilterBadgeTextActive
              ]}>
                {getTypeCount(type)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
