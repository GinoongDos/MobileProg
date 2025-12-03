import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type User = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  clinicName?: string;
  profilePicture?: string;
};

type Appointment = {
  patientName: string;
  time: string; // ISO string
  condition: string;
  patientEmail: string;
};

export default function ScheduleScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchDoctor = async () => {
      const email = await AsyncStorage.getItem('loggedInEmail');
      if (email) {
        const userData = await AsyncStorage.getItem(`user:${email}`);
        if (userData) setUser(JSON.parse(userData));

        const appointmentsData = await AsyncStorage.getItem(`appointments:${email}`);
        if (appointmentsData) setAppointments(JSON.parse(appointmentsData));
      }
    };
    fetchDoctor();
  }, []);

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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {user ? `Hi Doc ${user.firstName}!` : 'Hi Doc!'}
        </Text>
        <Text style={styles.subtitle}>Your Scheduled Appointments</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <Image
          source={
            user?.profilePicture
              ? { uri: user.profilePicture }
              : require('@/assets/images/avatar.jpg')
          }
          style={styles.profileImage}
        />
        <Text style={styles.profileName}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text style={styles.profileRole}>{user?.role}</Text>
        <Text style={styles.profileClinic}>{user?.clinicName || 'Clinic Name'}</Text>
      </View>

      {/* Appointment List */}
      <View style={styles.appointmentContainer}>
        {appointments.length === 0 && <Text style={styles.noDataText}>No appointments scheduled</Text>}
        {appointments.map((appt, idx) => (
          <View key={idx} style={styles.appointmentCard}>
            <Text style={styles.apptText}><Text style={{ fontWeight: 'bold' }}>Patient:</Text> {appt.patientName}</Text>
            <Text style={styles.apptText}><Text style={{ fontWeight: 'bold' }}>Condition:</Text> {appt.condition}</Text>
            <Text style={styles.apptText}><Text style={{ fontWeight: 'bold' }}>Time:</Text> {new Date(appt.time).toLocaleString()}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#D8BDBD' },

  header: { marginTop: 40, alignItems: 'center', position: 'relative', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 16, color: '#555', marginTop: 4 },
  logoutButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: '#D95A58',
    borderRadius: 8,
  },
  logoutText: { color: '#fff', fontWeight: 'bold' },

  profileCard: {
    backgroundColor: '#fff',
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 6,
  },
  profileImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  profileName: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 4 },
  profileRole: { fontSize: 14, color: '#555', marginBottom: 2 },
  profileClinic: { fontSize: 14, color: '#555' },

  appointmentContainer: {
    marginBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#FFCCCB',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  apptText: { marginBottom: 6, color: '#333' },
  noDataText: { fontStyle: 'italic', color: '#555' },
});
