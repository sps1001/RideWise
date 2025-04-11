import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useTheme } from '../service/themeContext';
import { auth, db } from '../service/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AnalyticsScreen = () => {
  const { isDarkMode } = useTheme();
  const [userType, setUserType] = useState<'user' | 'driver' | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRides: 0,
    completedRides: 0,
    cancelledRides: 0,
    totalEarnings: 0,
    totalCost: 0,
    totalDistance: 0,
    totalTime: 0
  });

  const fetchUserType = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    // Fetch userType (assuming a `users` collection holds roles)
    const userType= await AsyncStorage.getItem('userType');
    setUserType(userType === 'driver' ? 'driver' : 'user');
  };

  const fetchAnalytics = async () => {
    try {
      const uid = auth.currentUser?.uid;
      console.log('UID:', uid);
      if (!uid) return;

      let targetCollection = userType === 'driver' ? 'driverHistory' : 'history';
      let q;
      if(userType === 'driver') {
        q = query(collection(db, targetCollection), where('driverId', '==', uid));
      }
      else{
        q = query(collection(db, targetCollection), where('userId', '==', uid));
      }
      const querySnapshot = await getDocs(q);

      let total = 0, completed = 0, cancelled = 0;
      let earnings = 0, cost = 0, distance = 0, time = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.status === 'Completed') completed++;
        if (data.status === 'Cancelled') cancelled++;

        if (userType === 'driver') {
          earnings += data.amount || 0;
          distance += data.distance || 0;
          time += data.duration || 0;
        } else {
          cost += data.amount || 0;
          distance += data.distance || 0;
          time += data.duration || 0;
        }
      });

      setStats({
        totalRides: total,
        completedRides: completed,
        cancelledRides: cancelled,
        totalEarnings: earnings,
        totalCost: cost,
        totalDistance: distance,
        totalTime: time,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchUserType();
    };
    init();
  }, []);

  useEffect(() => {
    if (userType) {
      fetchAnalytics();
    }
  }, [userType]);

  if (loading || userType === null) {
    return (
      <View style={[styles.container, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#60a5fa' : '#2563eb'} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}>
      <Text style={[styles.header, { color: isDarkMode ? '#93c5fd' : '#3b82f6' }]}>
        {userType === 'driver' ? 'Driver' : 'User'} Ride Analytics
      </Text>

      <View style={styles.cardContainer}>
        <StatCard label="Total Rides" value={stats.totalRides} color="#6366f1" />
        <StatCard label="Completed" value={stats.completedRides} color="#10b981" />
        <StatCard label="Cancelled" value={stats.cancelledRides} color="#ef4444" />

        {userType === 'driver' ? (
            <>
                <StatCard label="Total Earnings" value={`₹${stats.totalEarnings.toFixed(2)}`} color="#f59e0b" />
                <StatCard label="Distance Travelled" value={`${stats.totalDistance.toFixed(2)} km`} color="#3b82f6" />
                <StatCard label="Time Spent" value={`${stats.totalTime.toFixed(1)} min`} color="#8b5cf6" />
            </>
        ) : (
          <>
            <StatCard label="Total Spent" value={`₹${stats.totalCost.toFixed(2)}`} color="#f59e0b" />
            <StatCard label="Distance Travelled" value={`${stats.totalDistance.toFixed(2)} km`} color="#3b82f6" />
            <StatCard label="Time Spent" value={`${stats.totalTime.toFixed(1)} min`} color="#8b5cf6" />
          </>
        )}
      </View>
    </ScrollView>
  );
};

const StatCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <View style={[styles.statCard, { borderColor: color }]}>
    <Text style={[styles.statLabel, { color }]}>{label}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  cardContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  statCard: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#ffffff10',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 6,
  },
});

export default AnalyticsScreen;
