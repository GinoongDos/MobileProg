import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function LocationScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // ✅ Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied.');
          setLoading(false);
          return;
        }

        // ✅ Get coordinates
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        // ✅ Reverse geocode (convert lat/lng to address)
        const [reverseGeocode] = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });

        if (reverseGeocode) {
          const name = reverseGeocode.name || '';
          const city = reverseGeocode.city || '';
          const region = reverseGeocode.region || '';
          const country = reverseGeocode.country || '';
          setAddress(`${name}, ${city}, ${region}, ${country}`);
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setErrorMsg('Failed to fetch location.');
        setLoading(false);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Your Location</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#e20b0b" />
      ) : errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : location ? (
        <>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="You are here"
              description={address || 'Fetching address...'}
              pinColor="#e20b0b"
            />
          </MapView>

          <Text style={styles.coord}>
            Lat: {location.coords.latitude.toFixed(5)} | Lng: {location.coords.longitude.toFixed(5)}
          </Text>

          {/* ✅ Display readable location name */}
          {address && <Text style={styles.address}>{address}</Text>}
        </>
      ) : (
        <Text style={styles.subtitle}>Unable to fetch location.</Text>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>⬅ Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffe5e5',
    alignItems: 'center',
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e20b0b',
    marginBottom: 10,
  },
  map: {
    width: '90%',
    height: '60%',
    borderRadius: 20,
    marginVertical: 20,
  },
  coord: {
    fontSize: 16,
    color: '#333',
  },
  address: {
    fontSize: 16,
    color: '#444',
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 15,
  },
  error: {
    fontSize: 16,
    color: 'red',
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#e20b0b',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 10,
  },
  backText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
