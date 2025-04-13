import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../service/firebase';
import { useTheme } from '../service/themeContext';

const Profile = () => {
  const { isDarkMode } = useTheme();
  const currentUser = auth.currentUser;

  const [userData, setUserData] = useState({
    username: 'User',
    email: currentUser?.email || 'Not provided',
    vehicle: {
      color: '',
      licensePlate: '',
      make: '',
      model: '',
      year: '',
    },
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = currentUser?.uid;
        if (!uid) return;

        const userType = await AsyncStorage.getItem('userType');

        let username = 'User';
        let email = currentUser?.email || 'Not provided';
        let vehicle = {
          color: '',
          licensePlate: '',
          make: '',
          model: '',
          year: '',
        };

        if (userType === 'driver') {
          const driverRef = doc(db, 'drivers', uid);
          const driverSnap = await getDoc(driverRef);

          if (driverSnap.exists()) {
            const data = driverSnap.data();
            username = data.username || username;
            email = data.email || email;

            if (data.vehicleInfo) {
              vehicle = {
                color: data.vehicleInfo.color || '',
                licensePlate: data.vehicleInfo.licensePlate || '',
                make: data.vehicleInfo.make || '',
                model: data.vehicleInfo.model || '',
                year: data.vehicleInfo.year || '',
              };
            }
          }
        } else {
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            username = data.username || username;
            email = data.email || email;
          }
        }

        setUserData({ username, email, vehicle });
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/user_icon.png')}
        style={styles.profileImage}
      />
      <Text style={styles.label}>Name:</Text>
      <Text style={styles.value}>{userData.username}</Text>
      <Text style={styles.label}>Email:</Text>
      <Text style={styles.value}>{userData.email}</Text>

      {/* Show vehicle info only if filled */}
      {userData.vehicle.make ? (
        <>
          <Text style={styles.label}>Vehicle Details:</Text>
          <Text style={styles.value}>Color: {userData.vehicle.color}</Text>
          <Text style={styles.value}>License Plate: {userData.vehicle.licensePlate}</Text>
          <Text style={styles.value}>Make: {userData.vehicle.make}</Text>
          <Text style={styles.value}>Model: {userData.vehicle.model}</Text>
          <Text style={styles.value}>Year: {userData.vehicle.year}</Text>          
        </>
      ) : null}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      paddingTop: 40,
      backgroundColor: isDarkMode ? '#121212' : '#fff',
      flex: 1,
    },
    profileImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 20,
    },
    label: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#f3f4f6' : '#111827',
      marginTop: 10,
    },
    value: {
      fontSize: 16,
      color: isDarkMode ? '#d1d5db' : '#374151',
    },
  });

export default Profile;
