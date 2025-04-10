import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { useTheme } from '../service/themeContext';

const { width, height } = Dimensions.get('window');

type Props = {
  route: {
    params: {
      origin: { latitude: number; longitude: number };
      destination: { latitude: number; longitude: number };
      realtimeId: string;
    };
  };
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyBGdExMD_KJEa-QVVZGM4bsLbVLfxFMGLA';

const RideWaiting: React.FC<Props> = ({ route }) => {
  const { isDarkMode } = useTheme();
  const mapRef = useRef<MapView>(null);
  const { origin, destination, realtimeId } = route.params;

  const [rideStatus, setRideStatus] = useState<string>('requested');
  const [driverDetails, setDriverDetails] = useState<{ driverId: string; driverName: string } | null>(null);

  // Fit map view
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([origin, destination], {
        edgePadding: { top: 80, right: 80, bottom: 180, left: 80 },
        animated: true,
      });
    }
  }, [origin, destination]);

  const listenToRideRequest = (realtimeId, setRideStatus, setDriverDetails) => {
    console.log('inside ride request listener');
    if (!realtimeId) {
        console.log('No realtimeId provided');
        return;
    }
    console.log(realtimeId);
  
    const db = getDatabase();
    const rideRef = ref(db, `rideRequests`);
  
    onValue(rideRef, (snapshot) => {
      const data = snapshot.val();
      console.log('Ride status updated:', data[realtimeId]);
      const rideData = data[realtimeId];
  
      if (rideData.status) {
        console.log(rideData.status);
        setRideStatus(rideData.status);
        if (rideData.status === 'active' && rideData.driverId && rideData.driverName) {
          setDriverDetails({
            driverId: rideData.driverId,
            driverName: rideData.driverName,
          });
        }
      }
    });
  };

  // Listen for ride status updates
  useEffect(() => {
    console.log('realtime Id:',realtimeId);
    listenToRideRequest(realtimeId, setRideStatus, setDriverDetails);
  }, [realtimeId]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: origin.latitude,
          longitude: origin.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        customMapStyle={isDarkMode ? darkMapStyle : []}
      >
        <Marker coordinate={origin} title="Pickup" />
        <Marker coordinate={destination} title="Destination" pinColor="green" />
        <MapViewDirections
          origin={origin}
          destination={destination}
          apikey={GOOGLE_MAPS_API_KEY}
          strokeWidth={5}
          strokeColor="#FF8008"
        />
      </MapView>

      <View style={[styles.waitingContainer, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
        {rideStatus === 'active' && driverDetails ? (
          <>
            <Text style={[styles.waitingText, { color: isDarkMode ? '#fff' : '#000' }]}>
              Driver Found!
            </Text>
            <Text style={[styles.waitingText, { color: '#FFA72F', marginTop: 5 }]}>
              {driverDetails.driverName}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.waitingText, { color: isDarkMode ? '#fff' : '#000' }]}>
              Looking for drivers...
            </Text>
            <ActivityIndicator size="large" color="#FFA72F" style={{ marginTop: 10 }} />
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height: height * 0.75,
  },
  waitingContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

export default RideWaiting;
