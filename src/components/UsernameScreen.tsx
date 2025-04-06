import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../service/firebase';
import { useNavigation, useRoute } from '@react-navigation/native';

const UsernameScreen = () => {
    const [username, setUsername] = useState('');
    const navigation = useNavigation();
    const route = useRoute();
    const {uid} = route.params;

    const handleSaveUsername = async () => {
        console.log('Uid', uid);
        if (!username.trim()) {
            Alert.alert('Validation', 'Please enter a username.');
            return;
        }

        try {
            await setDoc(doc(db, 'users', uid), {
                username: username.trim(),
                createdAt: new Date(),
            });

            Alert.alert('Success', 'Username saved!');
            navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Dashboard' }],
                })
              );
        } catch (error) {
            console.error('Error saving username:', error);
            Alert.alert('Error', 'Failed to save username.');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Choose a Username</Text>
            <TextInput
                placeholder="Enter username"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
            />
            <TouchableOpacity onPress={handleSaveUsername} style={styles.button}>
                <Text style={styles.buttonText}>Save Username</Text>
            </TouchableOpacity>
        </View>
    );
};




const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#1e3c72', // rich gradient bg
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#fff',
        textAlign: 'center',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 2 },
        textShadowRadius: 4,
    },
    input: {
        borderWidth: 1,
        padding: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginBottom: 20,
        fontSize: 16,
        color: '#333',
    },
    button: {
        backgroundColor: '#ff6a00',
        padding: 15,
        borderRadius: 12,
        elevation: 6,
        shadowColor: '#000',
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 18,
    },
});



export default UsernameScreen;
