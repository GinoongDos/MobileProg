import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function StatusScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [userLocation, setUserLocation] = useState<any>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

 
  const clinicLocation = {
    latitude: 8.471514, 
    longitude: 124.623992,
    name: 'Dolens Care Clinic',
    address: 'Macasandig, Cagayan De Oro City, Misamis Oriental',
  };

  
  const updateStatus = () => {
    const now = new Date();
    const hour = now.getHours();

    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    setCurrentTime(`${dateString} • ${timeString}`);

    if (hour >= 8 && hour < 17) {
      setStatus('🟢 OPEN');
      setMessage('The clinic is currently accepting patients.');
    } else if (hour >= 17 && hour < 19) {
      setStatus('🟡 CLOSING SOON');
      setMessage('The clinic is about to close soon. Please hurry if you have appointments.');
    } else {
      setStatus('🔴 CLOSED');
      setMessage('The clinic is closed. Please visit during 8:00 AM to 5:00 PM.');
    }

    if (userLocation) {
      const dist = getDistanceFromLatLonInKm(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        clinicLocation.latitude,
        clinicLocation.longitude
      );
      setDistanceKm(dist);
    }
  };

  
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      }
    })();
  }, []);

  
  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [userLocation]);

  
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const deg2rad = (deg: number) => deg * (Math.PI / 180);
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✅ Clinic Status</Text>

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>{status}</Text>
        <Text style={styles.message}>{message}</Text>

        {distanceKm !== null && (
          <Text style={styles.distanceText}>
            📍 Distance to clinic: {distanceKm.toFixed(2)} km
          </Text>
        )}

        <View style={styles.timeBox}>
          <Text style={styles.timeText}>{currentTime}</Text>
        </View>
      </View>

      {}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: clinicLocation.latitude,
          longitude: clinicLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {}
        <Marker
          coordinate={{
            latitude: clinicLocation.latitude,
            longitude: clinicLocation.longitude,
          }}
          title={clinicLocation.name}
          description={clinicLocation.address}
          pinColor="#008037"
        />

        {}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
            }}
            title="You are here"
            pinColor="#e20b0b"
          />
        )}
      </MapView>

      {}
      <TouchableOpacity style={styles.refreshButton} onPress={updateStatus}>
        <Text style={styles.refreshText}>🔄 Refresh Status</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#eaffea', paddingHorizontal: 20, alignItems: 'center', paddingTop: 40 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#008037', marginBottom: 20 },
  statusBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  statusText: { fontSize: 32, fontWeight: '700', marginBottom: 10 },
  message: { fontSize: 16, color: '#333', textAlign: 'center', maxWidth: 250, marginBottom: 10 },
  distanceText: { fontSize: 16, color: '#006622', fontWeight: '600', marginBottom: 10 },
  timeBox: { marginTop: 10, backgroundColor: '#f0fff4', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  timeText: { fontSize: 15, color: '#006622', fontWeight: '600', textAlign: 'center' },
  map: { width: '90%', height: 250, borderRadius: 20, marginVertical: 20 },
  refreshButton: { backgroundColor: '#00a84f', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginBottom: 10 },
  refreshText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  backButton: { backgroundColor: '#008037', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
  backText: { color: '#fff', fontSize: 18, fontWeight: '600' },
});
