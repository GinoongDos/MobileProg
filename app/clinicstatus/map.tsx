import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function ClinicMap() {
  const params = useLocalSearchParams();

  const clinicLat = Number(params.clinicLat);
  const clinicLon = Number(params.clinicLon);
  const patientLat = Number(params.patientLat);
  const patientLon = Number(params.patientLon);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: patientLat,
          longitude: patientLon,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker
          coordinate={{ latitude: patientLat, longitude: patientLon }}
          title="Patient Location"
          pinColor="blue"
        />

        <Marker
          coordinate={{ latitude: clinicLat, longitude: clinicLon }}
          title="Clinic Location"
          pinColor="red"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
  },
});
