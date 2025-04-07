import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTheme } from '../service/themeContext';

const RideHistory = () => {
  const { isDarkMode } = useTheme();
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
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}>
      <Text style={[styles.header, { color: isDarkMode ? '#93c5fd' : '#3b82f6' }]}>Ride History</Text>

      {rideData.length === 0 ? (
        <Text style={[styles.emptyText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
          No rides found.
        </Text>
      ) : (
        <FlatList
          data={rideData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                // You can add navigation logic here later
              }}
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
                <Text
                  style={[
                    styles.rideStatus,
                    item.status === 'Completed' ? styles.completed : styles.upcoming,
                  ]}
                >
                  {item.status}
                </Text>
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
  upcoming: {
    color: 'orange',
  },
});

export default RideHistory;