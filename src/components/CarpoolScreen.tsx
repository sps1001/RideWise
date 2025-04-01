import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CarpoolScreen = () => {
  const navigation = useNavigation();

  // Mock carpool data (replace with Firebase data later)
  const carpoolRides = [
    { id: '1', driver: 'Alice', from: 'Downtown', to: 'Airport', seats: 2 },
    { id: '2', driver: 'Bob', from: 'Station', to: 'University', seats: 3 },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Available Carpools</Text>

      <FlatList
        data={carpoolRides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.driverName}>Driver: {item.driver}</Text>
            <Text>{item.from} ➝ {item.to}</Text>
            <Text>Seats Available: {item.seats}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('OfferRideScreen')}
      >
        <Text style={styles.buttonText}>Offer a Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  driverName: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CarpoolScreen;
