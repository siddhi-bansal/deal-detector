import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CouponCard } from '../components/CouponCard';
import { CouponDetailModal } from '../components/CouponDetailModal';
import { styles } from '../styles/styles';

export const CompanyDetailScreen = ({ route, navigation }) => {
  const { company } = route.params;
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleCardPress = (coupon) => {
    setSelectedCoupon(coupon);
    setModalVisible(true);
  };

  const renderCouponCard = ({ item }) => (
    <CouponCard coupon={item} onPress={() => handleCardPress(item)} />
  );

  const formatOfferCount = (count) => {
    return count === 1 ? '1 offer' : `${count} offers`;
  };

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Custom Header */}
        <View style={styles.companyDetailHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#10b981" />
          </TouchableOpacity>
          
          <View style={styles.companyDetailHeaderInfo}>
            <View style={styles.companyDetailLogoContainer}>
              {company.company_logo_url ? (
                <Image 
                  source={{ uri: company.company_logo_url }} 
                  style={styles.companyDetailLogo}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.companyDetailLogoPlaceholder}>
                  <Ionicons name="business-outline" size={32} color="#10b981" />
                </View>
              )}
            </View>
            <View style={styles.companyDetailText}>
              <Text style={styles.companyDetailName} numberOfLines={2}>
                {company.name}
              </Text>
              <Text style={styles.companyDetailCount}>
                {formatOfferCount(company.offers.length)}
              </Text>
            </View>
          </View>
        </View>

        {/* Offers List */}
        <FlatList
          data={company.offers}
          renderItem={renderCouponCard}
          keyExtractor={(item, index) => `${item.id || index}`}
          contentContainerStyle={styles.cardList}
          showsVerticalScrollIndicator={true}
        />

        <CouponDetailModal
          visible={modalVisible}
          coupon={selectedCoupon}
          onClose={() => setModalVisible(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
};
