import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, query, collection, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../service/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../service/themeContext';
import DashboardTemplate from './dashboardTemplate';

const DriverDashboard = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [isVerified, setIsVerified] = useState(false);
  const [pendingRides, setPendingRides] = useState(0);
  const [driverName, setDriverName] = useState('');
  
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      const driverDoc = await getDoc(doc(db, 'drivers', user.uid));
      if (driverDoc.exists()) {
        const driverData = driverDoc.data();
        setIsVerified(true);
        setDriverName(driverData.username || 'Driver');
        
        // Fetch actual pending ride requests count
        const q = query(
          collection(db, 'carpool'),
          where('status', '==', 'requested')
        );
        const querySnapshot = await getDocs(q);
        setPendingRides(querySnapshot.size);
      } else {
        setIsVerified(true);
        setDriverName('Driver');
        
        // Still fetch ride requests even if driver document doesn't exist
        const q = query(
          collection(db, 'carpool'),
          where('status', '==', 'requested')
        );
        const querySnapshot = await getDocs(q);
        setPendingRides(querySnapshot.size);
      }
    };
    
    checkVerification();
    
    // Set up a real-time listener for ride requests
    const q = query(
      collection(db, 'carpool'),
      where('status', '==', 'requested')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingRides(snapshot.docs.length);
      console.log(`🔄 Real-time update: ${snapshot.docs.length} pending rides`);
    });
    
    return () => unsubscribe();
  }, []);

  const cardData = [
    {
      title: 'Ride Requests',
      description: `${pendingRides} pending requests`,
      route: 'RideRequests',
      source: require('../assets/download.jpg'),
      enabled: true // Always enabled
    },
    {
      title: 'Driver Verification',
      description: 'Status: Verified', // Always show as verified
      route: 'DriverVerification',
      source: require('../assets/download-1.jpg'),
      enabled: true
    },
    {
      title: 'Ride History',
      description: 'View your completed rides',
      route: 'DriverRideHistory',
      source: require('../assets/images.jpg'),
      enabled: true // Always enabled
    },
  ];

  const styles = getStyles(isDarkMode);

  return (
    <DashboardTemplate>
      <View style={styles.container}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {driverName}</Text>
          <Text style={styles.statusText}>
            Status: Verified Driver
          </Text>
        </View>

        {/* Remove the warning card that shows when not verified */}
        
        {cardData.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}  // Remove the conditional styling
            onPress={() => navigation.navigate(card.route as never)}
          >
            <Image source={card.source} style={{ width: 40, height: 40 }} />
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </DashboardTemplate>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 20,
      backgroundColor: isDarkMode ? '#121212' : '#f9f9f9',
    },
    welcomeSection: {
      marginBottom: 20,
    },
    welcomeText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDarkMode ? '#f3f4f6' : '#1f2937',
    },
    statusText: {
      fontSize: 16,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
      marginTop: 4,
    },
    warningCard: {
      backgroundColor: isDarkMode ? '#422006' : '#FEFCE8',
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderLeftWidth: 4,
      borderLeftColor: '#F59E0B',
    },
    warningText: {
      color: isDarkMode ? '#FDE68A' : '#92400E',
    },
    card: {
      width: '100%',
      paddingVertical: 30,
      paddingHorizontal: 20,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 5,
      zIndex: 0,
      marginBottom: 16,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#f8f9fa',
    },
    disabledCard: {
      opacity: 0.7,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 10,
      color: '#3b82f6',
    },
    cardDescription: {
      fontSize: 16,
      textAlign: 'center',
      marginTop: 5,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
    },
  });

export default DriverDashboard;