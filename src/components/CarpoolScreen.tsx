import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../service/firebase'; // Ensure correct path to firebase.ts

// Hardcoded user groups
const userGroups = [
  { id: '1', groupName: 'IITJ to Paota', route: 'IITJ ➝ Paota', members: ['Harsh', 'Sahil'] },
  { id: '2', groupName: 'Station to IITJ', route: 'Station ➝ IITJ', members: ['Rishi', 'Parth'] },
];

const CarpoolScreen = () => {
  const navigation = useNavigation();
  const [groups, setGroups] = useState(userGroups); // Merge Firebase data later
  const [activeUsers, setActiveUsers] = useState([]); // Store active users

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch carpool groups from Firestore
        const groupsRef = collection(db, 'carpoolGroups');
        const groupsSnapshot = await getDocs(groupsRef);
        const firebaseGroups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Merge Firebase groups with hardcoded groups
        setGroups([...userGroups, ...firebaseGroups]);

        // Fetch active users from Firestore
        const usersRef = collection(db, 'users');
        const activeUsersQuery = query(usersRef, where('isActive', '==', true));
        const usersSnapshot = await getDocs(activeUsersQuery);
        const activeUsersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setActiveUsers(activeUsersList);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleGroupClick = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      navigation.navigate('GroupDetails', { groupId: group.id, groupName: group.groupName, members: group.members });
    }
  };

  // const handleOfferRide = (groupId: string) => {
  //   const group = groups.find(g => g.id === groupId);
  //   if (group) {
  //     console.log(`Notifying members of ${group.groupName} about the ride offer.`);

  //     // List active users
  //     const activeUserNames = activeUsers.map(user => user.name).join(', ') || 'No active users';
  //     alert(`Offering ride to active users: ${activeUserNames}`);
  //   }
  // };

  const handleOfferRide = (groupId: string) => {
    navigation.navigate('OfferRide', { groupId });
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
