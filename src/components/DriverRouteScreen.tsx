import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Alert, TextInput, Modal, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { getDatabase, ref, get,set , ref as dbRef,update,remove,onValue} from 'firebase/database';
import { useRoute, useNavigation } from '@react-navigation/native';
import { collection,addDoc } from 'firebase/firestore';
import { db ,auth} from '../service/firebase';

type RouteParams = {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  realtimeId: string;
};

const DriverRouteScreen = () => {
  const mapRef = useRef<MapView>(null);
  const navigation = useNavigation();
  const route = useRoute();
  const { origin, destination, realtimeId } = (route.params || {}) as RouteParams;

  const [currentStep, setCurrentStep] = useState<'pickup' | 'drop'>('pickup');
  const [otp, setOtp] = useState('');
  const [expectedOtp, setExpectedOtp] = useState('');
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    const startWatchingLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required.');
          return;
        }
      
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (location) => {
            const { latitude, longitude } = location.coords;
            const newLocation = { latitude, longitude };
            setDriverLocation(newLocation);
      
            // ⬇️ Send driver's location to Firebase
            try {
              const db = getDatabase();
              await set(ref(db, `rideRequests/${realtimeId}/driverLocation`), newLocation);
            } catch (error) {
              console.error("Failed to update driver's location in Firebase:", error);
            }
      
            // Center map to new location
            mapRef.current?.animateToRegion({
              ...newLocation,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
        );
      
      };

      startWatchingLocation();

      return () => {
        locationSubscription?.remove(); // ✅ Proper cleanup
      };
  }, []);

  const fetchOtpFromDB = async () => {
    try {
      const db = getDatabase();
      const otpRef = ref(db, `rideRequests/${realtimeId}/otp`);
      const snapshot = await get(otpRef);
      if (snapshot.exists()) {
        setExpectedOtp(snapshot.val());
        setOtpModalVisible(true);
      } else {
        Alert.alert('Error', 'OTP not found in database');
      }
    } catch (error) {
      console.error('Error fetching OTP:', error);
      Alert.alert('Error', 'Failed to fetch OTP');
    }
  };

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371; // Earth radius in km
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
  
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('Invalid date format for duration calculation', { startTime, endTime });
      return 0;
    }
  
    const durationInMs = end.getTime() - start.getTime();
    return Math.floor(durationInMs / 60000);
  };

  const handleOtpSubmit = async () => {
    if (otp.trim() === expectedOtp.toString()) {
      try {
        const db = getDatabase();
        const rideRef = dbRef(db, `rideRequests/${realtimeId}`);
  
        // Mark OTP as verified in Firebase
        await update(rideRef, { otpVerified: true });
        await update(rideRef, { isRideCompleted: false }); // Check if ride is completed
  
        setOtpModalVisible(false);
        Alert.alert('OTP Verified', 'Navigating to drop location...');
        setCurrentStep('drop'); // If you use this state to control navigation or map
      } catch (error) {
        console.error('Failed to update otpVerified in Firebase:', error);
        Alert.alert('Error', 'Could not verify OTP. Please try again.');
      }
    } else {
      Alert.alert('Invalid OTP', 'Please try again');
    }
  };

  const handleDropoff = async () => {
    try {
      const d = getDatabase();
      const rideRef = dbRef(d, `rideRequests/${realtimeId}`);
      
      // Fetch actual ride data
      const snapshot = await get(rideRef);
      const rideData = snapshot.val();
  
      if (!rideData) {
        Alert.alert('Error', 'No ride data found.');
        return;
      }
  
      // Mark ride as completed in Firebase
      await update(rideRef, { isRideCompleted: true ,isUserConfirmed:false});
  
      Alert.alert('Waiting for user confirmation', 'Please wait for the user to confirm the drop-off.');
  
      const unsubscribe = onValue(rideRef, async (snap) => {
        const data = snap.val();
        if (data && data.isUserConfirmed === true) {
          unsubscribe(); // first stop listening
          try {
            // Save to Firestore history
            const dist=haversineDistance(data.startLat, data.startLong,data.endLat,data.endLong);
            const dur=calculateDuration(data.time, new Date().toISOString());
            await addDoc(collection(db, 'driverHistory'), {
              userId: data.userId,
              date: new Date().toISOString(),
              time: new Date().toLocaleTimeString(),
              from: data.from,
              to: data.to,
              amount: data.amount || 100,
              user: data.userName,
              driverId:data.driverId,
              status: 'Completed',
              distance: dist,
              duration: dur,
            });
      
            await remove(rideRef);
      
            Alert.alert('Ride Completed', 'Ride successfully completed and saved to history.');
            navigation.goBack();
          } catch (error) {
            console.error('Error saving ride to history:', error);
          }
        }
      });
    } catch (error) {
      console.error('Failed to mark ride as completed:', error);
      Alert.alert('Error', 'Could not complete the ride. Please try again.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        showsUserLocation
        followsUserLocation
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={origin} title="Pickup Location" />
        <Marker coordinate={destination} title="Drop Location" pinColor="green" />

        {driverLocation && (
        <MapViewDirections
            origin={driverLocation}
            destination={currentStep === 'pickup' ? origin : destination}
            apikey={'AIzaSyBGdExMD_KJEa-QVVZGM4bsLbVLfxFMGLA'} // Use a secure way in prod
            strokeWidth={4}
            strokeColor="#007bff"
            optimizeWaypoints={true}
            onError={(err) => console.warn('Route error:', err)}
        />
        )}
      </MapView>

      {currentStep === 'pickup' && (
        <TouchableOpacity style={styles.button} onPress={fetchOtpFromDB}>
          <Text style={styles.buttonText}>Arrived at Pickup – Enter OTP</Text>
        </TouchableOpacity>
      )}

      {currentStep === 'drop' && (
        <View>
            <View style={styles.dropTextContainer}>
            <Text style={styles.dropText}>On the way to drop-off location...</Text>
            
            </View>
            <TouchableOpacity style={styles.dropOffButton} onPress={handleDropoff}>
                <Text style={styles.dropOffButtonText}>Dropped off</Text>
            </TouchableOpacity>
        </View>
        
      )}

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter OTP"
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleOtpSubmit}>
              <Text style={styles.modalButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverRouteScreen;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  dropTextContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 10,
    paddingHorizontal: 20,
  },
  dropText: {
    color: '#fff',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  dropOffButton: {
    backgroundColor: '#007BFF', // nice blue
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginTop: 10,
  },
  
  dropOffButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
