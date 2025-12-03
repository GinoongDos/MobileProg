import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Default clinics
const defaultClinics = [
  { id: '1', name: 'Carmen Clinic', doctorEmail: 'doctor1@clinic.com', phone: '09171234567', latitude: 8.4542, longitude: 124.6319 },
  { id: '2', name: 'Tablon Clinic', doctorEmail: 'doctor2@clinic.com', phone: '09179876543', latitude: 8.4822, longitude: 124.6455 },
];

type User = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
  age?: number;
  gender?: string;
  condition?: string;
  profilePicture?: string;
};

type FallEvent = {
  timestamp: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
};

export default function PatientDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [clinics, setClinics] = useState(defaultClinics);
  const [fallLogs, setFallLogs] = useState<FallEvent[]>([]);
  const [emergencyVisible, setEmergencyVisible] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const email = await AsyncStorage.getItem('loggedInEmail');
      if (email) {
        const data = await AsyncStorage.getItem(`user:${email}`);
        if (data) {
          setUser(JSON.parse(data));
          loadFallLogs(email);
        }
      }
    };
    fetchUser();
  }, []);

  // Logout function
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem('loggedInEmail');
          router.push('/(tabs)');
        },
      },
    ]);
  };

  // Get current location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      return null;
    }
    const location = await Location.getCurrentPositionAsync({});
    return { latitude: location.coords.latitude, longitude: location.coords.longitude };
  };

  // Calculate distance between two points
  const distance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Emergency SOS automatically calls nearest clinic
  const handleEmergency = async () => {
    if (!user) return;

    const coords = await getCurrentLocation();
    if (!coords) return;

    // Find nearest clinic
    let nearestClinic = clinics[0];
    let minDist = distance(coords.latitude, coords.longitude, nearestClinic.latitude, nearestClinic.longitude);

    for (const clinic of clinics) {
      const dist = distance(coords.latitude, coords.longitude, clinic.latitude, clinic.longitude);
      if (dist < minDist) {
        nearestClinic = clinic;
        minDist = dist;
      }
    }

    const sosData = {
      patientEmail: user.email,
      patientName: `${user.firstName} ${user.lastName}`.trim(),
      age: user.age ?? 0,
      gender: user.gender ?? 'Unknown',
      condition: user.condition ?? 'Critical',
      clinic: nearestClinic.name,
      timestamp: new Date().toISOString(),
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
    await AsyncStorage.setItem(`sos:${user.email}`, JSON.stringify(sosData));

    setEmergencyVisible(true);

    setTimeout(() => {
      Alert.alert(
        "🚨 Emergency SOS Activated",
        `Calling ${nearestClinic.name} now...`,
        [
          { text: "Cancel", style: "cancel", onPress: () => setEmergencyVisible(false) },
          {
            text: "Call Clinic",
            onPress: () => Linking.openURL(`tel:${nearestClinic.phone}`)
          }
        ]
      );
    }, 1500);
  };

  // Handle fall detection
  const handleFallDetected = async () => {
    if (!user) return;

    const coords = await getCurrentLocation();
    if (!coords) return;

    const newFall: FallEvent = {
      timestamp: new Date().toISOString(),
      latitude: coords.latitude,
      longitude: coords.longitude,
    };

    const logsData = await AsyncStorage.getItem(`fallLogs:${user.email}`);
    const logs: FallEvent[] = logsData ? JSON.parse(logsData) : [];
    logs.unshift(newFall);
    await AsyncStorage.setItem(`fallLogs:${user.email}`, JSON.stringify(logs));
    setFallLogs(logs);

    Alert.alert('Fall Detected', 'Emergency alert sent and recorded!');
  };

  const loadFallLogs = async (email: string) => {
    const logsData = await AsyncStorage.getItem(`fallLogs:${email}`);
    const logs: FallEvent[] = logsData ? JSON.parse(logsData) : [];
    setFallLogs(logs);
  };

  return (
    <>
      {/* 🔴 FULLSCREEN SOS */}
      <Modal visible={emergencyVisible} transparent={true} animationType="fade">
        <View style={styles.emergencyOverlay}>
          <Text style={styles.emergencyText}>SOS ACTIVATED</Text>
          <Text style={styles.emergencySub}>Calling nearest clinic...</Text>

          <TouchableOpacity
            style={styles.cancelEmergencyButton}
            onPress={() => setEmergencyVisible(false)}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {user && (
          <Text style={styles.kikayWelcome}>Welcome, {user.firstName}! Stay safe!</Text>
        )}

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image
              source={user?.profilePicture ? { uri: user.profilePicture } : require('@/assets/images/avatar.jpg')}
              style={styles.profileImage}
            />

            <TouchableOpacity
              style={styles.viewProfileButton}
              onPress={() => router.push('/PatientProfile')}
            >
              <Text style={styles.viewProfileText}>i</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.profileName}>
            {user ? `${user.firstName} ${user.middleName ?? ''} ${user.lastName}`.trim() : 'Patient'}
          </Text>
          <Text style={styles.profileRole}>{user?.role || 'Patient'}</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1, marginRight: 10 }]}
            onPress={() => router.push('/clinicstatus')}
          >
            <Text style={styles.primaryButtonText}>Clinic Status</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, { flex: 1, marginLeft: 10 }]}
            onPress={() => router.push('/patient-schedule')}
          >
            <Text style={styles.primaryButtonText}>Schedule Checkup</Text>
          </TouchableOpacity>
        </View>

        {/* EMERGENCY SOS BUTTON */}
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={handleEmergency}
        >
          <Text style={styles.emergencyButtonText}>EMERGENCY SOS</Text>
        </TouchableOpacity>

        {/* FALL DETECTED */}
        <TouchableOpacity style={styles.primaryButton} onPress={handleFallDetected}>
          <Text style={styles.primaryButtonText}>Fall Detected Alert</Text>
        </TouchableOpacity>

        {/* Fall logs */}
        {fallLogs.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Fall Logs</Text>
            {fallLogs.slice(0, 5).map((log, idx) => (
              <Text key={idx}>
                {new Date(log.timestamp).toLocaleString()} - Lat: {log.latitude?.toFixed(5)}, Lon: {log.longitude?.toFixed(5)}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#D8BDBD', flexGrow: 1 },

  logoutButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#D95A58',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  logoutText: { color: '#fff', fontWeight: 'bold' },

  kikayWelcome: { fontSize: 20, fontWeight: '700', color: '#000', textAlign: 'center', marginBottom: 15, fontStyle: 'italic' },

  profileCard: { backgroundColor: '#fff', paddingVertical: 25, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  profileHeader: { position: 'relative', alignItems: 'center' },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  viewProfileButton: { position: 'absolute', right: -5, top: -5, backgroundColor: '#000', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  viewProfileText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 4 },
  profileRole: { fontSize: 14, color: '#555', marginBottom: 2 },

  primaryButton: { backgroundColor: '#bb352ef1', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },

  emergencyButton: { backgroundColor: '#bb352ef1', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 20, shadowColor: '#bb352ef1', shadowOpacity: 0.8, shadowRadius: 12 },
  emergencyButtonText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

  emergencyOverlay: { flex: 1, backgroundColor: 'rgba(255,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  emergencyText: { color: '#fff', fontSize: 45, fontWeight: '900', letterSpacing: 4, marginBottom: 20 },
  emergencySub: { color: '#fff', fontSize: 20, marginBottom: 40 },
  cancelEmergencyButton: { backgroundColor: '#222', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10 },
});
