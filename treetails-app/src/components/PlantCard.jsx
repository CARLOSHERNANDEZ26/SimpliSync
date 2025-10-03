import React, { useState, useRef } from "react";
import "../components/myPlants.css";

const PlantCard = ({ plant }) => {
  const [showAlbum, setShowAlbum] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const albumRef = useRef(null);

  const handleScroll = () => {
    if (albumRef.current) {
      const scrollLeft = albumRef.current.scrollLeft;
      const width = albumRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setCurrentIndex(index);
    }
  };

  return (
    <>
      {/* Thumbnail grid item (Instagram-style) */}
      <div className="feed-thumb" onClick={() => setShowAlbum(true)}>
        <img
          src={plant.imageUrls[0]}
          alt={plant.name}
          className="feed-image"
        />
      </div>

      {/* Modal for TikTok-style album */}
      {showAlbum && (
        <div className="album-modal">
          <button className="close-btn" onClick={() => setShowAlbum(false)}>
            ✕
          </button>
          <h3>{plant.name}</h3>
          <p>{plant.description}</p>

          <div
            className="plant-album"
            ref={albumRef}
            onScroll={handleScroll}
          >
            {plant.imageUrls.map((img, index) => (
              <div className="album-slide" key={index}>
                <img
                  src={img}
                  alt={`${plant.name} ${index + 1}`}
                  className="plant-image zoomable"
                />
              </div>
            ))}
          </div>

          {/* Swipe indicators */}
          <div className="album-indicators">
            {plant.imageUrls.map((_, index) => (
              <span
                key={index}
                className={`dot ${index === currentIndex ? "active" : ""}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default PlantCard;
