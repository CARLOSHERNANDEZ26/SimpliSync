"use client";

import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LeafletMouseEvent } from "leaflet";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "@/components/ConfirmModal";
import { useMapData } from "@/context/MapContext";
import "../../app/styles/GreenMap.css";

// --- TYPE DEFINITIONS ---

// 1. Define the shape of a single spot object
interface Spot {
  id: number;
  lat: number;
  lng: number;
  notes: string;
}

// 2. Define the props for the AddPlantOnClick component
interface AddPlantOnClickProps {
  onAdd: (spot: Spot) => void;
}

// 3. Define the shape of the data coming from your MapContext
interface MapContextType {
  spots: Spot[];
  addSpot: (spot: Spot) => void;
  clearSpots: () => void;
  updateSpot: (id: number, updates: { notes: string }) => void;
  deleteSpot: (id: number) => void;
}

// --- COMPONENT LOGIC ---

const treeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/427/427735.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});

const AddPlantOnClick = ({ onAdd }: AddPlantOnClickProps) => {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;
      const newSpot: Spot = {
        id: Date.now(),
        lat,
        lng,
        notes: "Community Tree/Plant",
      };
      onAdd(newSpot);
    },
  });
  return null;
};

export default function GreenMap() {
  // 4. Apply the context type to the hook's return value
  const { spots, addSpot, clearSpots, updateSpot, deleteSpot } = useMapData() as MapContextType;
  
  // 5. Type the state variable: it can be a number or null
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleAddSpot = (spot: Spot) => {
    addSpot(spot);
    toast.success("🌱 New planting spot added!", {
      position: "bottom-center",
      autoClose: 1500,
    });
  };

  const handleClearSpots = () => setShowConfirm(true);

  const confirmClearSpots = () => {
    clearSpots();
    toast.info("🗑️ All markers cleared.", { position: "bottom-center", autoClose: 1500 });
    setShowConfirm(false);
  };

  // 6. Type the 'id' parameter for the handler functions
  const handleDeleteMarker = (id: number) => {
    setDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDeleteMarker = () => {
    if (deleteId) {
      deleteSpot(deleteId);
      toast.info("🗑️ Marker deleted.", { position: "bottom-center", autoClose: 1500 });
    }
    setDeleteId(null);
    setShowConfirm(false);
  };

  const handleEditMarker = (id: number) => {
    const newNote = prompt("Edit marker note:");
    if (newNote && newNote.trim() !== "") {
      updateSpot(id, { notes: newNote.trim() });
      toast.success("✏️ Marker updated!", { position: "bottom-center", autoClose: 1500 });
    }
  };

  return (
    <div className="map-page content-wrap">
      <h2>🌳 Interactive Green Map</h2>
      <p>
        Tap anywhere on the map to add a 🌱 planting spot. <br></br>
        Click a marker to edit or delete it.
      </p>

      <MapContainer
        center={[14.83, 120.28]}
        zoom={14}
        style={{
          height: "70vh",
          width: "100%",
          borderRadius: "12px",
          marginTop: "1rem",
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <AddPlantOnClick onAdd={handleAddSpot} />

        {/* 7. The 'spot' parameter is now automatically typed! */}
        {spots.map((spot) => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={treeIcon}>
            <Popup>
              <strong>🌱 Planting Spot</strong>
              <br />
              <em>{spot.notes}</em>
              <div className="popup-actions">
                <button onClick={() => handleEditMarker(spot.id)}>✏️ Edit</button>
                <button onClick={() => handleDeleteMarker(spot.id)}>🗑️ Delete</button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {spots.length > 0 && (
        <button className="clear-btn" onClick={handleClearSpots}>
          🗑️ Clear All Markers
        </button>
      )}

      <ToastContainer aria-label="notification container" />

      {showConfirm && (
        <ConfirmModal
          message={
            deleteId
              ? "Are you sure you want to delete this marker?"
              : "Are you sure you want to delete all markers?"
          }
          onConfirm={deleteId ? confirmDeleteMarker : confirmClearSpots}
          onCancel={() => {
            setShowConfirm(false);
            setDeleteId(null);
          }}
        />
      )}
    </div>
  );
}