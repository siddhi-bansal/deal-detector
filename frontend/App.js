import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

// Import context
import { FavoritesProvider } from './context/FavoritesContext';

// Import screens
import { HomeScreen } from './screens/HomeScreen';
import { AddCouponScreen } from './screens/AddCouponScreen';
import { FavoritesScreen } from './screens/FavoritesScreen';
import { ProfileScreen } from './screens/ProfileScreen';

import { styles } from './styles/styles';

const Tab = createBottomTabNavigator();

const CustomHeader = ({ routeName }) => {
  const getTitle = (name) => {
    switch (name) {
      case 'Home':
        return 'My Coupons';
      case 'Add':
        return 'Add Coupon';
      case 'Favorites':
        return 'Favorites';
      case 'Profile':
        return 'Profile';
      default:
        return 'Deal Detector';
    }
  };

  return (
    <LinearGradient
      colors={['#6366f1', '#8b5cf6', '#ec4899']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Text style={styles.headerTitle}>{getTitle(routeName)}</Text>
    </LinearGradient>
  );
};

function TabNavigator() {
  const [currentRoute, setCurrentRoute] = React.useState('Home');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f3ff' }}>
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
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopWidth: 1,
            borderTopColor: '#e5e7eb',
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
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
          component={HomeScreen}
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
    <FavoritesProvider>
      <NavigationContainer>
        <TabNavigator />
      </NavigationContainer>
    </FavoritesProvider>
  );
}

