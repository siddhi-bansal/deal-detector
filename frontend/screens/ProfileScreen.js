import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useFavorites } from '../context/FavoritesContext';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/AuthService';
import { getTotalCouponsCount } from '../utils/couponUtils';
import { styles } from '../styles/styles';

export const ProfileScreen = ({ navigation }) => {
  const { getFavoritesCount } = useFavorites();
  const { user, token, logout, updateUser } = useAuth();
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const totalCoupons = getTotalCouponsCount();
  
  // Check Gmail status on component mount
  useEffect(() => {
    if (token) {
      checkGmailStatus();
    }
  }, [token]);

  const checkGmailStatus = async () => {
    try {
      const result = await AuthService.getGmailStatus(token);
      if (result.success) {
        // Update user context with latest Gmail status
        updateUser({ ...user, gmail_connected: result.data.connected });
      }
    } catch (error) {
      console.error('Error checking Gmail status:', error);
    }
  };

  const handleGmailConnection = async () => {
    if (user?.gmail_connected) {
      // Show disconnect option
      Alert.alert(
        'Disconnect Gmail',
        'Are you sure you want to disconnect your Gmail account? You will no longer receive new coupons.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              try {
                setGmailConnecting(true);
                const result = await AuthService.disconnectGmail(token);
                if (result.success) {
                  updateUser({ ...user, gmail_connected: false });
                  Alert.alert('Success', 'Gmail disconnected successfully');
                } else {
                  Alert.alert('Error', result.error || 'Failed to disconnect Gmail');
                }
              } catch (error) {
                console.error('Gmail disconnect error:', error);
                Alert.alert('Error', 'Failed to disconnect Gmail');
              } finally {
                setGmailConnecting(false);
              }
            },
          },
        ]
      );
    } else {
      // Connect Gmail
      try {
        setGmailConnecting(true);
        
        // Get Gmail connection URL from backend
        const result = await AuthService.getGmailConnectionUrl(token);
        if (result.success) {
          // Open OAuth flow in browser
          const authResult = await WebBrowser.openAuthSessionAsync(
            result.data.oauth_url,
            'dealdetector://' // This will receive dealdetector://gmail?connected=true
          );
          
          if (authResult.type === 'success' && authResult.url) {
            const url = new URL(authResult.url);
            const connected = url.searchParams.get('connected');
            const message = url.searchParams.get('message');
            
            if (connected === 'true') {
              updateUser({ ...user, gmail_connected: true });
              Alert.alert('Success', decodeURIComponent(message || 'Gmail connected successfully!'));
            } else {
              const error = url.searchParams.get('error');
              Alert.alert('Error', decodeURIComponent(error || 'Failed to connect Gmail'));
            }
          }
        } else {
          Alert.alert('Error', result.error || 'Failed to start Gmail connection');
        }
      } catch (error) {
        console.error('Gmail connection error:', error);
        Alert.alert('Error', 'Failed to connect Gmail');
      } finally {
        setGmailConnecting(false);
      }
    }
  };
  
  const handleSettingPress = (setting) => {
    Alert.alert('Coming Soon', `${setting} feature will be available in future updates.`);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            const success = await logout();
            if (success) {
              // Navigation will be handled by App.js when auth state changes
            } else {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
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

  const StatCard = ({ icon, value, label, color, onPress }) => {
    const CardContent = (
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

    if (onPress) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1 }}>
          {CardContent}
        </TouchableOpacity>
      );
    }
    
    return <View style={{ flex: 1 }}>{CardContent}</View>;
  };

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
          <Text style={styles.profileName}>
            {user?.first_name && user?.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user?.email || 'Coupon User'}
          </Text>
          <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          
          {/* Gmail Connection Status */}
          <View style={styles.gmailConnectionStatus}>
            <Ionicons 
              name={user?.gmail_connected ? "checkmark-circle" : "alert-circle"} 
              size={16} 
              color={user?.gmail_connected ? "#10b981" : "#f59e0b"} 
            />
            <Text style={[
              styles.gmailStatusText,
              { color: user?.gmail_connected ? "#10b981" : "#f59e0b" }
            ]}>
              Gmail {user?.gmail_connected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard 
            icon="pricetag" 
            value={totalCoupons.toString()} 
            label="Coupons" 
            color="#10b981"
            onPress={() => navigation.navigate('Home', { 
              screen: 'HomeMain',
              params: { initialViewMode: 'coupons' }
            })}
          />
          <StatCard 
            icon="heart" 
            value={getFavoritesCount().toString()} 
            label="Favorites" 
            color="#ef4444"
            onPress={() => navigation.navigate('Favorites')}
          />
          <StatCard 
            icon="checkmark-circle" 
            value="12" 
            label="Used" 
            color="#22c55e"
            onPress={() => handleSettingPress('Used Coupons')}
          />
        </View>

        {/* Profile Options */}
        <View style={styles.profileSection}>
          <Text style={styles.profileSectionTitle}>Account Settings</Text>
          
          <ProfileOption
            icon={user?.gmail_connected ? "mail" : "mail-outline"}
            title="Gmail Connection"
            subtitle={
              gmailConnecting 
                ? "Connecting..." 
                : user?.gmail_connected 
                  ? "Connected - Tap to disconnect" 
                  : "Connect your Gmail account"
            }
            onPress={handleGmailConnection}
            showChevron={!gmailConnecting}
          />
          {gmailConnecting && (
            <View style={{ alignItems: 'center', marginVertical: 10 }}>
              <ActivityIndicator color="#10b981" />
            </View>
          )}
          
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
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};
