import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTheme } from '../service/themeContext';
import { db, auth } from '../service/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';

const RideHistory = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [rideData, setRideData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRideHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(collection(db, 'history'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const rides = [];
      querySnapshot.forEach((doc) => {
        rides.push({ id: doc.id, ...doc.data() });
      });

      rides.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

      setRideData(rides);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (rideId, from, to, date, time) => {
    try {
      // Step 1: Delete from 'carpool' collection
      const carpoolQuery = query(
        collection(db, 'carpool'),
        where('userId', '==', auth.currentUser.uid),
        where('from', '==', from),
        where('to', '==', to),
        where('date', '==', date),
        where('time', '==', time)
      );

      const carpoolSnapshot = await getDocs(carpoolQuery);
      carpoolSnapshot.forEach(async (docSnap) => {
        await deleteDoc(doc(db, 'carpool', docSnap.id));
      });

      // Step 2: Update rUI (mark status as completed in state)
      setRideData((prevData) =>
        prevData.map((ride) =>
          ride.id === rideId ? { ...ride, status: 'Completed' } : ride
        )
      );
    } catch (error) {
      console.error('Error marking ride as completed:', error);
    }
  };

  // Add this function to allow users to cancel their accepted rides
  const cancelRide = async (rideId, driverId) => {
    try {
      // Update in user history
      await updateDoc(doc(db, 'history', rideId), {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'user'
      });
      
      // Find matching carpool entry to update
      const carpoolQuery = query(
        collection(db, 'carpool'),
        where('userId', '==', auth.currentUser.uid),
        where('driverId', '==', driverId)
      );
      
      const carpoolSnapshot = await getDocs(carpoolQuery);
      carpoolSnapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: 'user'
        });
      });
      
      // Update driver's history as well
      const driverHistoryQuery = query(
        collection(db, 'driverHistory'),
        where('userId', '==', auth.currentUser.uid),
        where('driverId', '==', driverId)
      );
      
      const driverHistorySnapshot = await getDocs(driverHistoryQuery);
      driverHistorySnapshot.forEach(async (doc) => {
        await updateDoc(doc.ref, {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledBy: 'user'
        });
      });
      
      // Update UI
      setRideData((prevData) =>
        prevData.map((ride) =>
          ride.id === rideId ? { ...ride, status: 'Cancelled' } : ride
        )
      );
      
      Alert.alert('Success', 'Ride cancelled successfully');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      Alert.alert('Error', 'Failed to cancel ride');
    }
  };

  useEffect(() => {
    fetchRideHistory();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}>
      <Text style={[styles.header, { color: isDarkMode ? '#93c5fd' : '#3b82f6' }]}>Ride History</Text>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? '#60a5fa' : '#2563eb'} />
      ) : rideData.length === 0 ? (
        <Text style={[styles.emptyText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
          No rides found.
        </Text>
      ) : (
        <FlatList
          data={rideData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => { }}
              style={[
                styles.rideCard,
                { backgroundColor: isDarkMode ? '#374151' : '#ffffff' },
              ]}
            >
              <View style={styles.rideInfo}>
                <Text style={[styles.rideText, { color: isDarkMode ? '#f9fafb' : '#374151' }]}>
                  {item.date} at {item.time}
                </Text>
                <Text style={[styles.rideText, { color: isDarkMode ? '#f9fafb' : '#374151' }]}>
                  From: {item.from}
                </Text>
                <Text style={[styles.rideText, { color: isDarkMode ? '#f9fafb' : '#374151' }]}>
                  To: {item.to}
                </Text>
                
                {item.driverName && (
                  <Text style={[styles.rideText, { color: isDarkMode ? '#f9fafb' : '#374151' }]}>
                    Driver: {item.driverName}
                  </Text>
                )}
                
                <Text
                  style={[
                    styles.rideStatus,
                    item.status === 'Completed' ? styles.completed : 
                    item.status === 'Cancelled' ? styles.cancelled :
                    item.status === 'accepted' ? styles.accepted : styles.upcoming,
                  ]}
                >
                  {item.status}
                </Text>

                {item.status === 'accepted' && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => cancelRide(item.id, item.driverId)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel Ride</Text>
                  </TouchableOpacity>
                )}
                
                {item.status !== 'Completed' && item.status !== 'accepted' && item.status !== 'Cancelled' && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() =>
                      markAsCompleted(item.id, item.from, item.to, item.date, item.time)
                    }
                  >
                    <Text style={styles.completeButtonText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
  },
  completeButton: {
    marginTop: 10,
    backgroundColor: '#10b981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  completeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
    backgroundColor: '#ef4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rideCard: {
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
  },
  rideInfo: {
    justifyContent: 'center',
  },
  rideText: {
    fontSize: 16,
  },
  rideStatus: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  completed: {
    color: 'green',
  },
  cancelled: {
    color: '#ef4444',
  },
  accepted: {
    color: '#3b82f6',
  },
  upcoming: {
    color: 'orange',
  },
});

export default RideHistory;
