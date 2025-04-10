import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput, Platform, PermissionsAndroid } from 'react-native';
import LocationPicker from '../service/locationPicker';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { connectStorageEmulator } from 'firebase/storage';
import { useTheme } from '../service/themeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../service/firebase'; // adjust path as needed

// const [date, setDate] = useState(new Date());
// const [showDatePicker, setShowDatePicker] = useState(false);
// const [showTimePicker, setShowTimePicker] = useState(false);

const RideBooking = () => {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [startLocation, setStartLocation] = useState('');
  const [lat, setLatitude] = useState(26.4755);
  const [long, setLongitude] = useState(73.1149);
  const [endLocation, setEndLocation] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartMapOption, setShowStartMapOption] = useState(false);
  const [showEndMapOption, setShowEndMapOption] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);


  const GOOGLE_MAPS_API_KEY = 'AIzaSyBGdExMD_KJEa-QVVZGM4bsLbVLfxFMGLA'; // Replace with your actual API key


  const getCurrentLocation = async () => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );
      const data = await response.json();
      console.log('Current Location:', data);
      setLatitude(data.location.lat);
      setLongitude(data.location.lng);
      getStartAddress();
      // Example:
      // data.location.lat, data.location.lng
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  };

  const getStartAddress = async () => {
    try {
      console.log('hello')
      console.log(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_MAPS_API_KEY}`)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: 'GET',
        }
      );
      const data = await response.json();
      console.log(data)
      if (data.status == 'OK') {
        console.log('Current Location:', data);
        const address = data.results[0].formatted_address;
        console.log('addr', address)
        setStartLocation(address);
        console.log(startLocation)
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  }
  const getEndAddress = async () => {
    try {
      console.log(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_MAPS_API_KEY}`)
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${long}&key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: 'GET',
        }
      );
      const data = await response.json();
      console.log(data)
      if (data.status == 'OK') {
        console.log('Current Location:', data);
        const address = data.results[0].formatted_address;
        setEndLocation(address);
        console.log('addr', address)
        console.log(endLocation)
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  }
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
  };

  const onTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || date;
    setShowTimePicker(false);
    setDate(currentTime); // Same state holds both date and time
  };


  // Function to fetch location suggestions from API
  const fetchLocationSuggestions = async (query, setSuggestions) => {
    if (!query) return setSuggestions([]);

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${query}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK') {
        const predictions = data.predictions.map((item) => ({
          place_id: item.place_id,
          description: item.description,
        }));

        setSuggestions(predictions);
        console.log('Location suggestions:', predictions); // Prints predictions in console
      } else {
        console.error('Error fetching location suggestions:', data.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
    }
  };


  const addBookingtohistory = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'history'), {
      userId: user.uid,
      date: date.toDateString(),
      time: date.toLocaleTimeString(),
      from: startLocation,
      to: endLocation,
      status: 'Upcoming',
    });

    console.log("Booking added to Firestore"); // Add this
  };

  const addBookingtocarpool = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await addDoc(collection(db, 'carpool'), {
      userId: user.uid,
      userName: user.displayName || 'Anonymous User', // Add user name for drivers to see
      date: date.toDateString(),
      time: date.toLocaleTimeString(),
      from: startLocation,
      to: endLocation,
      status: 'requested', // CRITICAL: This status is what drivers look for
      requestedAt: new Date()
    });

    console.log("Booking added to Firestore");
  };

  return (
    <View style={[styles.container, isDarkMode && styles.darkBackground]}>
      <Text style={[styles.header, isDarkMode && styles.darkText]}>Book a Ride</Text>

      <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
        <TextInput
          style={[styles.textInput, isDarkMode && styles.darkTextInput]}
          placeholder="Enter Start Location"
          placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
          value={startLocation}
          onChangeText={(text) => {
            setStartLocation(text);
            fetchLocationSuggestions(text, setStartSuggestions);
          }}
          onFocus={() => setShowStartMapOption(true)}
          onBlur={() => setShowStartMapOption(false)}
        />
        <TouchableOpacity onPress={getCurrentLocation} style={styles.locationButton}>
          {loadingLocation ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.buttonText}>🎯</Text>
          )}
        </TouchableOpacity>
      </View>



      {showStartMapOption && (
        <TouchableOpacity
          style={styles.pickLocationButton}
          onPress={() =>
            navigation.navigate('LocationPicker', {
              latitude: lat,
              longitude: long,
              which: 'start',
              onLocationSelect: async (lat, long) => {
                setLatitude(lat);
                setLongitude(long);
                await getStartAddress();
              },
            })
          }
        >
          <Text style={styles.buttonText}>📍 Mark Start Location on Map</Text>
        </TouchableOpacity>
      )}

      {startSuggestions.length > 0 && (
        <FlatList
          data={startSuggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.suggestionItem, isDarkMode && styles.darkSuggestionItem]}
              onPress={() => {
                setStartLocation(item.description);
                setStartSuggestions([]);
              }}
            >
              <Text style={isDarkMode && styles.darkText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={[styles.inputContainer, isDarkMode && styles.darkInputContainer]}>
        <TextInput
          style={[styles.textInput, isDarkMode && styles.darkTextInput]}
          placeholder="Enter End Location"
          placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
          value={endLocation}
          onChangeText={(text) => {
            setEndLocation(text);
            fetchLocationSuggestions(text, setEndSuggestions);
          }}
          onFocus={() => setShowEndMapOption(true)}
          onBlur={() => setShowEndMapOption(false)}
        />
      </View>

      {showEndMapOption && (
        <TouchableOpacity
          style={styles.pickLocationButton}
          onPress={() =>
            navigation.navigate('LocationPicker', {
              latitude: lat,
              longitude: long,
              which: 'end',
              onLocationSelect: async (lat, long) => {
                setLatitude(lat);
                setLongitude(long);
                await getEndAddress();
              },
            })
          }
        >
          <Text style={styles.buttonText}>📍 Mark End Location on Map</Text>
        </TouchableOpacity>
      )}



      {endSuggestions.length > 0 && (
        <FlatList
          data={endSuggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.suggestionItem, isDarkMode && styles.darkSuggestionItem]}
              onPress={() => {
                setEndLocation(item.description);
                setEndSuggestions([]);
              }}
            >
              <Text style={isDarkMode && styles.darkText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <View style={{ marginTop: 10 }}>
        <Text style={[{ fontSize: 16, marginBottom: 5 }, isDarkMode && styles.darkText]}>
          Selected Date: {date.toDateString()}
        </Text>
        <TouchableOpacity
          style={styles.pickLocationButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.buttonText}>📅 Pick Date</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <Text style={[{ fontSize: 16, marginVertical: 5 }, isDarkMode && styles.darkText]}>
          Selected Time: {date.toLocaleTimeString()}
        </Text>
        <TouchableOpacity
          style={styles.pickLocationButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.buttonText}>⏰ Pick Time</Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={async () => {
          try {
            await addBookingtohistory();
            await addBookingtocarpool();
            Alert.alert(
              'Ride Booked!',
              `From: ${startLocation}\nTo: ${endLocation}\nDate: ${date.toDateString()}\nTime: ${date.toLocaleTimeString()}`
            );
          } catch (error) {
            console.error('Error booking ride:', error);
            Alert.alert('Error', 'Failed to book ride. Please try again.');
          }
        }}
      >
        <Text style={styles.bookButtonText}>Book Ride</Text>
      </TouchableOpacity>

    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  darkBackground: {
    backgroundColor: '#000',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 20,
    textAlign: 'center',
  },
  darkText: {
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 3,
    paddingHorizontal: 10,
  },
  darkInputContainer: {
    backgroundColor: '#1e1e1e',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    color: '#000',
  },
  darkTextInput: {
    color: '#fff',
  },
  locationButton: {
    backgroundColor: '#3b82f6',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  pickLocationButton: {
    backgroundColor: '#4285F4',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  suggestionItem: {
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    zIndex: 1,
    elevation: 2,
  },
  darkSuggestionItem: {
    backgroundColor: '#1e1e1e',
  },
  bookButton: {
    backgroundColor: '#3b82f6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  bookButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});


export default RideBooking;
