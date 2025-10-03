import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Custom paw icon 🐾 (instead of default marker)
const pawIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
  iconSize: [30, 30],
});

const SpotMarkers = ({ spots }) => {
  return (
    <>
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={pawIcon}>
          <Popup>
            <strong>🐾 Feeding Spot</strong>
            <br />
            {spot.notes || "Food/Water available"}
          </Popup>
        </Marker>
      ))}
    </>
  );
};

const AddSpotOnClick = ({ onAdd }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const newSpot = {
        id: Date.now(),
        lat,
        lng,
        notes: "Food/Water Station",
      };
      onAdd(newSpot);
    },
  });
  return null;
};

const FeedingSpots = () => {
  const [spots, setSpots] = useState([]);

  const handleAddSpot = (spot) => {
    setSpots((prev) => [...prev, spot]);
  };

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <h2 style={{ textAlign: "center", margin: "10px 0" }}>🐾 Stray Feeding Spots</h2>
      <MapContainer
        center={[14.83, 120.28]} // Olongapo default center
        zoom={14}
        style={{ height: "70vh", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <AddSpotOnClick onAdd={handleAddSpot} />
        <SpotMarkers spots={spots} />
      </MapContainer>
      <p style={{ textAlign: "center", fontSize: "14px", marginTop: "5px" }}>
        Tap on the map to add a feeding spot 🐕🐈
      </p>
    </div>
  );
};

export default FeedingSpots;