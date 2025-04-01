import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from "../src/components/loginPage"
import Dashboard from './components/dashboard';
import RideBooking from './components/rideBooking';
import LocationPicker from './service/locationPicker';
import CarpoolScreen from './components/CarpoolScreen';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  RideBooking: undefined;
  LocationPicker: {
    latitude: number;
    longitude: number;
    which:string;
    onLocationSelect: (lat: number, long: number) => void;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const isTokenValid = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const expiry = await AsyncStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) 
      return false; 
    
    const currentTime = Math.floor(Date.now() / 1000); 
    return parseInt(expiry, 10) > currentTime; 
  } catch (error) {
    console.error('Error checking token:', error);
    return false;
  }
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const valid = await isTokenValid();
      setIsAuthenticated(valid);
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    ); 
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? 'Dashboard' : 'Login'}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: true }} />
        <Stack.Screen name="RideBooking" component={RideBooking} options={{ headerShown: true }} />
        <Stack.Screen name="LocationPicker" component={LocationPicker} options={{ headerShown: true }} />
        <Stack.Screen name="CarpoolScreen" component={CarpoolScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;