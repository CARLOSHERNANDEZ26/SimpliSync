"use client";

import React, { useState, useEffect } from "react";
import PlantCard from "@/components/PlantCard.jsx"; 
import "@/app/styles/myPlants.css";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function MyPlantsPage() {
  const { user } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="my-plants-container">
      <h2>Welcome, {user.name} 🌱</h2>
      <h3>My Plants</h3>
      <div className="plants-grid">
        {plants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} />
        ))}
      </div>
    </div>
  );
}
