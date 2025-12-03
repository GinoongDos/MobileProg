import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import MapView, { Marker } from 'react-native-maps';

type User = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  clinicName?: string;
  profilePicture?: string;
};

type SOSRequest = {
  patientEmail: string;
  patientName: string;
  age: number;
  gender: string;
  condition: string;
  clinic: string;
  timestamp: string;
  latitude: number;   // Patient GPS
  longitude: number;  // Patient GPS
};

type FallRecord = {
  timestamp: string;
  severity: string;
};

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([]);
  const [selectedPatientLocation, setSelectedPatientLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [fallHistory, setFallHistory] = useState<FallRecord[]>([]);

  useEffect(() => {
    const fetchDoctor = async () => {
      const email = await AsyncStorage.getItem('loggedInEmail');
      if (email) {
        const userData = await AsyncStorage.getItem(`user:${email}`);
        if (userData) setUser(JSON.parse(userData));
        loadSOSRequests();
      }
    };
    fetchDoctor();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadSOSRequests, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSOSRequests = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const sosKeys = keys.filter((k) => k.startsWith('sos:'));
    const requests: SOSRequest[] = [];
    for (let key of sosKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) requests.push(JSON.parse(data));
    }
    requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setSosRequests(requests);
  };

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

  const handleMarkHandled = async (sos: SOSRequest) => {
    await AsyncStorage.removeItem(`sos:${sos.patientEmail}`);
    const reportsKey = `report:${sos.patientEmail}`;
    const existingReportsData = await AsyncStorage.getItem(reportsKey);
    const existingReports = existingReportsData ? JSON.parse(existingReportsData) : [];
    existingReports.push(sos);
    await AsyncStorage.setItem(reportsKey, JSON.stringify(existingReports));
    Alert.alert('Handled', `SOS from ${sos.patientName} moved to report.`);
    loadSOSRequests();
    setSelectedPatientLocation(null);
    setFallHistory([]);
  };

  const viewPatientLocation = async (patientEmail: string) => {
    const data = await AsyncStorage.getItem(`sos:${patientEmail}`);
    if (!data) return;

    const sos: SOSRequest = JSON.parse(data);
    setSelectedPatientLocation({ latitude: sos.latitude, longitude: sos.longitude });

    // Load last 7 fall records
    const reportData = await AsyncStorage.getItem(`report:${patientEmail}`);
    const history: FallRecord[] = reportData ? JSON.parse(reportData) : [];
    setFallHistory(history.slice(-7));
  };

  const chartData = {
    labels: fallHistory.map((f) => new Date(f.timestamp).toLocaleDateString()),
    datasets: [
      {
        data: fallHistory.map((f) => (f.severity === 'High' ? 3 : f.severity === 'Medium' ? 2 : 1)),
        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{user ? `Hi Doc ${user.firstName}!` : 'Hi Doc!'}</Text>
        <Text style={styles.subtitle}>Welcome back!</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={user?.profilePicture ? { uri: user.profilePicture } : require('@/assets/images/avatar.jpg')}
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.profileRole}>{user?.role}</Text>
        <Text style={styles.profileClinic}>{user?.clinicName || 'Clinic Name'}</Text>
      </View>

      {/* SOS Requests */}
      <View style={styles.sosContainer}>
        <Text style={styles.cardTitle}>Emergency SOS Requests</Text>
        {sosRequests.length === 0 && <Text style={styles.noDataText}>No current emergencies</Text>}
        {sosRequests.map((sos, idx) => (
          <View key={idx} style={styles.sosCard}>
            <Text style={styles.sosText}><Text style={{ fontWeight: 'bold' }}>Patient:</Text> {sos.patientName}</Text>
            <Text style={styles.sosText}><Text style={{ fontWeight: 'bold' }}>Age:</Text> {sos.age}</Text>
            <Text style={styles.sosText}><Text style={{ fontWeight: 'bold' }}>Condition:</Text> {sos.condition}</Text>
            <Text style={styles.sosText}><Text style={{ fontWeight: 'bold' }}>Clinic:</Text> {sos.clinic}</Text>
            <Text style={styles.sosText}><Text style={{ fontWeight: 'bold' }}>Time:</Text> {new Date(sos.timestamp).toLocaleString()}</Text>

            <TouchableOpacity style={styles.locationButton} onPress={() => viewPatientLocation(sos.patientEmail)}>
              <Text style={styles.locationButtonText}>View Location & History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.handledButton} onPress={() => handleMarkHandled(sos)}>
              <Text style={styles.handledText}>Mark Handled</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Map */}
      {selectedPatientLocation && (
        <View style={{ height: 250, marginBottom: 20, borderRadius: 15, overflow: 'hidden' }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              ...selectedPatientLocation,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker coordinate={selectedPatientLocation} title="Patient Location" pinColor="red" />
          </MapView>
        </View>
      )}

      {/* Fall History Chart */}
      {fallHistory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Last 7 Falls</Text>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '6', strokeWidth: '2', stroke: '#ff0000' },
            }}
            style={{ borderRadius: 16 }}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#D8BDBD' },
  header: { marginTop: 40, alignItems: 'center', position: 'relative', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 16, color: '#555', marginTop: 4 },
  logoutButton: { position: 'absolute', right: 0, top: -5, paddingHorizontal: 15, paddingVertical: 5, backgroundColor: '#D95A58', borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  profileCard: { backgroundColor: '#fff', paddingVertical: 25, paddingHorizontal: 20, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 4 },
  profileRole: { fontSize: 14, color: '#555', marginBottom: 2 },
  profileClinic: { fontSize: 14, color: '#555' },
  sosContainer: { backgroundColor: '#f70000ff', padding: 20, borderRadius: 15, marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  noDataText: { fontStyle: 'italic', color: '#fff' },
  sosCard: { backgroundColor: '#FFCCCB', padding: 15, borderRadius: 12, marginBottom: 12 },
  sosText: { marginBottom: 6, color: '#333' },
  handledButton: { marginTop: 8, backgroundColor: '#4CD964', padding: 10, borderRadius: 8, alignItems: 'center' },
  handledText: { color: '#fff', fontWeight: 'bold' },
  locationButton: { marginTop: 6, backgroundColor: '#6C63FF', padding: 10, borderRadius: 8, alignItems: 'center' },
  locationButtonText: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 5 }, shadowRadius: 10, elevation: 3 },
});
