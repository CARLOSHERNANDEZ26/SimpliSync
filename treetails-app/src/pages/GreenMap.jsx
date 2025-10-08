import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ConfirmModal from "../components/ConfirmModal";
import { useMapData } from "../context/MapContext";
import "./GreenMap.css";

const treeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/427/427735.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -30],
});

const AddPlantOnClick = ({ onAdd }) => {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      const newSpot = {
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
  const { spots, addSpot, clearSpots, updateSpot, deleteSpot } = useMapData();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const handleAddSpot = (spot) => {
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

  const handleDeleteMarker = (id) => {
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

  const handleEditMarker = (id) => {
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
        Tap anywhere on the map to add a 🌱 planting spot.  <br></br>
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

      <p className="map-note">🪴 Markers persist across sessions.</p>
      <ToastContainer />

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
