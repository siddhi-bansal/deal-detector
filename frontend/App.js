import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

// Import context
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import screens
import { HomeScreen } from './screens/HomeScreen';
import { AddCouponScreen } from './screens/AddCouponScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { CompanyOffersScreen } from './screens/CompanyOffersScreen';
import LoginScreen from './screens/LoginScreen';

import { styles } from './styles/styles';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomHeader = ({ routeName }) => {
  const getHeaderContent = (routeName) => {
    if (routeName === 'Home') {
      return (
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="receipt-outline" size={24} color="#ffffff" />
          </View>
          <Text style={styles.logoText}>Deal Detector</Text>
        </View>
      );
    }
    
    // For other screens, return null to hide the title completely
    switch (routeName) {
      case 'Add':
      case 'Favorites':
      case 'Profile':
        return null;
      default:
        return 'Deal Detector';
    }
  };

  const headerContent = getHeaderContent(routeName);

  // If no header content, return null to hide the header completely
  if (!headerContent) {
    return null;
  }

  return (
    <View style={styles.header}>
      {typeof headerContent === 'string' ? (
        <Text style={styles.headerTitle}>{headerContent}</Text>
      ) : (
        headerContent
      )}
    </View>
  );
};

// Home Stack Navigator
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="CompanyOffers" component={CompanyOffersScreen} />
    </Stack.Navigator>
  );
}

function TabNavigator() {
  const [currentRoute, setCurrentRoute] = React.useState('Home');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <CustomHeader routeName={currentRoute} />
      
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Add') {
              iconName = focused ? 'add-circle' : 'add-circle-outline';
            } else if (route.name === 'Favorites') {
              iconName = focused ? 'heart' : 'heart-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#10b981',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 0,
            paddingBottom: 2,
            paddingTop: 2,
            height: 45,
            shadowOpacity: 0,
            elevation: 0,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            marginTop: 2,
          },
        })}
        screenListeners={{
          tabPress: (e) => {
            setCurrentRoute(e.target.split('-')[0]);
          },
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeStack}
          options={{ title: 'Home' }}
          listeners={{
            focus: () => setCurrentRoute('Home'),
          }}
        />
        <Tab.Screen 
          name="Add" 
          component={AddCouponScreen}
          options={{ title: 'Add Coupon' }}
          listeners={{
            focus: () => setCurrentRoute('Add'),
          }}
        />
        <Tab.Screen 
          name="Favorites" 
          component={FavoritesScreen}
          options={{ title: 'Favorites' }}
          listeners={{
            focus: () => setCurrentRoute('Favorites'),
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ title: 'Profile' }}
          listeners={{
            focus: () => setCurrentRoute('Profile'),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </FavoritesProvider>
    </AuthProvider>
  );
}

// Create a component that uses auth context
function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#ecfdf5', '#d1fae5']}
          style={styles.container}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, color: '#10b981', fontWeight: '600' }}>
              Loading...
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show main app if authenticated
  return <TabNavigator />;
}

