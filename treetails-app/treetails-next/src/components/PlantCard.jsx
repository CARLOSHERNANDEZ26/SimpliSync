"use client";

import React, { useState, useRef } from "react";
import "@/app/styles/myPlants.css";

const PlantCard = ({ plant }) => {
  const [showAlbum, setShowAlbum] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(plant.growthProgress || 60);
  const albumRef = useRef(null);

  const handleScroll = () => {
    if (albumRef.current) {
      const scrollLeft = albumRef.current.scrollLeft;
      const width = albumRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setCurrentIndex(index);
    }
  };

  // Function to map progress to stage & emoji
  const getStage = (value) => {
    if (value <= 20) return { name: "Seed", emoji: "🌰" };
    if (value <= 40) return { name: "Sprout", emoji: "🌱" };
    if (value <= 60) return { name: "Seedling", emoji: "🌿" };
    if (value <= 80) return { name: "Flowering", emoji: "🌸" };
    return { name: "Mature", emoji: "🌳" };
  };

  const [stage, setStage] = useState(getStage(progress));

  const handleNextStage = () => {
    const newProgress = Math.min(progress + 20, 100);
    setProgress(newProgress);
    setStage(getStage(newProgress));
  };

  const plantedDate = plant.plantedDate || "June 20, 2025";

  return (
    <>
      {/* Instagram-style Thumbnail */}
      <div className="feed-thumb" onClick={() => setShowAlbum(true)}>
        <img src={plant.imageUrls[0]} alt={plant.name} className="feed-image" />

        {/* NEW: Growth stage badge */}
        <div className="growth-stage-badge">
          <span>{stage.emoji}</span>
        </div>
      </div>

      {/* Modal */}
      {showAlbum && (
        <div className="album-modal">
          <button className="close-btn" onClick={() => setShowAlbum(false)}>
            ✕
          </button>

          <div className="album-content-wrapper">
            {/* Scrollable Album */}
            <div className="plant-album" ref={albumRef} onScroll={handleScroll}>
              {plant.imageUrls.map((img, index) => (
                <div className="album-slide" key={index}>
                  <div className="image-content-wrapper">
                    <img
                      src={img}
                      alt={`${plant.name} ${index + 1}`}
                      className="plant-image"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Dots */}
            <div className="album-indicators">
              {plant.imageUrls.map((_, index) => (
                <span
                  key={index}
                  className={`dot ${index === currentIndex ? "active" : ""}`}
                />
              ))}
            </div>

            {/* Growth Tracker */}
            <div className="growth-section">
              <h4>🌱 Growth Progress</h4>
              <div className="growth-bar">
                <div
                  className="growth-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Timeline */}
              <div className="growth-timeline">
                <div className="timeline-item">
                  <span>📅 Planted: {plantedDate}</span>
                </div>
                <div className="timeline-item">
                  <span>🌿 Current Stage: {stage.name}</span>
                </div>
              </div>

              {/* Next Stage Button */}
              <button
                className="next-stage-btn"
                onClick={handleNextStage}
                disabled={progress >= 100}
              >
                {progress >= 100 ? "🌳 Fully Grown" : "Next Stage →"}
              </button>
            </div>

            {/* Plant Info */}
            <div className="plant-details">
              <h3>{plant.name}</h3>
              <p>{plant.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlantCard;
