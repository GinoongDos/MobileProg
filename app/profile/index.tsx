import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const patientsData = [
  { 
    id: '1', 
    name: 'Dolens Vallecera', 
    age: 55, 
    status: 'Stable', 
    location: 'Bogo',
    contact: '09123456789',
    lastVisit: '2025-11-01',
    medicalHistory: 'No major illnesses.',
    picture: require('../../assets/images/Dolens.jpg'),
  },
  { 
    id: '2', 
    name: 'Kirky Nudalano', 
    age: 52, 
    status: 'Recovering', 
    location: 'Tablon',
    contact: '09123456788',
    lastVisit: '2025-10-25',
    medicalHistory: 'Recovering from cold.',
    picture: require('../../assets/images/Kirky.jpg'),
  },
  { 
    id: '3', 
    name: 'Chimbie Nagaminyo', 
    age: 60, 
    status: 'Injury', 
    location: 'Cugman',
    contact: '09123456787',
    lastVisit: '2025-10-30',
    medicalHistory: 'Diabetes, High blood pressure.',
    picture: require('../../assets/images/Chimbiyok.jpg'),
  },
  { 
    id: '4', 
    name: 'Jastine Gwapo', 
    age: 32, 
    status: 'Fall', 
    location: 'Norway',
    contact: '09123456786',
    lastVisit: '2025-11-05',
    medicalHistory: 'Hypertension.',
    picture: require('../../assets/images/gwapo.jpg'),
  },
];

type User = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  role: 'Doctor' | 'Patient';
};

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchLoggedInUser = async () => {
      try {
        const loggedInEmail = await AsyncStorage.getItem('loggedInEmail');
        if (loggedInEmail) {
          const userData = await AsyncStorage.getItem(`user:${loggedInEmail}`);
          if (userData) setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.log('Error fetching user:', error);
      }
    };
    fetchLoggedInUser();
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

  const getDisplayInfo = (status: string) => {
    switch (status) {
      case 'Fall': return { displayStatus: 'Fall Condition', condition: 'Needs Attention' };
      case 'Critical': return { displayStatus: 'Injury', condition: 'Critical Condition' };
      case 'Recovering': return { displayStatus: 'Recovering', condition: 'Normal Condition' };
      case 'Stable': return { displayStatus: 'Stable', condition: 'Good Condition' };
      default: return { displayStatus: status, condition: '' };
    }
  };

  return (
    <FlatList
      ListHeaderComponent={() => (
        <View style={styles.profileTop}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Image source={require('../../assets/images/avatar.jpg')} style={styles.avatar} />
          <Text style={styles.name}>
            {user ? `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}` : 'Loading...'}
          </Text>
          <Text style={styles.role}>{user ? user.role : ''}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Email: {user?.email}</Text>
            <Text style={styles.infoText}>Location: Carmen Clinic</Text>
          </View>

          {user?.role === 'Doctor' && <Text style={styles.sectionTitle}>Patients List</Text>}
          {user?.role === 'Patient' && <Text style={styles.sectionTitle}>My Medical Info</Text>}
        </View>
      )}
      data={user?.role === 'Doctor' ? patientsData : user ? [{
        id: 'self',
        name: `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`,
        age: 30, // example age
        status: 'Stable',
        location: 'Carmen Clinic',
        contact: '09123456780',
        lastVisit: '2025-11-01',
        medicalHistory: 'No major illnesses.',
        picture: require('../../assets/images/avatar.jpg'),
      }] : []}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const { displayStatus, condition } = getDisplayInfo(item.status);
        return (
          <View style={styles.patientCard}>
            <Image source={item.picture} style={styles.patientImage} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.patientName}>{item.name}</Text>
              <Text style={styles.patientCondition}>
                Age: {item.age} | Location: {item.location} | Status: {displayStatus}{condition ? ` | Condition: ${condition}` : ''}
              </Text>
              <Text style={styles.patientCondition}>Last Visit: {item.lastVisit}</Text>
              <Text style={styles.patientCondition}>Contact: {item.contact}</Text>
              <Text style={styles.patientCondition}>Medical History: {item.medicalHistory}</Text>
            </View>
          </View>
        );
      }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50, backgroundColor: '#D8BDBD' }}
      style={{ backgroundColor: '#D8BDBD' }}
    />
  );
}

const styles = StyleSheet.create({
  profileTop: { alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  logoutButton: { position: 'absolute', top: 20, right: 20, backgroundColor: '#D95A58', padding: 10, borderRadius: 8 },
  logoutText: { color: '#fff', fontWeight: 'bold' },
  avatar: { width: 140, height: 140, borderRadius: 70, marginBottom: 20 },
  name: { fontSize: 26, color: '#000', fontWeight: 'bold' },
  role: { fontSize: 16, color: '#333', marginBottom: 20 },
  infoBox: { backgroundColor: '#ffffff', padding: 20, borderRadius: 12, width: '85%', marginBottom: 30 },
  infoText: { color: '#333', fontSize: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 15, textAlign: 'center' },
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000ff', padding: 12, borderRadius: 12, marginBottom: 12 },
  patientImage: { width: 60, height: 60, borderRadius: 30 },
  patientName: { color: '#ffffff', fontSize: 18, fontWeight: '600' },
  patientCondition: { color: '#ffffff', marginTop: 4, fontSize: 14 },
});
