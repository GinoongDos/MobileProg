import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

type SOSRequest = {
  patientEmail: string;
  patientName: string;
  age: number;
  gender: string;
  condition: string;
  clinic: string;
  timestamp: string;
};

export default function Reports() {
  const [sosRequests, setSosRequests] = useState<SOSRequest[]>([]);
  const [summary, setSummary] = useState({ totalRequests: 0, latestTime: '', uniquePatients: 0 });

  useEffect(() => { loadSOSRequests(); }, []);

  const loadSOSRequests = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const reportKeys = keys.filter(k => k.startsWith('reports:'));
    const requests: SOSRequest[] = [];
    for (let key of reportKeys) {
      const data = await AsyncStorage.getItem(key);
      if (data) requests.push(...JSON.parse(data));
    }
    setSosRequests(requests);

    const uniquePatients = new Set(requests.map(r => r.patientEmail)).size;
    const latestTime = requests.length ? new Date(Math.max(...requests.map(r => new Date(r.timestamp).getTime()))).toLocaleString() : '';
    setSummary({ totalRequests: requests.length, latestTime, uniquePatients });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Emergency Reports</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryText}>Total Requests: {summary.totalRequests}</Text>
        <Text style={styles.summaryText}>Unique Patients: {summary.uniquePatients}</Text>
        {summary.latestTime && <Text style={styles.summaryText}>Latest Emergency: {summary.latestTime}</Text>}
      </View>

      {sosRequests.length === 0 ? (
        <View style={styles.card}><Text>No Emergency Requests</Text></View>
      ) : (
        sosRequests.map((sos, idx) => (
          <View key={idx} style={styles.card}>
            <Text>Patient: {sos.patientName}</Text>
            <Text>Age: {sos.age}</Text>
            <Text>Gender: {sos.gender}</Text>
            <Text>Condition: {sos.condition}</Text>
            <Text>Clinic: {sos.clinic}</Text>
            <Text>Time: {new Date(sos.timestamp).toLocaleString()}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  summaryText: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 6,
  },
  card: {
    backgroundColor: '#fffcfcff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardText: {
    color: '#ccc',
    marginBottom: 5,
  },
});
