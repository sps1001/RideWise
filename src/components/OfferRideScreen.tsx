import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../service/firebase';

const OfferRideScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { groupId } = route.params || {}; // optional if groupId isn't used yet

    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState({});

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersRef = collection(db, 'users');
                const snapshot = await getDocs(usersRef);

                const usersList = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                console.log('Fetched users:', usersList);
                setUsers(usersList);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const toggleSelection = (userId) => {
        setSelectedUsers((prevSelected) => ({
            ...prevSelected,
            [userId]: !prevSelected[userId],
        }));
    };

    const handleConfirm = () => {
        const selectedUsernames = users
            .filter(user => selectedUsers[user.id])
            .map(user => user.username);

        if (selectedUsernames.length === 0) {
            Alert.alert('No Selection', 'Please select at least one user.');
            return;
        }

        Alert.alert('Ride Offered', `Ride offered to: ${selectedUsernames.join(', ')}`);

        // Optional: you can store this ride offer in Firestore if needed

        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Select Users to Offer Ride</Text>

            <FlatList
                data={users}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={styles.userCard}
                        onPress={() => toggleSelection(item.id)}
                    >
                        <Text style={styles.userName}>{item.username}</Text>
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
