import React, { useState, useEffect } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import { auth, db } from '../service/firebase';
import { useTheme } from '../service/themeContext';

const RideRequests = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  
  const [rideRequests, setRideRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  
  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;
      if (!user) return;
      
      // Always set verification status to true
      setIsVerified(true);
      
      // Rest of the code to fetch ride requests
      fetchRideRequests();
    };
    
    checkVerification();
  }, []);
  
  const fetchRideRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch ride requests that have no assigned driver
      const q = query(
        collection(db, 'carpool'), 
        where('status', '==', 'requested')
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRideRequests(requests);
    } catch (error) {
      console.error('Error fetching ride requests:', error);
      Alert.alert('Error', 'Could not load ride requests');
    } finally {
      setLoading(false);
    }
  };
  
  // New function to reset rejected rides to requested
  const resetRejectedRides = async () => {
    try {
      setLoading(true);
      
      // Fetch rejected rides
      const rejectedQuery = query(
        collection(db, 'carpool'),
        where('status', '==', 'rejected')
      );
      
      const rejectedSnapshot = await getDocs(rejectedQuery);
      
      if (rejectedSnapshot.empty) {
        Alert.alert('Info', 'No rejected rides to reset');
        setLoading(false);
        return;
      }
      
      // Use batch to update multiple documents
      const batch = writeBatch(db);
      let count = 0;
      
      rejectedSnapshot.forEach((document) => {
        batch.update(doc(db, 'carpool', document.id), {
          status: 'requested',
          rejectedBy: null,
          rejectedAt: null
        });
        count++;
      });
      
      await batch.commit();
      Alert.alert('Success', `${count} rejected rides have been reset and are now available`);
      
      // Refresh the list to show the newly available rides
      fetchRideRequests();
      
    } catch (error) {
      console.error('Error resetting rejected rides:', error);
      Alert.alert('Error', `Failed to reset rejected rides: ${error.message}`);
      setLoading(false);
    }
  };
  
  const fetchAllRides = async () => {
    try {
      setLoading(true);
      
      // Fetch both requested and rejected rides
      const q = query(
        collection(db, 'carpool'),
        where('status', 'in', ['requested', 'rejected'])
      );
      
      const querySnapshot = await getDocs(q);
      const requests = [];
      
      querySnapshot.forEach((doc) => {
        requests.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setRideRequests(requests);
      Alert.alert('Refreshed', `Found ${requests.length} rides (including rejected)`);
    } catch (error) {
      console.error('Error fetching all rides:', error);
      Alert.alert('Error', 'Could not load all ride requests');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAcceptRide = async (rideId) => {
    if (!auth.currentUser) return;
    
    try {
      setProcessingId(rideId);
      
      // Get the ride first to ensure it exists
      const selectedRide = rideRequests.find(ride => ride.id === rideId);
      if (!selectedRide) {
        throw new Error('Ride not found');
      }
      
      // Get driver name
      const driverName = auth.currentUser.displayName || 'Driver';
      const timestamp = new Date();
      
      // First update the carpool document with just the status (simplest operation)
      console.log(`Updating carpool document: ${rideId}`);
      const carpoolRef = doc(db, 'carpool', rideId);
      await updateDoc(carpoolRef, {
        // Changed from 'accepted' to 'active'
        status: 'active'
      });
      
      // Now that status is changed, update the rest of the fields
      console.log("Updating driver details");
      await updateDoc(carpoolRef, {
        driverId: auth.currentUser.uid,
        driverName: driverName,
        acceptedAt: timestamp
      });
      
      // Create driver history document - without self-referential IDs
      console.log("Creating history records");
      await addDoc(collection(db, 'driverHistory'), {
        driverId: auth.currentUser.uid,
        rideId: rideId,
        userId: selectedRide.userId,
        userName: selectedRide.userName || 'User',
        from: selectedRide.from,
        to: selectedRide.to,
        date: selectedRide.date,
        time: selectedRide.time,
        // Changed from 'accepted' to 'active'
        status: 'active',
        acceptedAt: timestamp
      });
      
      // Create user history document - without self-referential IDs
      await addDoc(collection(db, 'history'), {
        userId: selectedRide.userId,
        rideId: rideId,
        driverId: auth.currentUser.uid,
        driverName: driverName,
        from: selectedRide.from,
        to: selectedRide.to,
        date: selectedRide.date,
        time: selectedRide.time,
        // Changed from 'accepted' to 'active'
        status: 'active',
        acceptedAt: timestamp
      });
      
      // Update UI
      setRideRequests(prev => prev.filter(ride => ride.id !== rideId));
      
      Alert.alert('Success', 'Ride accepted successfully!');
    } catch (error) {
      console.error('Error accepting ride:', error);
      
      // More detailed error for debugging
      if (error.code) {
        console.error(`Firebase error code: ${error.code}`);
      }
      
      Alert.alert('Error', `Failed to accept ride: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };
  
  const handleRejectRide = async (rideId) => {
    try {
      setProcessingId(rideId);
      
      // Get the ride details first
      const selectedRide = rideRequests.find(ride => ride.id === rideId);
      if (!selectedRide) {
        throw new Error('Ride not found');
      }
      
      // Use batch operation to ensure atomic updates (prevents permission errors)
      const batch = writeBatch(db);
      
      // Update ride status to rejected in Firestore
      const carpoolRef = doc(db, 'carpool', rideId);
      batch.update(carpoolRef, {
        status: 'rejected',
        rejectedBy: auth.currentUser.uid,
        rejectedAt: new Date()
      });
      
      // Commit the batch
      await batch.commit();
      
      // Update UI
      setRideRequests(prev => prev.filter(ride => ride.id !== rideId));
      
      Alert.alert('Success', 'Ride request rejected');
    } catch (error) {
      console.error('Error rejecting ride:', error);
      Alert.alert('Error', `Failed to reject ride: ${error.message}`);
    } finally {
      setProcessingId(null);
    }
  };
  
  const styles = getStyles(isDarkMode);
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Available Ride Requests</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchRideRequests}
        >
          <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
        </TouchableOpacity>
      </View>
      
      {rideRequests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No ride requests available</Text>
          <View style={styles.refreshButtonGroup}>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchRideRequests}>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.refreshButton, styles.advancedRefreshButton]} 
              onPress={resetRejectedRides}
            >
              <Text style={styles.refreshButtonText}>Reset Rejected Rides</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={rideRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.routeText}>{item.from} → {item.to}</Text>
                <View style={[
                  styles.statusBadge,
                  item.status === 'rejected' ? styles.rejectedBadge : styles.requestedBadge
                ]}>
                  <Text style={styles.statusText}>
                    {item.status === 'rejected' ? 'Rejected' : 'Requested'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.dateText}>{item.date} at {item.time}</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance:</Text>
                <Text style={styles.detailValue}>{item.distance || 'Not specified'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Est. Fare:</Text>
                <Text style={styles.detailValue}>{item.fare || 'Not calculated'}</Text>
              </View>
              
              {/* Only show action buttons for non-rejected rides */}
              {item.status !== 'rejected' && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRide(item.id)}
                    disabled={processingId === item.id}
                  >
                    {processingId === item.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Accept</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => handleRejectRide(item.id)}
                    disabled={processingId === item.id}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
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
  // Styles remain the same
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
  routeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: isDarkMode ? '#f3f4f6' : '#1f2937',
  },
  dateText: {
    fontSize: 16,
    color: isDarkMode ? '#d1d5db' : '#4b5563',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: isDarkMode ? '#9ca3af' : '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: isDarkMode ? '#d1d5db' : '#4b5563',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  rejectButton: {
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  refreshButtonGroup: {
    flexDirection: 'row',
    marginTop: 12,
  },
  advancedRefreshButton: {
    backgroundColor: '#6366f1',
    marginLeft: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  requestedBadge: {
    backgroundColor: '#3b82f6',
  },
  rejectedBadge: {
    backgroundColor: '#ef4444',
  },
  statusText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default RideRequests;