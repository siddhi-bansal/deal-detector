import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import CouponService from '../services/CouponService';
import sampleData from '../assets/sample_api_output.json';
import { CouponCard } from '../components/CouponCard';
import { CompanyCard } from '../components/CompanyCard';
import { CouponDetailModal } from '../components/CouponDetailModal';
import { SearchModal } from '../components/SearchModal';
import { TypeFilter } from '../components/TypeFilter';
import { styles } from '../styles/styles';

export const HomeScreen = ({ route }) => {
  const navigation = useNavigation();
  const { user, token, logout, isDevMode } = useAuth(); // Get user info and dev mode flag from auth context
  const [coupons, setCoupons] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('company');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState('companies'); // 'companies' or 'coupons'
  const [hasNavigatedWithParams, setHasNavigatedWithParams] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Refs for FlatLists to control scroll position
  const companiesListRef = React.useRef(null);
  const couponsListRef = React.useRef(null);
  
  // Animated values for smooth transitions
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const buttonSlideAnim = React.useRef(new Animated.Value(0)).current;
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Handle navigation parameters to set initial view mode
  useEffect(() => {
    if (route?.params?.initialViewMode) {
      setViewMode(route.params.initialViewMode);
      setHasNavigatedWithParams(true);
      // Clear the parameter to avoid it persisting
      navigation.setParams({ initialViewMode: undefined });
    }
    if (route?.params?.shouldRefresh) {
      loadCoupons(); // Refresh the data
      navigation.setParams({ shouldRefresh: undefined });
    }
  }, [route?.params?.initialViewMode, route?.params?.shouldRefresh, navigation]);

  // Listen for navigation focus to reset to companies view when coming from tab press
  // but only if no specific view mode parameter was passed
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Always reset scroll position when focusing on home screen
      const resetScrollPosition = () => {
        if (viewMode === 'companies' && companiesListRef.current) {
          companiesListRef.current.scrollToOffset({ offset: 0, animated: true });
        } else if (viewMode === 'coupons' && couponsListRef.current) {
          couponsListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      };
      
      // Reset view mode only if we didn't just navigate with parameters
      if (!hasNavigatedWithParams) {
        setViewMode('companies');
      }
      
      // Always reset scroll position after a short delay
      setTimeout(resetScrollPosition, 100);
      
      // Reset the flag after handling
      setHasNavigatedWithParams(false);
    });

    return unsubscribe;
  }, [navigation, hasNavigatedWithParams, viewMode]);

  useEffect(() => {
    loadCoupons();
  }, []);

  useEffect(() => {
    filterAndSortData();
  }, [coupons, companies, searchQuery, sortBy, selectedType, viewMode]);

  // Reset scroll position when view mode changes
  useEffect(() => {
    const resetScrollPosition = () => {
      if (viewMode === 'companies' && companiesListRef.current) {
        companiesListRef.current.scrollToOffset({ offset: 0, animated: true });
      } else if (viewMode === 'coupons' && couponsListRef.current) {
        couponsListRef.current.scrollToOffset({ offset: 0, animated: true });
      }
    };

    // Small delay to ensure the list has rendered
    const timeoutId = setTimeout(resetScrollPosition, 100);
    return () => clearTimeout(timeoutId);
  }, [viewMode]);

  const onRefresh = async () => {
    Alert.alert(
      'Refresh Coupons?',
      'This will fetch the latest emails from your inbox. It may take a few minutes.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Refresh',
          onPress: async () => {
            setRefreshing(true);
            await loadCoupons(true); // Force refresh when pulling
            setRefreshing(false);
          },
        },
      ]
    );
  };

  const loadCoupons = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Check if user is authenticated and has Gmail connected
      if (!token) {
        console.log('No authentication token available');
        Alert.alert('Authentication Required', 'Please log in to view your coupons.');
        return;
      }

      if (!user?.gmail_connected) {
        console.log('Gmail not connected, using sample data');
        // Use sample data as fallback
        loadSampleData();
        return;
      }

      console.log('Fetching real coupon data from API...');
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('User info:', { email: user?.email, gmail_connected: user?.gmail_connected });
      
      // First test authentication
      console.log('Testing authentication...');
      const authTest = await CouponService.testAuth(token);
      console.log('Auth test result:', authTest);
      
      if (!authTest.success) {
        console.error('Authentication test failed:', authTest.error);
        
        // Check if it's an expiry issue
        if (authTest.error.includes('expired')) {
          Alert.alert(
            'Session Expired', 
            'Your session has expired. Please log in again.',
            [
              { text: 'Use Sample Data', onPress: () => loadSampleData() },
              { text: 'Log Out & Retry', onPress: () => {
                logout();
                navigation.navigate('Profile');
              }}
            ]
          );
        } else {
          Alert.alert(
            'Authentication Error', 
            `Authentication failed: ${authTest.error}. Please try logging out and back in.`,
            [
              { text: 'Use Sample Data', onPress: () => loadSampleData() },
              { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') }
            ]
          );
        }
        return;
      }
      
      console.log('Authentication successful, fetching coupons...');
      
      // Call the real API
      const result = await CouponService.getCoupons(token, forceRefresh);
      
      if (result.success && result.data) {
        console.log('Successfully fetched real coupon data:', result.data);
        
        // Process the real API data
        const allOffers = [];
        if (result.data.all_coupons) {
          result.data.all_coupons.forEach((couponGroup) => {
            if (couponGroup.offers) {
              couponGroup.offers.forEach((offer, index) => {
                allOffers.push({ 
                  ...offer, 
                  message_id: couponGroup.message_id,
                  email_sender: couponGroup.sender,
                  email_subject: couponGroup.subject,
                  email_timestamp: couponGroup.timestamp,
                  email_sender_company: couponGroup.email_sender_company,
                  company: couponGroup.company,
                  company_domain: couponGroup.company_domain,
                  company_logo_url: couponGroup.company_logo_url,
                  company_category: couponGroup.company_category,
                  isFavorite: false 
                });
              });
            }
          });
        }
        
        setCoupons(allOffers);
        
        // Group offers by company
        const companiesMap = {};
        allOffers.forEach(offer => {
          const companyName = offer.email_sender_company || offer.company || 'Unknown Company';
          if (!companiesMap[companyName]) {
            companiesMap[companyName] = {
              name: companyName,
              company_logo_url: offer.company_logo_url,
              company_domain: offer.company_domain,
              company_category: offer.company_category,
              offers: []
            };
          }
          companiesMap[companyName].offers.push(offer);
        });
        
        const companiesArray = Object.values(companiesMap);
        setCompanies(companiesArray);
        setLastUpdated(new Date());
        
        console.log(`Loaded ${allOffers.length} offers from ${companiesArray.length} companies`);
        
      } else {
        console.error('Failed to fetch coupon data:', result.error);
        
        // Check if it's a Gmail connection issue
        if (result.error && result.error.includes('Gmail not connected')) {
          Alert.alert(
            'Gmail Not Connected', 
            'Please connect your Gmail account in the Profile tab to view your coupons.',
            [
              { text: 'Use Sample Data', onPress: () => loadSampleData() },
              { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') }
            ]
          );
        } else {
          Alert.alert(
            'Error Loading Coupons', 
            result.error || 'Failed to load coupons from server.',
            [
              { text: 'Use Sample Data', onPress: () => loadSampleData() },
              { text: 'Retry', onPress: () => loadCoupons() }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to connect to server. Would you like to use sample data?',
        [
          { text: 'Use Sample Data', onPress: () => loadSampleData() },
          { text: 'Retry', onPress: () => loadCoupons() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    try {
      console.log('Loading sample data...');
      
      // Flatten all offers from the sample data structure
      const allOffers = [];
      if (sampleData?.all_coupons) {
        sampleData.all_coupons.forEach((couponGroup) => {
          if (couponGroup.offers) {
            couponGroup.offers.forEach((offer, index) => {
              allOffers.push({ 
                ...offer, 
                message_id: couponGroup.message_id,
                email_sender: couponGroup.sender,
                email_subject: couponGroup.subject,
                email_timestamp: couponGroup.timestamp,
                email_sender_company: couponGroup.email_sender_company,
                company: couponGroup.company,
                company_domain: couponGroup.company_domain,
                company_logo_url: couponGroup.company_logo_url,
                company_category: couponGroup.company_category,
                isFavorite: false 
              });
            });
          }
        });
      }
      setCoupons(allOffers);
      
      // Group offers by company
      const companiesMap = {};
      allOffers.forEach(offer => {
        const companyName = offer.email_sender_company || offer.company || 'Unknown Company';
        if (!companiesMap[companyName]) {
          companiesMap[companyName] = {
            name: companyName,
            company_logo_url: offer.company_logo_url,
            company_domain: offer.company_domain,
            company_category: offer.company_category,
            offers: []
          };
        }
        companiesMap[companyName].offers.push(offer);
      });
      
      const companiesArray = Object.values(companiesMap);
      setCompanies(companiesArray);
      
      console.log(`Loaded ${allOffers.length} sample offers from ${companiesArray.length} companies`);
    } catch (error) {
      console.error('Error loading sample data:', error);
      Alert.alert('Error', 'Failed to load sample data');
    }
  };

  const filterAndSortData = () => {
    // Filter and sort coupons
    let filteredCouponsData = coupons;

    // Apply type filter
    if (selectedType !== 'all') {
      filteredCouponsData = filteredCouponsData.filter(coupon => coupon.offer_type === selectedType);
    }

    // Apply search filter to coupons
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredCouponsData = filteredCouponsData.filter(coupon => 
        (coupon.email_sender_company || coupon.company)?.toLowerCase().includes(query) ||
        coupon.offer_brand?.toLowerCase().includes(query) ||
        coupon.offer_title?.toLowerCase().includes(query) ||
        coupon.offer_description?.toLowerCase().includes(query) ||
        coupon.discount_amount?.toLowerCase().includes(query) ||
        coupon.offer_type?.toLowerCase().includes(query) ||
        coupon.terms_conditions?.toLowerCase().includes(query) ||
        coupon.coupon_code?.toLowerCase().includes(query) ||
        coupon.company_category?.toLowerCase().includes(query) ||
        (coupon.additional_benefits && coupon.additional_benefits.some(benefit => 
          benefit.toLowerCase().includes(query)
        ))
      );
    }

    // Apply sorting to coupons
    filteredCouponsData.sort((a, b) => {
      switch (sortBy) {
        case 'company':
          const companyA = a.email_sender_company || a.company || '';
          const companyB = b.email_sender_company || b.company || '';
          return companyA.localeCompare(companyB);
        
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

    setFilteredCoupons(filteredCouponsData);

    // Filter and sort companies based on filtered coupons
    let filteredCompaniesData = companies.map(company => ({
      ...company,
      offers: company.offers.filter(offer => 
        filteredCouponsData.some(filteredOffer => 
          filteredOffer.message_id === offer.message_id && 
          filteredOffer.offer_title === offer.offer_title
        )
      )
    })).filter(company => company.offers.length > 0);

    // Sort companies
    filteredCompaniesData.sort((a, b) => {
      switch (sortBy) {
        case 'company':
          return a.name.localeCompare(b.name);
        case 'discount':
          // Sort by highest discount in company's offers
          const getMaxDiscount = (company) => {
            return Math.max(...company.offers.map(offer => {
              const match = offer.discount_amount?.match(/(\d+)/);
              return match ? parseInt(match[1]) : 0;
            }));
          };
          return getMaxDiscount(b) - getMaxDiscount(a);
        case 'expiry':
          // Sort by earliest expiry in company's offers
          const getEarliestExpiry = (company) => {
            const dates = company.offers
              .map(offer => offer.expiry_date)
              .filter(date => date)
              .map(date => new Date(date));
            return dates.length > 0 ? Math.min(...dates) : new Date('2099-12-31');
          };
          return getEarliestExpiry(a) - getEarliestExpiry(b);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredCompanies(filteredCompaniesData);
  };

  const handleCardPress = (coupon) => {
    setSelectedCoupon(coupon);
    setModalVisible(true);
  };

  const handleCompanyPress = (company) => {
    navigation.navigate('CompanyOffers', { company });
  };

  // Animated view mode change
  const changeViewMode = (newViewMode) => {
    if (newViewMode === viewMode || isTransitioning) return;
    
    setIsTransitioning(true);
    setViewMode(newViewMode); // Move this to the beginning for instant icon color change
    
    // Get screen width
    const screenWidth = Dimensions.get('window').width;
    
    // Determine target position: 0 for companies, -screenWidth for coupons
    const targetPosition = newViewMode === 'companies' ? 0 : -screenWidth;
    const buttonTargetPosition = newViewMode === 'companies' ? 0 : 1;
    
    // Animate both content slide and button background
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: targetPosition,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlideAnim, {
        toValue: buttonTargetPosition,
        duration: 300,
        useNativeDriver: false, // Can't use native driver for layout properties
      })
    ]).start(() => {
      setIsTransitioning(false);
    });
  };

  const renderCouponCard = ({ item }) => (
    <CouponCard coupon={item} onPress={() => handleCardPress(item)} />
  );

  const renderCompanyCard = ({ item }) => (
    <CompanyCard company={item} onPress={() => handleCompanyPress(item)} />
  );

  if (loading) {
    return (
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5']}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading coupons...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <View style={{ flex: 1 }}>
        {/* User Info Display (Development Only) */}
        {isDevMode && (
          <View style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            padding: 12,
            margin: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(16, 185, 129, 0.3)'
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#10b981',
              marginBottom: 4
            }}>
              🔐 Authentication Status (Dev Mode)
            </Text>
          <Text style={{
            fontSize: 12,
            color: '#374151',
            marginBottom: 2
          }}>
            User: {user?.first_name} {user?.last_name} ({user?.email})
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#374151',
            marginBottom: 2
          }}>
            Gmail Connected: {user?.gmail_connected ? '✅ Yes' : '❌ No - Go to Profile to connect'}
          </Text>
          <Text style={{
            fontSize: 12,
            color: '#374151',
            marginBottom: 2
          }}>
            Token: {token ? '✅ Present' : '❌ Missing'}
          </Text>
          <Text style={{
            fontSize: 12,
            color: user?.gmail_connected ? '#10b981' : '#f59e0b',
            fontWeight: '600'
          }}>
            Data Source: {user?.gmail_connected ? '🌐 Real Gmail API' : '📄 Sample Data'}
          </Text>
          {!user?.gmail_connected && (
            <Text style={{
              fontSize: 11,
              color: '#f59e0b',
              marginTop: 4,
              fontStyle: 'italic'
            }}>
              💡 Connect Gmail in Profile tab to get real coupon data from your emails
            </Text>
          )}
          </View>
        )}

        {/* Filter and Search Row */}
        <View style={styles.filterSearchRow}>
          <View style={styles.typeFilterWrapper}>
            <TypeFilter 
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              coupons={coupons}
            />
          </View>
          <TouchableOpacity 
            style={styles.inlineSearchButton}
            onPress={() => setSearchModalVisible(true)}
          >
            <Ionicons name="search" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeToggle}>
          {/* Animated background slider */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 2,
                left: buttonSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['1%', '51%'],
                  extrapolate: 'clamp',
                }),
                right: buttonSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['51%', '1%'],
                  extrapolate: 'clamp',
                }),
                bottom: 2,
                backgroundColor: '#10b981',
                borderRadius: 8,
              }
            ]}
          />
          
          <TouchableOpacity 
            style={[
              styles.viewModeButton,
              { backgroundColor: 'transparent' }
            ]}
            onPress={() => changeViewMode('companies')}
            disabled={isTransitioning}
          >
            <Animated.View style={{ opacity: 1 }}>
              <Ionicons 
                name="business" 
                size={16} 
                color={viewMode === 'companies' ? '#ffffff' : '#10b981'} 
              />
            </Animated.View>
            <Animated.Text style={[
              styles.viewModeButtonText,
              { 
                opacity: 1,
                color: buttonSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#ffffff', '#10b981'],
                  extrapolate: 'clamp',
                })
              }
            ]}>
              Companies
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.viewModeButton,
              { backgroundColor: 'transparent' }
            ]}
            onPress={() => changeViewMode('coupons')}
            disabled={isTransitioning}
          >
            <Animated.View style={{ opacity: 1 }}>
              <Ionicons 
                name="receipt" 
                size={16} 
                color={viewMode === 'coupons' ? '#ffffff' : '#10b981'} 
              />
            </Animated.View>
            <Animated.Text style={[
              styles.viewModeButtonText,
              { 
                opacity: 1,
                color: buttonSlideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['#10b981', '#ffffff'],
                  extrapolate: 'clamp',
                })
              }
            ]}>
              All Offers
            </Animated.Text>
          </TouchableOpacity>
        </View>

        {/* Last Updated timestamp - below toggle */}
        {lastUpdated && (
          <Text style={{
            textAlign: 'center',
            fontSize: 10,
            color: '#9ca3af',
            marginTop: 6,
            marginBottom: 4,
          }}>
            Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        {/* Content based on view mode */}
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View 
            style={{
              flex: 1,
              flexDirection: 'row',
              width: '200%',
              transform: [{
                translateX: slideAnim
              }]
            }}
          >
            {/* Companies View (left side) */}
            <View style={{ flex: 1, width: '50%' }}>
              {filteredCompanies.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="business-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>
                    {searchQuery.trim() ? 'No companies match your search' : 'No companies available'}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {searchQuery.trim() ? 'Try adjusting your search terms' : 'Check back later for new offers'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={companiesListRef}
                  data={filteredCompanies}
                  renderItem={renderCompanyCard}
                  keyExtractor={(item, index) => `company-${item.name}-${index}`}
                  contentContainerStyle={styles.cardList}
                  showsVerticalScrollIndicator={true}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#7C3AED"
                      colors={['#7C3AED']}
                    />
                  }
                />
              )}
            </View>

            {/* Coupons View (right side) */}
            <View style={{ flex: 1, width: '50%' }}>
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
                  ref={couponsListRef}
                  data={filteredCoupons}
                  renderItem={renderCouponCard}
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={styles.cardList}
                  showsVerticalScrollIndicator={true}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      tintColor="#7C3AED"
                      colors={['#7C3AED']}
                    />
                  }
                />
              )}
            </View>
          </Animated.View>
        </View>

        <CouponDetailModal
          visible={modalVisible}
          coupon={selectedCoupon}
          onClose={() => setModalVisible(false)}
        />

        <SearchModal
          visible={searchModalVisible}
          onClose={() => setSearchModalVisible(false)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          sortBy={sortBy}
          setSortBy={setSortBy}
          resultsCount={viewMode === 'companies' ? filteredCompanies.length : filteredCoupons.length}
        />
      </View>
    </LinearGradient>
  );
};
