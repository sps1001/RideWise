import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../service/themeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LandingPage = () => {
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  
  // Optional: Check authentication status when landing page loads
  // This lets already authenticated users skip the login screen
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const userType = await AsyncStorage.getItem('userType');
      
      // If you want to auto-redirect authenticated users
      // if (token) {
      //   navigation.navigate(userType === 'driver' ? 'DriverDashboard' : 'Dashboard');
      // }
    };
    
    checkAuth();
  }, []);
  
  return (
    <LinearGradient 
      colors={isDarkMode ? ['#121212', '#1e1e1e'] : ['#e0f2ff', '#b9e6ff']} 
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>RideWise</Text>
        <Text style={styles.tagline}>Choose your role to continue</Text>
      </View>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={[styles.optionCard, isDarkMode && styles.darkOptionCard]} 
          onPress={() => navigation.navigate('Login')}
        >
          <Image 
            source={require('../assets/user-icon.png')} 
            style={styles.optionIcon} 
            resizeMode="contain"
          />
          <Text style={[styles.optionText, isDarkMode && styles.darkText]}>Passenger</Text>
          <Text style={[styles.optionDescription, isDarkMode && styles.darkText]}>
            Book rides and travel safely
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.optionCard, isDarkMode && styles.darkOptionCard]} 
          onPress={() => navigation.navigate('DriverLogin')}
        >
          <Image 
            source={require('../assets/driver-icon.png')} 
            style={styles.optionIcon} 
            resizeMode="contain"
          />
          <Text style={[styles.optionText, isDarkMode && styles.darkText]}>Driver</Text>
          <Text style={[styles.optionDescription, isDarkMode && styles.darkText]}>
            Offer rides and earn money
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  darkOptionCard: {
    backgroundColor: '#2a2a2a',
  },
  optionIcon: {
    width: 70,
    height: 70,
    marginBottom: 15,
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: '#64748b',
  },
  darkText: {
    color: '#f3f4f6',
  }
});

export default LandingPage;