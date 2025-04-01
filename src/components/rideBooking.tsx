import { useState ,useEffect} from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput,Platform,PermissionsAndroid } from 'react-native';
import LocationPicker from '../service/locationPicker';
import { useNavigation ,useFocusEffect,useRoute} from '@react-navigation/native';
import { connectStorageEmulator } from 'firebase/storage';

const RideBooking = () => {
  const navigation=useNavigation();
  const route=useRoute();
  const [startLocation, setStartLocation] = useState('');
  const [lat,setLatitude]=useState(26.4755);
  const [long,setLongitude]=useState(73.1149);
  const [endLocation, setEndLocation] = useState('');
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartMapOption, setShowStartMapOption] = useState(false);
  const [showEndMapOption, setShowEndMapOption] = useState(false);
  
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

  const getStartAddress = async()=>{
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
      if(data.status=='OK'){
        console.log('Current Location:', data);
        const address = data.results[0].formatted_address;
        console.log('addr',address)
        setStartLocation(address);
        console.log(startLocation)
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  }
  const getEndAddress = async()=>{
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
      if(data.status=='OK'){
        console.log('Current Location:', data);
        const address = data.results[0].formatted_address;
        setEndLocation(address);
        console.log('addr',address)
        console.log(endLocation)
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    }
  }

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

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Book a Ride</Text>

      {/* Start Location Search */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter Start Location"
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
          onPress={() => navigation.navigate('LocationPicker',{
            latitude:lat,
            longitude:long,
            which:'start',
            onLocationSelect: (lat, long) => {
              setLatitude(lat);
              setLongitude(long);
              getStartAddress();
            },
          })}
        >
          <Text style={styles.buttonText}>📍 Mark Start Location on Map</Text>
        </TouchableOpacity>
      )}

      {/* Start Location Suggestions */}
      {startSuggestions.length > 0 && (
        <View>
          <FlatList
            data={startSuggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => {
                  setStartLocation(item.description);
                  setStartSuggestions([]);
                }}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
          />

          {/* Add this button */}
          
        </View>
      )}

      {/* End Location Search */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Enter End Location"
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
          onPress={() => navigation.navigate('LocationPicker',{
            latitude:lat,
            longitude:long,
            which:'end',
            onLocationSelect: (lat, long) => {
              setLatitude(lat);
              setLongitude(long);
              getEndAddress();
            },
          })}
        >
          <Text style={styles.buttonText}>📍 Mark End Location on Map</Text>
        </TouchableOpacity>
      )}

      {/* End Location Suggestions */}
      {endSuggestions.length > 0 && (
        <View>
        <FlatList
          data={startSuggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => {
                setStartLocation(item.description);
                setStartSuggestions([]);
              }}
            >
              <Text>{item.description}</Text>
            </TouchableOpacity>
          )}
        />

        {/* Add this button */}
        
      </View>
      )}

      {/* Book Ride Button */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => Alert.alert('Ride Booked!', `From: ${startLocation}\nTo: ${endLocation}`)}
      >
        <Text style={styles.bookButtonText}>Book Ride</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 20,
    textAlign: 'center',
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
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: 10,
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