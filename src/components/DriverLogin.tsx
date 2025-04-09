import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signUp, signIn } from '../service/auth';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendEmailVerification } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../service/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { RootStackParamList } from '../App';
import { useTheme } from '../service/themeContext';

const DriverLogin = () => {
  const { isDarkMode } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(20);
  const [signedUpEmail, setSignedUpEmail] = useState('');

  type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (modalVisible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [modalVisible, countdown]);

  const showAlert = (message: string) => {
    Alert.alert('Notification', message);
  };

  const userVerification = async (rep) => {
    await sendEmailVerification(rep);
    Alert.alert('Verification Sent', 'Verification email sent! Please check your inbox.');

    setSignedUpEmail(email);
    setModalVisible(true);

    // ⏳ Wait for verification
    let verified = false;
    let tries = 0;

    while (!verified && tries < 40) {
      tries++;
      await rep.reload();
      verified = rep.emailVerified;

      if (verified) {
        setModalVisible(false);
        Alert.alert('Success', 'Email verified successfully!');
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'DriverDashboard' }],
          })
        );
        return;
      }

      await new Promise((res) => setTimeout(res, 3000));
    }

    if (!verified) {
      showAlert("Still not verified after 2 minutes.");
    }
  }

  const handleAuthAction = async () => {
    if (isLogin) {
      const resp = await signIn(email, password);

      if (resp) {
        console.log("Authenticated Driver:", resp);
        const user = auth.currentUser;
        
        if (!user.emailVerified) {
          console.log("Driver not verified:", user);
          showAlert('Please verify your email first before logging in.');
          return;
        }

        // Check if the user is registered as a driver
        const userDoc = await getDoc(doc(db, 'drivers', user.uid));
        
        if (!userDoc.exists()) {
          showAlert('This account is not registered as a driver.');
          return;
        }

        const token = resp.accessToken;
        const uid = resp.uid;
        const { exp } = JSON.parse(atob(token.split('.')[1]));
        
        await AsyncStorage.setItem('authToken', token);
        await AsyncStorage.setItem('tokenExpiry', exp.toString());
        await AsyncStorage.setItem('uid', uid);
        await AsyncStorage.setItem('userType', 'driver');

        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'DriverDashboard' }],
          })
        );
      } else {
        showAlert('Login Failed: Invalid email or password.');
      }
    } else {
      if (password !== confirmPassword) {
        showAlert('Passwords do not match.');
        return;
      }
      
      const rep = await signUp(email, password);

      if (rep) {
        console.log("New Driver Created:", rep);
        showAlert('Account created successfully!');
        
        // Create a driver document
        await setDoc(doc(db, 'drivers', rep.uid), {
          email: email,
          createdAt: new Date(),
          isVerified: false,
          status: 'pending',
        });
        
        userVerification(rep);
      } else {
        showAlert('Signup Failed: Something went wrong!');
      }
    }
  };

  const styles = createStyles(isDarkMode);

  return (
    <LinearGradient colors={['#4c669f', '#3b5998']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>RideWise Driver</Text>
        <View style={styles.card}>
          <Text style={styles.subtitle}>{isLogin ? 'Driver Login' : 'Driver Sign Up'}</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#888"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
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
              colors={['#FF8008', '#FFA72F']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.switchText}>
            {isLogin ? "Don't have a driver account?" : 'Already have a driver account?'}
          </Text>
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.bottomtext}>
              {isLogin ? 'Sign Up' : 'Login'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        
        <EmailVerificationModal
          visible={modalVisible}
          email={signedUpEmail}
          countdown={countdown}
          setCountdown={setCountdown}
          onClose={() => setModalVisible(false)}
          onResend={async () => {
            const user = auth.currentUser;
            if (user && !user.emailVerified) {
              setCountdown(120);
              userVerification(user);
            }
          }}
          isDarkMode={isDarkMode}
        />
      </ScrollView>
    </LinearGradient>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
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
    backgroundColor: isDark ? '#1e1e1e' : '#fff',
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: isDark ? '#fff' : '#333',
  },
  input: {
    width: '90%',
    padding: 12,
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
    color: isDark ? '#fff' : '#000',
  },
  buttonContainer: {
    width: '90%',
    borderRadius: 8,
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
    color: isDark ? '#90cdf4' : '#3b82f6',
    marginTop: 10,
  },
  bottomtext: {
    color: isDark ? '#90cdf4' : '#3b82f6',
    marginTop: 10,
    fontWeight: 'bold',
  },
  backText: {
    color: '#888',
    marginTop: 20,
  }
});

const EmailVerificationModal = ({
  visible,
  email,
  countdown,
  setCountdown,
  onClose,
  onResend,
  isDarkMode
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)'
      }}>
        <View style={{
          width: '85%',
          backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
          borderRadius: 15,
          padding: 20,
          alignItems: 'center'
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 10, 
            color: isDarkMode ? '#fff' : '#000'
          }}>
            Verify your email
          </Text>
          <Text style={{ 
            textAlign: 'center', 
            marginBottom: 20,
            color: isDarkMode ? '#ccc' : '#333'
          }}>
            A verification email has been sent to{"\n"}
            <Text style={{ fontWeight: 'bold' }}>{email}</Text>
          </Text>
          <Text style={{ 
            fontSize: 16, 
            color: isDarkMode ? '#aaa' : '#555' 
          }}>
            Verify your email to proceed further ({formatTime(countdown)})
          </Text>
          {countdown === 0 && (
            <>
              <Text style={{ color: 'red', marginTop: 10 }}>Still not verified?</Text>
              <TouchableOpacity onPress={onResend}>
                <Text style={{ color: '#1e90ff', marginTop: 5 }}>Resend Email</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <Text style={{ color: '#888', marginTop: 10 }}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default DriverLogin;