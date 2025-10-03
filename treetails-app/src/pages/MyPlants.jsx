import React, { useState } from "react";
import PlantCard from "../components/PlantCard";
import "../components/myPlants.css";

const MyPlants = () => {
  const [plants] = useState([
    {
      id: 1,
      name: "Aloe Vera",
      description: "A soothing plant for burns and cuts.",
      imageUrls: ["/images/myAloe.jpg", "/images/myAloe2.jpg", "/images/myAloe3.jpg"]
    },
    {
      id: 2,
      name: "Snake Plant",
      description: "Excellent air purifier, very low maintenance.",
      imageUrls: ["/images/mySnakePlant.jpg", "/images/mySnakePlant2.jpg"]
    },
    {
      id: 3,
      name: "Peace Lily",
      description: "Great indoor plant with beautiful white flowers.",
      imageUrls: ["/images/myPeaceLily.jpg", "/images/myPeaceLily2.jpg"]
    }
  ]);

  return (
    <div>
      <h2>My Plants</h2>
      <div className="plants-grid">
        {plants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  );
};

export default MyPlants;
