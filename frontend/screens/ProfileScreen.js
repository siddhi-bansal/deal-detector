import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '../context/FavoritesContext';
import { getTotalCouponsCount } from '../utils/couponUtils';
import { styles } from '../styles/styles';

export const ProfileScreen = () => {
  const { getFavoritesCount } = useFavorites();
  const totalCoupons = getTotalCouponsCount();
  const handleSettingPress = (setting) => {
    Alert.alert('Coming Soon', `${setting} feature will be available in future updates.`);
  };

  const ProfileOption = ({ icon, title, subtitle, onPress, showChevron = true }) => (
    <TouchableOpacity style={styles.profileOption} onPress={onPress}>
      <View style={styles.profileOptionLeft}>
        <View style={styles.profileOptionIcon}>
          <Ionicons name={icon} size={24} color="#10b981" />
        </View>
        <View style={styles.profileOptionText}>
          <Text style={styles.profileOptionTitle}>{title}</Text>
          {subtitle && <Text style={styles.profileOptionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );

  const StatCard = ({ icon, value, label, color }) => (
    <LinearGradient
      colors={[color, color + '80']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <Ionicons name={icon} size={28} color="white" />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );

  return (
    <LinearGradient
      colors={['#ecfdf5', '#d1fae5']}
      style={styles.container}
    >
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileAvatar}
          >
            <Ionicons name="person" size={40} color="white" />
          </LinearGradient>
          <Text style={styles.profileName}>Coupon User</Text>
          <Text style={styles.profileEmail}>user@example.com</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard 
            icon="pricetag" 
            value={totalCoupons.toString()} 
            label="Coupons" 
            color="#10b981" 
          />
          <StatCard 
            icon="heart" 
            value={getFavoritesCount().toString()} 
            label="Favorites" 
            color="#ef4444" 
          />
          <StatCard 
            icon="checkmark-circle" 
            value="12" 
            label="Used" 
            color="#22c55e" 
          />
        </View>

        {/* Profile Options */}
        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Account Settings</Text>
          
          <ProfileOption
            icon="person-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => handleSettingPress('Edit Profile')}
          />
          
          <ProfileOption
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => handleSettingPress('Notifications')}
          />
          
          <ProfileOption
            icon="lock-closed-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => handleSettingPress('Privacy & Security')}
          />
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>App Settings</Text>
          
          <ProfileOption
            icon="color-palette-outline"
            title="Theme"
            subtitle="Choose your preferred theme"
            onPress={() => handleSettingPress('Theme')}
          />
          
          <ProfileOption
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => handleSettingPress('Language')}
          />
          
          <ProfileOption
            icon="cloud-download-outline"
            title="Data & Storage"
            subtitle="Manage your data preferences"
            onPress={() => handleSettingPress('Data & Storage')}
          />
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Support</Text>
          
          <ProfileOption
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => handleSettingPress('Help & Support')}
          />
          
          <ProfileOption
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => handleSettingPress('Terms of Service')}
          />
          
          <ProfileOption
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => handleSettingPress('Privacy Policy')}
          />
          
          <ProfileOption
            icon="information-circle-outline"
            title="About"
            subtitle="Version 1.0.0"
            onPress={() => handleSettingPress('About')}
          />
        </View>

        {/* Logout Button */}
        <View style={styles.profileSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => Alert.alert('Logout', 'Are you sure you want to logout?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Logout', style: 'destructive' }
            ])}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};
