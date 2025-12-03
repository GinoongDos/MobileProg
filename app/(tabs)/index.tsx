import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    try {
      const userData = await AsyncStorage.getItem(`user:${email}`);
      if (!userData) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const user = JSON.parse(userData);

      if (user.password !== password) {
        Alert.alert('Error', 'Incorrect password');
        return;
      }

      // Save logged-in email
      await AsyncStorage.setItem('loggedInEmail', email);

      // Navigate based on role
      if (user.role === 'Doctor') {
        router.push('/dashboard'); // Doctor dashboard
      } else {
        router.push('/patient-dashboard'); // Patient dashboard
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to login');
    }
  };

  const goToRegister = () => {
    router.push('/register'); // Navigate to register screen
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={require('@/assets/images/medical.png')} style={styles.logo} />
      </View>

      <Text style={styles.title}>Welcome to Meditech</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#ccc"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#ccc"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
        <Text style={styles.loginText}>LOGIN</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.registerLink} onPress={goToRegister}>
        <Text style={styles.registerText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D9D9D9',
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
  logoContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 150,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#000',
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  loginButton: {
    width: '100%',
    backgroundColor: '#D95A58',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerLink: {
    marginTop: 15,
  },
  registerText: {
    color: '#D95A58',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
