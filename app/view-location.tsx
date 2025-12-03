import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_MAPS_APIKEY = "YOUR_GOOGLE_MAPS_API_KEY"; // replace with your key

export default function ViewLocationScreen() {
  const router = useRouter();
  const { location } = useLocalSearchParams();

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  // Clinic coordinates
  const clinicCoords: Record<string, { latitude: number; longitude: number }> = {
    "Carmen, Cagayan de Oro": { latitude: 8.4893, longitude: 124.6319 },
    "Tablon, Cagayan de Oro": { latitude: 8.5215, longitude: 124.7531 },
  };

  const locationStr = typeof location === "string" ? location : "";
  const clinicLocation = clinicCoords[locationStr] || { latitude: 8.4822, longitude: 124.6477 };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Enable location to see your distance to the clinic.");
        return;
      }

      const userLoc = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: userLoc.coords.latitude,
        longitude: userLoc.coords.longitude,
      });
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          ...clinicLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={clinicLocation} title={locationStr} />
        {userLocation && <Marker coordinate={userLocation} title="You are here" pinColor="blue" />}

        {/* Driving route */}
        {userLocation && (
          <MapViewDirections
            origin={userLocation}
            destination={clinicLocation}
            apikey={GOOGLE_MAPS_APIKEY}
            strokeWidth={4}
            strokeColor="blue"
            mode="DRIVING"
            onReady={(result) => {
              setDistanceKm(result.distance);
            }}
          />
        )}
      </MapView>

      {distanceKm !== null && (
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceText}>Distance: {distanceKm.toFixed(2)} km</Text>
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    bottom: 30,
    alignSelf: "center",
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
  },
  backText: {
    color: "#fff",
    fontWeight: "bold",
  },
  distanceContainer: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 8,
  },
  distanceText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
