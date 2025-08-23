import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/AuthService';
import { GOOGLE_CONFIG } from '../config/googleConfig';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  // Google OAuth configuration
  // Force use of Expo auth proxy for OAuth redirect
  const redirectUri = 'https://auth.expo.io/@siddhibansal/deal-detector';
  
  console.log('OAuth Redirect URI:', redirectUri); // Debug log
  
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
      scopes: GOOGLE_CONFIG.SCOPES,
      redirectUri: redirectUri,
      prompt: AuthSession.Prompt.SelectAccount, // Force account selection
      additionalParameters: {
        prompt: 'select_account', // Additional parameter for Google
      },
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    }
  );

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      console.log('OAuth Success Response:', response);
      if (response.params?.code) {
        handleGoogleAuthSuccess(response.params.code);
      } else {
        console.error('No authorization code in response:', response);
        Alert.alert('Error', 'No authorization code received');
        setLoading(false);
      }
    } else if (response?.type === 'error') {
      console.error('Google OAuth error:', response.error);
      Alert.alert('Error', `Google Sign-In failed: ${response.error?.message || response.error}`);
      setLoading(false);
    } else if (response?.type === 'cancel') {
      console.log('Google OAuth cancelled by user');
      setLoading(false);
    }
  }, [response]);

  const handleGoogleAuthSuccess = async (authCode) => {
    try {
      // Send the auth code to your backend to exchange for tokens
      const result = await AuthService.googleAuth(authCode);
      
      if (result.success) {
        const loginSuccess = await login(result.token, result.user);
        if (loginSuccess) {
          Alert.alert('Success', 'Signed in successfully!');
        } else {
          Alert.alert('Error', 'Failed to save login data');
        }
      } else {
        Alert.alert('Error', result.message || 'Google Sign-In failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'Failed to authenticate with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    // Set a timeout to reset loading state if OAuth takes too long
    const timeout = setTimeout(() => {
      setLoading(false);
      console.log('OAuth timeout - resetting loading state');
    }, 30000); // 30 seconds timeout
    
    try {
      const result = await promptAsync();
      clearTimeout(timeout);
      
      // If user cancelled or dismissed, reset loading
      if (result.type === 'cancel' || result.type === 'dismiss') {
        setLoading(false);
      }
    } catch (error) {
      clearTimeout(timeout);
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to start Google Sign-In');
      setLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setLoading(true);
    
    try {
      // Mock successful authentication for testing
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        profile_picture: null,
        gmail_connected: false,
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString(),
      };
      
      const mockToken = 'mock-jwt-token-for-testing';
      
      const loginSuccess = await login(mockToken, mockUser);
      
      if (loginSuccess) {
        Alert.alert('Success', 'Test login successful!');
      } else {
        Alert.alert('Error', 'Failed to save login data');
      }
    } catch (error) {
      console.error('Test login error:', error);
      Alert.alert('Error', 'Test login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#059669', '#047857']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo and Title */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="pricetag" size={60} color="white" />
            </View>
            <Text style={styles.title}>Deal Detector</Text>
            <Text style={styles.subtitle}>
              Find and organize your best deals from email
            </Text>
          </View>

          {/* Login Buttons */}
          <View style={styles.buttonContainer}>
            {/* Custom Google Sign-In Button (Expo Compatible) */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#4285f4" />
              ) : (
                <>
                  <Image 
                    source={require('../assets/google-logo.png')} 
                    style={styles.googleLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Test Login Button (Remove in production) */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestLogin}
              disabled={loading}
            >
              <Ionicons name="flask" size={20} color="white" />
              <Text style={styles.testButtonText}>Test Login (Development)</Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <Ionicons name="mail" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.featureText}>Connect your Gmail</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="search" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.featureText}>AI-powered extraction</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="heart" size={24} color="rgba(255,255,255,0.8)" />
              <Text style={styles.featureText}>Save your favorites</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
  },
  googleButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12, // Makes it circular (half of width/height)
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
  },
  testButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    marginLeft: 8,
  },
  features: {
    alignItems: 'center',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 12,
  },
});

export default LoginScreen;
