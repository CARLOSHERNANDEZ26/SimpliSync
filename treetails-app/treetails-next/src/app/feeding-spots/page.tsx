"use client";

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LeafletMouseEvent } from "leaflet";

// Define the type for a Feeding Spot
interface Spot {
  id: number;
  lat: number;
  lng: number;
  notes: string;
}

// Custom paw icon 🐾 (instead of default marker)
const pawIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/616/616408.png",
  iconSize: [30, 30],
});

// Use the Spot type for props
const SpotMarkers = ({ spots }: { spots: Spot[] }) => {
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

// Use the Spot type for props
const AddSpotOnClick = ({ onAdd }: { onAdd: (spot: Spot) => void }) => {
  useMapEvents({ 
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      const newSpot: Spot = { // Explicitly type newSpot as Spot
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
  const [spots, setSpots] = useState<Spot[]>([]); // FIX: Use Spot[] instead of any[]

  const handleAddSpot = (spot: Spot) => { // FIX: Use Spot instead of any
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