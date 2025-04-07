import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../service/firebase';
import { useTheme } from '../service/themeContext';

const userGroups = [
  { id: '1', groupName: 'IITJ to Paota', route: 'IITJ ➝ Paota', members: ['Harsh', 'Sahil'] },
  { id: '2', groupName: 'Station to IITJ', route: 'Station ➝ IITJ', members: ['Rishi', 'Parth'] },
];

const CarpoolScreen = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [groups, setGroups] = useState(userGroups);
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const groupsRef = collection(db, 'carpoolGroups');
        const groupsSnapshot = await getDocs(groupsRef);
        const firebaseGroups = groupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setGroups([...userGroups, ...firebaseGroups]);

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
      navigation.navigate('GroupDetails', {
        groupId: group.id,
        groupName: group.groupName,
        members: group.members,
      });
    }
  };

  const handleOfferRide = (groupId: string) => {
    navigation.navigate('OfferRide', { groupId });
  };

  const handleInboxClick = () => {
    navigation.navigate('Inbox');
  };

  const themeStyles = getStyles(isDarkMode);

  return (
    <View style={themeStyles.container}>
      <Text style={themeStyles.heading}>Your Carpool Groups</Text>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={themeStyles.card}>
            <Text style={themeStyles.driverName}>{item.groupName}</Text>
            <Text style={themeStyles.text}>Route: {item.route}</Text>
            <TouchableOpacity style={themeStyles.button} onPress={() => handleGroupClick(item.id)}>
              <Text style={themeStyles.buttonText}>View Members</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[themeStyles.button, themeStyles.offerButton]}
              onPress={() => handleOfferRide(item.id)}
            >
              <Text style={themeStyles.buttonText}>Offer a Ride</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={[themeStyles.button, themeStyles.inboxButton]} onPress={handleInboxClick}>
        <Text style={themeStyles.buttonText}>Go to Inbox</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? '#121212' : '#f9f9f9',
    },
    heading: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    text: {
      color: isDarkMode ? '#cccccc' : '#333333',
    },
    card: {
      backgroundColor: isDarkMode ? '#1f1f1f' : '#f8f9fa',
      padding: 15,
      borderRadius: 8,
      marginBottom: 10,
    },
    driverName: {
      fontWeight: 'bold',
      fontSize: 18,
      color: isDarkMode ? '#ffffff' : '#000000',
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
