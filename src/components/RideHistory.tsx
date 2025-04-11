import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTheme } from '../service/themeContext';
import { db, auth } from '../service/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const RideHistory = () => {
  const { isDarkMode } = useTheme();
  const [rideData, setRideData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRideHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No user is currently logged in.');
        setLoading(false);
        return;
      }

      const q = query(collection(db, 'history'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const rides = [];
      querySnapshot.forEach((doc) => {
        rides.push({ id: doc.id, ...doc.data() });
      });
      console.log('Fetched rides:', rides);

      rides.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
      setRideData(rides);
    } catch (error) {
      console.error('Error fetching ride history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRideHistory();
  }, []);

  const formatDateTime = (dateStr, timeStr) => {
    try {
      const dt = new Date(`${dateStr} ${timeStr}`);
      return new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(dt);
    } catch {
      return `${dateStr} at ${timeStr}`;
    }
  };

  const getStatusStyle = (status) => ({
    ...styles.statusBadge,
    backgroundColor: status === 'Completed' ? '#10b98133' : '#ef444433',
    color: status === 'Completed' ? '#10b981' : '#ef4444',
  });

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6' }]}>
      <Text style={[styles.header, { color: isDarkMode ? '#93c5fd' : '#3b82f6' }]}>Your Ride History</Text>

      {loading ? (
        <ActivityIndicator size="large" color={isDarkMode ? '#60a5fa' : '#2563eb'} />
      ) : rideData.length === 0 ? (
        <Text style={[styles.emptyText, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>
          No completed or cancelled rides found.
        </Text>
      ) : (
        <FlatList
          data={rideData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.rideCard,
                { backgroundColor: isDarkMode ? '#374151' : '#ffffff' },
              ]}
            >
              <View style={styles.rideInfo}>
                <Text style={[styles.dateText, { color: isDarkMode ? '#f3f4f6' : '#111827' }]}>
                  {formatDateTime(item.date, item.time)}
                </Text>

                <Text style={[styles.routeText, { color: isDarkMode ? '#f9fafb' : '#1f2937' }]}>
                  {item.from} → {item.to}
                </Text>

                {item.driverName && (
                  <Text style={[styles.subText, { color: isDarkMode ? '#d1d5db' : '#4b5563' }]}>
                    Driver: {item.driverName}
                  </Text>
                )}

                {item.amount && (
                  <Text style={[styles.subText, { color: isDarkMode ? '#d1d5db' : '#4b5563' }]}>
                    Cost: ₹{item.amount}
                  </Text>
                )}
              </View>
            </View>
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
    fontWeight: '700',
    marginBottom: 20,
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  rideInfo: {
    flexDirection: 'column',
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeText: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 4,
  },
  subText: {
    fontSize: 14,
    marginTop: 2,
  },
  statusBadge: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    fontWeight: 'bold',
    overflow: 'hidden',
    fontSize: 13,
  },
});

export default RideHistory;
