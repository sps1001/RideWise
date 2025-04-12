import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../service/firebase';
import { useTheme } from '../service/themeContext';
import DashboardTemplate from './dashboardTemplate';

const DriverDashboard = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [pendingRides, setPendingRides] = useState(0);
  const [driverName, setDriverName] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const driverDoc = await getDocs(
          query(collection(db, 'drivers'), where('uid', '==', user.uid))
        );
        if (!driverDoc.empty) {
          const data = driverDoc.docs[0].data();
          setDriverName(data.username || 'Driver');
        } else {
          setDriverName('Driver');
        }

        const rideQuery = query(collection(db, 'carpool'), where('status', '==', 'requested'));
        const rideSnapshot = await getDocs(rideQuery);
        setPendingRides(rideSnapshot.size);
      } catch (err) {
        console.error('❌ Error loading dashboard data:', err);
      }
    };

    fetchDashboardData();

    const unsubscribe = onSnapshot(
      query(collection(db, 'carpool'), where('status', '==', 'requested')),
      (snapshot) => {
        setPendingRides(snapshot.docs.length);
        console.log(`🔄 Real-time update: ${snapshot.docs.length} pending rides`);
      }
    );

    return () => unsubscribe();
  }, []);

  const cardData = [
    {
      title: 'Ride Requests',
      description: `${pendingRides} pending requests`,
      route: 'RideRequests',
      source: require('../assets/download.jpg'),
      enabled: true,
    },
    {
      title: 'My Vehicle Details',
      description: 'View or update your vehicle info',
      route: 'DriverVehicleDetailsScreen',
      source: require('../assets/download-1.jpg'),
      enabled: true,
    },
    {
      title: 'Ride History',
      description: 'View your completed rides',
      route: 'DriverRideHistory',
      source: require('../assets/images.jpg'),
      enabled: true,
    },
  ];

  const styles = getStyles(isDarkMode);

  return (
    <DashboardTemplate>
      <View style={styles.container}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, {driverName}</Text>
          <Text style={styles.statusText}>Status: Verified Driver</Text>
        </View>

        {cardData.map((card, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
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
      marginBottom: 16,
      backgroundColor: isDarkMode ? '#1f1f1f' : '#f8f9fa',
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
