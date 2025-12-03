import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();

  // Common fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [role, setRole] = useState<'Doctor' | 'Patient' | ''>('');

  // Patient-specific fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [status, setStatus] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');

  // Dropdown states
  const [genderOpen, setGenderOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  const genderOptions = ['Male', 'Female'];
  const statusOptions = ['Stable', 'Critical', 'Serious', 'Improving', 'Fully Recovered'];

  const checkPasswordStrength = (pass: string) => {
    if (pass.length < 6) setPasswordStrength('Weak');
    else if (/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(pass))
      setPasswordStrength('Medium');
    else if (
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(pass)
    )
      setPasswordStrength('Strong');
    else setPasswordStrength('');
  };

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
      Alert.alert('Error', 'Please fill in all required fields and select a role.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (role === 'Patient' && (!age || !gender)) {
      Alert.alert('Error', 'Please complete Age and Gender fields.');
      return;
    }

    const userData: any = {
      firstName,
      middleName,
      lastName,
      email,
      password,
      role,
    };

    if (role === 'Patient') {
      userData.age = parseInt(age);
      userData.gender = gender;
      userData.status = status;
      userData.contact = contact;
      userData.location = location;
    }

    try {
      await AsyncStorage.setItem(`user:${email}`, JSON.stringify(userData));
      await AsyncStorage.setItem('loggedInEmail', email);

      Alert.alert('Success', 'Account created!', [
        { text: 'Continue', onPress: () => router.push('/(tabs)') },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create account.');
    }
  };

  const goToLogin = () => router.push('/(tabs)');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('@/assets/images/medical.png')} style={styles.logo} />
      </View>

      <Text style={styles.title}>CREATE ACCOUNT</Text>

      <View style={styles.inputContainer}>
        <TextInput style={styles.input} placeholder="First Name" placeholderTextColor="#ccc" value={firstName} onChangeText={setFirstName} />
        <TextInput style={styles.input} placeholder="Middle Name (Optional)" placeholderTextColor="#ccc" value={middleName} onChangeText={setMiddleName} />
        <TextInput style={styles.input} placeholder="Last Name" placeholderTextColor="#ccc" value={lastName} onChangeText={setLastName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#ccc" value={email} onChangeText={setEmail} keyboardType="email-address" />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#ccc"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            checkPasswordStrength(text);
          }}
          secureTextEntry
        />

        {password.length > 0 && (
          <Text
            style={{
              color:
                passwordStrength === 'Weak'
                  ? 'red'
                  : passwordStrength === 'Medium'
                  ? 'orange'
                  : 'green',
              marginBottom: 10,
              fontWeight: '600',
            }}
          >
            Password Strength: {passwordStrength}
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="Confirm Password *"
          placeholderTextColor="#ccc"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {/* Role Selector */}
        <Text style={styles.roleLabel}>Select Role:</Text>
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleButton, role === 'Doctor' && styles.roleSelected]}
            onPress={() => setRole('Doctor')}
          >
            <Text style={[styles.roleText, role === 'Doctor' && styles.roleTextSelected]}>
              Doctor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleButton, role === 'Patient' && styles.roleSelected]}
            onPress={() => setRole('Patient')}
          >
            <Text style={[styles.roleText, role === 'Patient' && styles.roleTextSelected]}>
              Patient
            </Text>
          </TouchableOpacity>
        </View>

        {/* PATIENT FIELDS */}
        {role === 'Patient' && (
          <>
            <TextInput style={styles.input} placeholder="Age" placeholderTextColor="#ccc" value={age} onChangeText={setAge} keyboardType="numeric" />

            {/* GENDER DROPDOWN */}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setGenderOpen(!genderOpen)}
            >
              <Text style={styles.dropdownText}>
                {gender ? gender : 'Select Gender'}
              </Text>
            </TouchableOpacity>

            {genderOpen && (
              <View style={styles.dropdownList}>
                {genderOptions.map((g, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setGender(g);
                      setGenderOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* STATUS DROPDOWN */}
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setStatusOpen(!statusOpen)}
            >
              <Text style={styles.dropdownText}>
                {status ? status : 'Select Status (Optional)'}
              </Text>
            </TouchableOpacity>

            {statusOpen && (
              <View style={styles.dropdownList}>
                {statusOptions.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setStatus(s);
                      setStatusOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TextInput style={styles.input} placeholder="Contact (Optional)" placeholderTextColor="#ccc" value={contact} onChangeText={setContact} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Location (Optional)" placeholderTextColor="#ccc" value={location} onChangeText={setLocation} />
          </>
        )}
      </View>

      {/* REGISTER BUTTON */}
      <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
        <Text style={styles.registerTextButton}>REGISTER</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginLink} onPress={goToLogin}>
        <Text style={styles.loginLinkText}>Already have an account? Login</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>© 2025 Medical App</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#D9D9D9',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: { marginBottom: 40 },
  logo: { width: 180, height: 150, resizeMode: 'contain' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 30,
  },
  inputContainer: { width: '100%' },
  input: {
    backgroundColor: '#fff',
    color: '#000',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
    fontSize: 16,
    elevation: 5,
  },

  /* DROPDOWN */
  dropdown: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 5,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 5,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000',
  },

  /* ROLE BUTTON */
  roleLabel: {
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#000',
  },
  roleRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  roleSelected: { backgroundColor: '#D95A58' },
  roleText: { fontWeight: 'bold', color: '#000' },
  roleTextSelected: { color: '#fff' },

  registerButton: {
    width: '100%',
    backgroundColor: '#D95A58',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 8,
  },
  registerTextButton: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loginLink: { marginTop: 15 },
  loginLinkText: {
    color: '#D95A58',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  footerText: { marginTop: 40, color: '#555', fontSize: 14 },
});
