import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { db } from '../service/firebase';
import { collection, addDoc } from 'firebase/firestore';

const OfferRideScreen = () => {
  const navigation = useNavigation();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [seats, setSeats] = useState('');

  const handleOfferRide = async () => {
    if (!from || !to || !seats) return alert("Fill all fields");

    await addDoc(collection(db, "carpools"), {
      driver: "John Doe", // Replace with Auth user later
      from,
      to,
      seats: Number(seats),
    });

    alert("Ride Offered!");
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Offer a Ride</Text>
      
      <TextInput placeholder="From" style={styles.input} value={from} onChangeText={setFrom} />
      <TextInput placeholder="To" style={styles.input} value={to} onChangeText={setTo} />
      <TextInput placeholder="Seats Available" style={styles.input} keyboardType="numeric" value={seats} onChangeText={setSeats} />

      <TouchableOpacity style={styles.button} onPress={handleOfferRide}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({ /* Same styling pattern */ });

export default OfferRideScreen;
