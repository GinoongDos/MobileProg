import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const defaultClinics = [
  { id: '1', name: 'Carmen Clinic', doctorEmail: 'doctor1@clinic.com', location: 'Carmen, Cagayan de Oro', latitude: 8.4542, longitude: 124.6319 },
  { id: '2', name: 'Tablon Clinic', doctorEmail: 'doctor2@clinic.com', location: 'Tablon, Cagayan de Oro', latitude: 8.4600, longitude: 124.6340 },
];

type User = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: string;
};

type ClinicStatus = {
  clinicName: string;
  doctor: string;
  status: string;
  location: string;
  latitude: number;
  longitude: number;
};

export default function ClinicStatusScreen() {
  const router = useRouter();
  const [clinicStatus, setClinicStatus] = useState<ClinicStatus[]>([]);
  const [patientLocation, setPatientLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    getPatientLocation();
    updateClinicStatus();
  }, []);

  // -------------- LIVE TRACKING --------------
  const getPatientLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to see your position.');
      return;
    }

    // Initial location
    const location = await Location.getCurrentPositionAsync({});
    setPatientLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    // Live tracking every 2 seconds
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 1,
      },
      (loc) => {
        setPatientLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    );
  };

  const updateClinicStatus = async () => {
    const updatedClinics = await Promise.all(
      defaultClinics.map(async (clinic) => {
        const doctorData = await AsyncStorage.getItem(`user:${clinic.doctorEmail}`);
        const doctor: User | null = doctorData ? JSON.parse(doctorData) : null;

        return {
          clinicName: clinic.name,
          doctor: doctor ? `${doctor.firstName} ${doctor.middleName ?? ''} ${doctor.lastName}`.trim() : 'No doctor assigned',
          status: doctor ? 'Open' : 'Closed',
          location: clinic.location,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
        };
      })
    );

    setClinicStatus(updatedClinics);
  };

  // -------------- OPEN MAP SCREEN --------------
  const openClinicLocation = (clinic: ClinicStatus) => {
    if (!patientLocation) {
      alert('Patient location not available');
      return;
    }

    router.push({
      pathname: '/view-location',
      params: {
        latitude: clinic.latitude.toString(),
        longitude: clinic.longitude.toString(),
        name: clinic.clinicName,
        location: clinic.location,
        patientLat: patientLocation.latitude.toString(),
        patientLon: patientLocation.longitude.toString(),
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Clinic Status</Text>

      {clinicStatus.map((clinic, idx) => {
        let distanceText = '';
        if (patientLocation) {
          const distance = getDistance(
            patientLocation.latitude,
            patientLocation.longitude,
            clinic.latitude,
            clinic.longitude
          );
          distanceText = `Distance: ${distance.toFixed(2)} km`;
        }
        return (
          <View key={idx} style={styles.card}>
            <Text style={styles.clinicName}>{clinic.clinicName}</Text>
            <Text>Doctor: {clinic.doctor}</Text>
            <Text style={{ color: clinic.status === 'Open' ? 'green' : 'red' }}>
              Status: {clinic.status}
            </Text>
            <Text>Location: {clinic.location}</Text>
            {distanceText ? <Text>{distanceText}</Text> : null}

            <TouchableOpacity style={styles.locationButton} onPress={() => openClinicLocation(clinic)}>
              <Text style={styles.locationButtonText}>View Location</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ---------- HAVERSINE FORMULA ----------
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ---------- STYLES ----------
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#D8BDBD', flexGrow: 1 },
  backButton: { marginBottom: 20, backgroundColor: '#555', padding: 10, borderRadius: 8, alignSelf: 'flex-start' },
  backText: { color: '#fff', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 15 },
  clinicName: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  locationButton: { marginTop: 10, backgroundColor: '#007BFF', padding: 12, borderRadius: 10, alignItems: 'center' },
  locationButtonText: { color: '#fff', fontWeight: 'bold' },
});
