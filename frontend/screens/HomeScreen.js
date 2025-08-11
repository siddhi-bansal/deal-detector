import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import sampleData from '../assets/sample_api_output.json';
import { CouponCard } from '../components/CouponCard';
import { CouponDetailModal } from '../components/CouponDetailModal';
import { SearchAndSort } from '../components/SearchAndSort';
import { styles } from '../styles/styles';

export const HomeScreen = () => {
  const [coupons, setCoupons] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('company');

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    filterAndSortCoupons();
  }, [coupons, searchQuery, sortBy]);

  const loadCoupons = async () => {
    try {
      // Flatten all offers from the sample data structure
      const allOffers = [];
      if (sampleData?.all_coupons) {
        sampleData.all_coupons.forEach((couponGroup) => {
          if (couponGroup.offers) {
            couponGroup.offers.forEach((offer, index) => {
              allOffers.push({ 
                ...offer, 
                message_id: couponGroup.message_id,
                email_sender: couponGroup.email_sender,
                email_subject: couponGroup.email_subject,
                email_timestamp: couponGroup.timestamp,

                isFavorite: false 
              });
            });
          }
        });
      }
      setCoupons(allOffers);
    } catch (error) {
      console.error('Error loading coupons:', error);
      Alert.alert('Error', 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortCoupons = () => {
    let filtered = coupons;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = coupons.filter(coupon => 
        coupon.company?.toLowerCase().includes(query) ||
        coupon.offer_title?.toLowerCase().includes(query) ||
        coupon.offer_description?.toLowerCase().includes(query) ||
        coupon.discount_amount?.toLowerCase().includes(query) ||
        coupon.discount_type?.toLowerCase().includes(query) ||
        coupon.terms_conditions?.toLowerCase().includes(query) ||
        coupon.coupon_code?.toLowerCase().includes(query) ||
        coupon.offer_type?.toLowerCase().includes(query) ||
        coupon.product_category?.toLowerCase().includes(query) ||
        (coupon.urgency_indicators && coupon.urgency_indicators.some(indicator => 
          indicator.toLowerCase().includes(query)
        )) ||
        (coupon.additional_benefits && coupon.additional_benefits.some(benefit => 
          benefit.toLowerCase().includes(query)
        ))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        
        case 'discount':
          // Extract numeric value from discount amount for comparison
          const getDiscountValue = (discount) => {
            const match = discount?.match(/(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          return getDiscountValue(b.discount_amount) - getDiscountValue(a.discount_amount);
        
        case 'expiry':
          const getDate = (dateStr) => {
            if (!dateStr) return new Date('2099-12-31'); // Far future for items without expiry
            return new Date(dateStr);
          };
          return getDate(a.expiry_date) - getDate(b.expiry_date);
        
        case 'type':
          return (a.offer_type || '').localeCompare(b.offer_type || '');
        
        default:
          return 0;
      }
    });

    setFilteredCoupons(filtered);
  };

  const handleCardPress = (coupon) => {
    setSelectedCoupon(coupon);
    setModalVisible(true);
  };

  const renderCouponCard = ({ item }) => (
    <CouponCard coupon={item} onPress={() => handleCardPress(item)} />
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#f0f3ff', '#e0e7ff']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading coupons...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#f0f3ff', '#e0e7ff']}
      style={styles.container}
    >
      <View style={{ flex: 1 }}>
        <SearchAndSort
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resultsCount={filteredCoupons.length}
        />

        {filteredCoupons.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? 'No coupons match your search' : 'No coupons available'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery.trim() ? 'Try adjusting your search terms' : 'Check back later for new offers'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCoupons}
            renderItem={renderCouponCard}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.cardList}
            showsVerticalScrollIndicator={true}
          />
        )}

        <CouponDetailModal
          visible={modalVisible}
          coupon={selectedCoupon}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </LinearGradient>
  );
};
