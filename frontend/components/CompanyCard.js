import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOfferTypeColors, getOfferTypeLabel } from '../utils/offerTypeColors';
import { styles } from '../styles/styles';

export const CompanyCard = ({ company, onPress }) => {
  const formatOfferCount = (count) => {
    return count === 1 ? '1 offer' : `${count} offers`;
  };

  const formatExpiryDate = (dateStr) => {
    if (!dateStr) return null;
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'Expired';
    } else if (diffDays === 0) {
      return 'Expires today';
    } else if (diffDays === 1) {
      return 'Expires tomorrow';
    } else if (diffDays <= 7) {
      return `Expires in ${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getOfferTypesPreview = (offers) => {
    const types = [...new Set(offers.map(offer => offer.offer_type))];
    return types.slice(0, 3); // Show max 3 offer types
  };

  const offerTypesPreview = getOfferTypesPreview(company.offers);
  const earliestExpiry = company.offers
    .map(offer => offer.expiry_date)
    .filter(date => date)
    .sort()[0];

  return (
    <TouchableOpacity style={styles.companyCard} onPress={() => onPress(company)}>
      <View style={styles.companyCardHeader}>
        <View style={styles.companyLogoContainer}>
          {company.company_logo_url ? (
            <Image 
              source={{ uri: company.company_logo_url }} 
              style={styles.companyLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.companyLogoPlaceholder}>
              <Ionicons name="business-outline" size={24} color="#10b981" />
            </View>
          )}
        </View>
        <View style={styles.companyInfoContainer}>
          <Text style={styles.companyName} numberOfLines={1}>
            {company.name}
          </Text>
          <Text style={styles.companyOfferCount}>
            {formatOfferCount(company.offers.length)}
          </Text>
        </View>
        <View style={styles.companyCardArrow}>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </View>
      </View>

      <View style={styles.companyCardDetails}>
        {/* Company Category */}
        {company.company_category && (
          <View style={styles.companyCategoryContainer}>
            <View style={styles.companyCategoryTag}>
              <Ionicons name="business-outline" size={12} color="#10b981" />
              <Text style={styles.companyCategoryText}>
                {company.company_category.charAt(0).toUpperCase() + company.company_category.slice(1)}
              </Text>
            </View>
          </View>
        )}
        
        {/* Offer types preview */}
        <View style={styles.offerTypesContainer}>
          {offerTypesPreview.map((type, index) => {
            const colors = getOfferTypeColors(type);
            return (
              <View 
                key={index} 
                style={[
                  styles.offerTypeTag,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border
                  }
                ]}
              >
                <Text style={[
                  styles.offerTypeTagText,
                  { color: colors.text }
                ]}>
                  {getOfferTypeLabel(type)}
                </Text>
              </View>
            );
          })}
          {company.offers.length > 3 && (
            <View style={styles.offerTypeTag}>
              <Text style={styles.offerTypeTagText}>
                +{company.offers.length - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Earliest expiry */}
        {earliestExpiry && (
          <View style={styles.companyExpiryContainer}>
            <Ionicons name="time-outline" size={14} color="#6b7280" />
            <Text style={styles.companyExpiryText}>
              {formatExpiryDate(earliestExpiry)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
