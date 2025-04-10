import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../service/firebase';
import { useTheme } from '../service/themeContext';

const DriverRideHistory = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  useEffect(() => {
    fetchRideHistory();
  }, []);
  
  const fetchRideHistory = async () => {
    try {
      setLoading(true);
      
      if (!auth.currentUser) return;
      
      // Query driver's ride history
      const q = query(
        collection(db, 'driverHistory'),
        where('driverId', '==', auth.currentUser.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const historyItems = [];
      
      querySnapshot.forEach((doc) => {
        historyItems.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Sort by date (newest first)
      historyItems.sort((a, b) => {
        const dateA = new Date(a.date + ' ' + a.time);
        const dateB = new Date(b.date + ' ' + b.time);
        return dateB.getTime() - dateA.getTime();
      });
      
      setRideHistory(historyItems);
    } catch (error) {
      console.error('Error fetching ride history:', error);
      Alert.alert('Error', 'Could not load ride history');
    } finally {
      setLoading(false);
    }
  };
  
  const markAsCompleted = async (rideId) => {
    try {
      setProcessingId(rideId);
      const timestamp = new Date();
      
      // Get the ride details
      const ride = rideHistory.find(r => r.id === rideId);
      if (!ride) {
        throw new Error('Ride not found');
      }
      
      // Create a batch to ensure all updates happen together
      const batch = writeBatch(db);
      
      // Update driver history
      const driverHistoryRef = doc(db, 'driverHistory', rideId);
      batch.update(driverHistoryRef, {
        status: 'completed',
        completedAt: timestamp
      });
      
      // Update carpool document if it exists
      if (ride.rideId) {
        const carpoolRef = doc(db, 'carpool', ride.rideId);
        batch.update(carpoolRef, {
          status: 'completed',
          completedAt: timestamp
        });
        
        // Find and update user's history
        const userHistoryQuery = query(
          collection(db, 'history'),
          where('rideId', '==', ride.rideId)
        );
        
        const userHistorySnapshot = await getDocs(userHistoryQuery);
        userHistorySnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'completed',
            completedAt: timestamp
          });
        });
      }
      
      // Commit all updates
      await batch.commit();
      
      // Update UI
      setRideHistory(prev => 
        prev.map(ride => 
          ride.id === rideId ? { ...ride, status: 'completed' } : ride
        )
      );
      
      Alert.alert('Success', 'Ride marked as completed!');
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to mark ride as completed');
    } finally {
      setProcessingId(null);
    }
  };
  
  const cancelRide = async (rideId) => {
    try {
      setProcessingId(rideId);
      const timestamp = new Date();
      
      // Get the ride details
      const ride = rideHistory.find(r => r.id === rideId);
      if (!ride) {
        throw new Error('Ride not found');
      }
      
      // Create a batch for atomic updates
      const batch = writeBatch(db);
      
      // Update driver history
      const driverHistoryRef = doc(db, 'driverHistory', rideId);
      batch.update(driverHistoryRef, {
        status: 'cancelled',
        cancelledAt: timestamp,
        cancelledBy: 'driver'
      });
      
      // Update related documents
      if (ride.rideId) {
        // Update carpool document
        const carpoolRef = doc(db, 'carpool', ride.rideId);
        batch.update(carpoolRef, {
          status: 'cancelled',
          cancelledAt: timestamp,
          cancelledBy: 'driver'
        });
        
        // Find and update user's history
        const userHistoryQuery = query(
          collection(db, 'history'),
          where('rideId', '==', ride.rideId)
        );
        
        const userHistorySnapshot = await getDocs(userHistoryQuery);
        userHistorySnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            status: 'cancelled',
            cancelledAt: timestamp,
            cancelledBy: 'driver'
          });
        });
      }
      
      // Commit all updates
      await batch.commit();
      
      // Update UI
      setRideHistory(prev => 
        prev.map(ride => 
          ride.id === rideId ? { ...ride, status: 'cancelled' } : ride
        )
      );
      
      Alert.alert('Success', 'Ride cancelled successfully');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', 'Failed to cancel ride');
    } finally {
      setProcessingId(null);
    }
  };
  
  const styles = getStyles(isDarkMode);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading ride history...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ride History</Text>
      
      {rideHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ride history available</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchRideHistory}>
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rideHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.routeText}>{item.from} → {item.to}</Text>
                <View style={[
                  styles.statusBadge,
                  item.status === 'completed' ? styles.completedBadge : 
                  item.status === 'cancelled' ? styles.cancelledBadge : 
                  styles.activeBadge
                ]}>
                  <Text style={styles.statusText}>
                    {item.status === 'completed' ? 'Completed' : 
                     item.status === 'cancelled' ? 'Cancelled' : 
                     'Active'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.dateText}>{item.date} at {item.time}</Text>
              <Text style={styles.passengerText}>Passenger: {item.userName || 'Anonymous'}</Text>
              
              {item.status === 'accepted' && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => markAsCompleted(item.id)}
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Complete</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => cancelRide(item.id)}
                    disabled={processingId === item.id}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const getStyles = (isDarkMode) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: isDarkMode ? '#121212' : '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: isDarkMode ? '#121212' : '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: isDarkMode ? '#d1d5db' : '#4b5563',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  card: {
    backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDarkMode ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: isDarkMode ? '#065F46' : '#D1FAE5',
  },
  activeBadge: {
    backgroundColor: isDarkMode ? '#422006' : '#FEF3C7',
  },
  cancelledBadge: {
    backgroundColor: isDarkMode ? '#4B0519' : '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
  },
  dateText: {
    fontSize: 16,
    color: isDarkMode ? '#d1d5db' : '#4b5563',
    marginBottom: 12,
  },
  passengerText: {
    fontSize: 14,
    color: isDarkMode ? '#d1d5db' : '#4b5563',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  completeButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    flex: 1,
    marginRight: 8,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default DriverRideHistory;