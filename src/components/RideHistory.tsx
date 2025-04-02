import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';

const RideHistory = () => {
  const navigation = useNavigation();
  const [rideData, setRideData] = useState([
    {
      id: '1',
      date: 'April 1, 2025',
      time: '9:00 AM',
      from: 'karwar',
      to: 'jodhpur Railway Station',
      status: 'Completed',
    },
    {
      id: '2',
      date: 'April 3, 2025',
      time: '4:30 PM',
      from: 'paota',
      to: 'ghantaghar, jodhpur',
      status: 'Upcoming',
    },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ride History</Text>
      <FlatList
        data={rideData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rideCard}>
            <View style={styles.rideInfo}>
              <Text style={styles.rideText}>{item.date} at {item.time}</Text>
              <Text style={styles.rideText}>From: {item.from}</Text>
              <Text style={styles.rideText}>To: {item.to}</Text>
              <Text style={[styles.rideStatus, item.status === 'Completed' ? styles.completed : styles.upcoming]}>
                {item.status}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}
  

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
    color: '#3b82f6',
  },
  rideCard: {
    backgroundColor: 'white',
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
    color: '#374151',
  },
  rideStatus: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  completed: {
    color: 'green',
  },
  upcoming: {
    color: 'orange',
  },
});
export default RideHistory;