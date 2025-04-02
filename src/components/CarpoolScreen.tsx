import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Mock Data (replace with Firebase data later)
const userGroups = [
  { id: '1', groupName: 'IITJ to Paota', route: 'IITJ ➝ Paota', members: ['Harsh', 'Sahil'] },
  { id: '2', groupName: 'Station to IITJ', route: 'Station ➝ IITJ', members: ['Rishi', 'Parth'] },
];

const CarpoolScreen = () => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState(userGroups); // User's carpool groups

  const handleGroupClick = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      navigation.navigate('GroupDetails', { groupId: group.id, groupName: group.groupName, members: group.members });
    }
  };

  const handleOfferRide = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      console.log(`Notifying members of ${group.groupName} about the ride offer.`);
      // Firebase logic to send notification to all members
      // sendRideOfferNotification(group.members);
    }
  };

  const handleInboxClick = () => {
    navigation.navigate('Inbox'); // Navigate to the Inbox Screen
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Carpool Groups</Text>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.driverName}>{item.groupName}</Text>
            <Text>Route: {item.route}</Text>
            <TouchableOpacity style={styles.button} onPress={() => handleGroupClick(item.id)}>
              <Text style={styles.buttonText}>View Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.offerButton]}
              onPress={() => handleOfferRide(item.id)}  // On press, offer ride for that specific group
            >
              <Text style={styles.buttonText}>Offer a Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Inbox Section */}
      <TouchableOpacity style={[styles.button, styles.inboxButton]} onPress={handleInboxClick}>
        <Text style={styles.buttonText}>Go to Inbox</Text>
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
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  offerButton: {
    backgroundColor: '#34d399',
  },
  inboxButton: {
    backgroundColor: '#f59e0b',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CarpoolScreen;
