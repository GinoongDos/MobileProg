import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Checkup = {
  date: string;
  clinic: string;
  phone: string;
  location: string;
};

const defaultClinics = [
  { id: '1', name: 'Carmen Clinic', phone: '09171234567', location: 'Carmen, Cebu, Philippines' },
  { id: '2', name: 'Tablon Clinic', phone: '09179876543', location: 'Tablon, Cebu, Philippines' },
];

export default function ScheduleScreen() {
  const router = useRouter();
  const [checkups, setCheckups] = useState<Checkup[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [clinicPickerVisible, setClinicPickerVisible] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<any>(null);

  useEffect(() => {
    const loadCheckups = async () => {
      const email = await AsyncStorage.getItem('loggedInEmail');
      if (!email) return;
      const data = await AsyncStorage.getItem(`checkups:${email}`);
      setCheckups(data ? JSON.parse(data) : []);
    };
    loadCheckups();
  }, []);

  const onChangeDate = (event: any, date?: Date) => {
    setShowPicker(false);
    if (date) setSelectedDate(date);
  };

  const scheduleCheckup = async (clinic: any) => {
    if (!selectedDate) return;
    const email = await AsyncStorage.getItem('loggedInEmail');
    if (!email) return;

    const formattedDate = selectedDate.toISOString().split('T')[0];
    const existingData = await AsyncStorage.getItem(`checkups:${email}`);
    const existingCheckups = existingData ? JSON.parse(existingData) : [];

    const newCheckup: Checkup = {
      date: formattedDate,
      clinic: clinic.name,
      phone: clinic.phone,
      location: clinic.location,
    };

    existingCheckups.push(newCheckup);
    await AsyncStorage.setItem(`checkups:${email}`, JSON.stringify(existingCheckups));
    setCheckups(existingCheckups);
    setSelectedDate(null);
    setSelectedClinic(null);
    setClinicPickerVisible(false);

    // Alert showing message with in-app map navigation
    Alert.alert(
      'Schedule Sent',
      `Your schedule on ${formattedDate} was sent to ${clinic.name}.\nLocation: ${clinic.location}`,
      [
        { text: 'OK' },
        {
          text: 'Open Map',
          onPress: () => {
            router.push({
              pathname: '/view-location',
              params: {
                clinicName: clinic.name,
                location: clinic.location,
              },
            });
          },
        },
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Schedule Checkup</Text>

      {/* Date Picker */}
      <TouchableOpacity style={styles.button} onPress={() => setShowPicker(true)}>
        <Text style={styles.buttonText}>{selectedDate ? selectedDate.toDateString() : 'Select Date'}</Text>
      </TouchableOpacity>
      {showPicker && <DateTimePicker value={selectedDate || new Date()} mode="date" display="calendar" onChange={onChangeDate} />}

      {/* Clinic Picker */}
      <TouchableOpacity style={styles.button} onPress={() => setClinicPickerVisible(true)}>
        <Text style={styles.buttonText}>{selectedClinic ? selectedClinic.name : 'Choose Clinic'}</Text>
      </TouchableOpacity>

      {/* Schedule Button */}
      <TouchableOpacity
        style={styles.scheduleButton}
        onPress={() => {
          if (!selectedClinic) {
            Alert.alert('Select Clinic', 'Please choose a clinic first.');
            return;
          }
          scheduleCheckup(selectedClinic);
        }}
      >
        <Text style={styles.scheduleButtonText}>Set Schedule</Text>
      </TouchableOpacity>

      {/* Clinic Picker Modal */}
      <Modal visible={clinicPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Choose Clinic</Text>
            {defaultClinics.map((clinic) => (
              <TouchableOpacity
                key={clinic.id}
                style={styles.clinicOption}
                onPress={() => {
                  setSelectedClinic(clinic);
                  setClinicPickerVisible(false);
                }}
              >
                <Text style={styles.clinicOptionText}>{clinic.name}</Text>
                <Text style={styles.clinicOptionSub}>{clinic.phone}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setClinicPickerVisible(false)}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scheduled Checkups */}
      <View style={{ marginTop: 20 }}>
        {checkups.map((checkup, idx) => (
          <View key={idx} style={styles.card}>
            <Text>Date: {checkup.date}</Text>
            <Text>Clinic: {checkup.clinic}</Text>
            <Text>Phone: {checkup.phone}</Text>
            <Text>Location: {checkup.location}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#D8BDBD', flexGrow: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  button: { backgroundColor: '#bb352ef1', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  scheduleButton: { backgroundColor: '#00ff37ff', padding: 12, borderRadius: 10, marginBottom: 10, alignItems: 'center', borderWidth: 1, borderColor: '#bbb' },
  scheduleButtonText: { color: '#000', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bbb' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#D8BDBD', width: '85%', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#bbb' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#000' },
  clinicOption: { padding: 15, backgroundColor: '#fff', borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#bbb' },
  clinicOptionText: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  clinicOptionSub: { fontSize: 14, color: '#555' },
  cancelButton: { marginTop: 10, backgroundColor: '#bb352e', padding: 15, borderRadius: 10, alignItems: 'center' },
});
