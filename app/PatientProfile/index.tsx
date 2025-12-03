import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type Patient = {
  firstName: string;
  middleName?: string;
  lastName: string;
  role: string;
  age?: number;
  gender?: string;
  status?: string;
  contact?: string;
  location?: string;
  profilePicture?: string;
};

export default function PatientProfile() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const fetchPatient = async () => {
      const email = await AsyncStorage.getItem('loggedInEmail');
      if (email) {
        const userData = await AsyncStorage.getItem(`user:${email}`);
        if (userData) {
          const parsedData: Patient = JSON.parse(userData);
          if (parsedData.role === 'Patient') {
            setPatient(parsedData);
          } else {
            // Not a patient, redirect to dashboard
            router.push('/(tabs)');
          }
        }
      }
    };
    fetchPatient();
  }, []);

  if (!patient) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={
            patient.profilePicture
              ? { uri: patient.profilePicture }
              : require('@/assets/images/avatar.jpg')
          }
          style={styles.patientImage}
        />
        <Text style={styles.name}>
          {patient.firstName} {patient.middleName ?? ''} {patient.lastName}
        </Text>
        <Text style={styles.role}>{patient.role}</Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <Text style={styles.infoItem}>Age: {patient.age ?? 'N/A'}</Text>
        <Text style={styles.infoItem}>Gender: {patient.gender ?? 'N/A'}</Text>
        <Text style={styles.infoItem}>Status: {patient.status ?? 'N/A'}</Text>
        <Text style={styles.infoItem}>Contact: {patient.contact ?? 'N/A'}</Text>
        <Text style={styles.infoItem}>Location: {patient.location ?? 'N/A'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#D8BDBD' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  patientImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#fff',
  },
  name: { fontSize: 26, fontWeight: 'bold', marginBottom: 5, color: '#000' },
  role: { fontSize: 18, color: '#555', marginBottom: 10 },
  infoBox: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  infoItem: { fontSize: 16, marginBottom: 5 },
});
