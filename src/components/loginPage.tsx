import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, ToastAndroid, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signUp, signIn } from '../service/auth';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../service/firebase';


const Login = () => {
  const navigation = useNavigation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Notification', message);
    }
  };


  const handleAuthAction = async () => {
    if (isLogin) {
      const resp = await signIn(email, password);

      if (resp) {
        showToast('Logged in successfully!');
        const token = resp.accessToken;
        const uid = resp.uid;

        await AsyncStorage.setItem('authToken', token);

        const userDoc = await getDoc(doc(db, 'users', uid));
        if (!userDoc.exists()) {
          navigation.navigate('UsernameScreen', { uid });  // ask username only once
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Dashboard' }],
            })
          );
        }
      } else {
        showToast('Login Failed: Invalid email or password.');
      }
    } else {
      // SIGNUP
      const rep = await signUp(email, password);
      if (rep) {
        const uid = rep.uid;
        navigation.navigate('UsernameScreen', { uid });
      } else {
        showToast('Signup Failed: Something went wrong!');
      }
    }
  };


  return (
    <LinearGradient colors={['lightblue', 'aquamarine']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

        <Text style={styles.title}>RideWise</Text>
        <View style={styles.card}>
          <Text style={styles.subtitle}>{isLogin ? 'Login' : 'Sign Up'}</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#888"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {!isLogin && (
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#888"
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          )}

          <TouchableOpacity onPress={handleAuthAction} style={styles.buttonContainer}>
            <LinearGradient
              colors={['#4c669f', '#3b5998', '#192f6a']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.bottomtext}>
              {isLogin ? 'signup' : 'login'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '90%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#192f6a',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '90%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 25,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    shadowOffset: { width: 0, height: 1 },
  },
  buttonContainer: {
    width: '90%',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  switchText: {
    color: '#6200ee',
    marginTop: 10,
  },
  bottomtext: {
    color: '#6200ee',
    marginTop: 10,
    textAlign: 'center',
    cursor: 'pointer',
  }

});

export default Login;
