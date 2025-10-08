import React, { createContext, useContext, useEffect, useState } from "react";

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [spots, setSpots] = useState([]);

  // Load markers on start
  useEffect(() => {
    const saved = localStorage.getItem("greenMapSpots");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setSpots(parsed);
      } catch (err) {
        console.error("Error parsing saved markers:", err);
      }
    }
  }, []);

  // Save markers whenever they change
  useEffect(() => {
    localStorage.setItem("greenMapSpots", JSON.stringify(spots));
  }, [spots]);

  const addSpot = (spot) => setSpots((prev) => [...prev, spot]);

  const clearSpots = () => {
    setSpots([]);
    localStorage.removeItem("greenMapSpots");
  };

  const updateSpot = (id, newData) => {
    setSpots((prev) => prev.map((spot) => (spot.id === id ? { ...spot, ...newData } : spot)));
  };

  const deleteSpot = (id) => {
    setSpots((prev) => prev.filter((spot) => spot.id !== id));
  };

  return (
    <MapContext.Provider value={{ spots, addSpot, clearSpots, updateSpot, deleteSpot }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapData = () => useContext(MapContext);
