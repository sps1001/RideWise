import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, getDocs, where, query } from 'firebase/firestore';
import { db } from '../service/firebase';

const OfferRideScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { groupId } = route.params; // Get groupId from navigation params
    const [activeUsers, setActiveUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState({}); // Store selected users

    useEffect(() => {
        const fetchActiveUsers = async () => {
            try {
                console.log("Fetching active users...");
                const usersRef = collection(db, 'users');
                const activeUsersQuery = query(usersRef, where('isActive', '==', true));
                const usersSnapshot = await getDocs(activeUsersQuery);

                if (usersSnapshot.empty) {
                    console.log("No active users found.");
                }

                const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log("Fetched users:", usersList);
                setActiveUsers(usersList);
            } catch (error) {
                console.error('Error fetching active users:', error);
            }
        };


        fetchActiveUsers();
    }, []);

    const toggleSelection = (userId) => {
        setSelectedUsers((prevSelected) => ({
            ...prevSelected,
            [userId]: !prevSelected[userId], // Toggle selection
        }));
    };

    const handleConfirm = () => {
        const selectedUserNames = activeUsers
            .filter(user => selectedUsers[user.id])
            .map(user => user.name);

        if (selectedUserNames.length === 0) {
            alert('No users selected. Please select at least one user.');
            return;
        }

        alert(`Ride offered to: ${selectedUserNames.join(', ')}`);

        // TODO: Send notifications via Firebase (implement Firestore update)
        // sendRideOfferNotification(selectedUserNames, groupId);

        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Select Users to Offer Ride</Text>

            <FlatList
                data={activeUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.userCard} onPress={() => toggleSelection(item.id)}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={selectedUsers[item.id] ? styles.selected : styles.notSelected}>
                            {selectedUsers[item.id] ? '✔ Selected' : 'Tap to Select'}
                        </Text>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Text style={styles.buttonText}>Confirm Ride Offer</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    heading: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
    userCard: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 10 },
    userName: { fontSize: 18, fontWeight: 'bold' },
    selected: { color: 'green', fontSize: 16, fontWeight: 'bold' },
    notSelected: { color: 'gray', fontSize: 16 },
    confirmButton: { backgroundColor: '#3b82f6', padding: 15, borderRadius: 8, marginTop: 20, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

export default OfferRideScreen;
