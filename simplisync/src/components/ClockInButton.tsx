"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clockInEmployee } from "@/services/attendance"; 

export default function ClockInButton() {
  const { user } = useAuth(); // We need this to know WHO is clocking in!
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClockIn = () => {
    setIsLoading(true);
    setStatusMsg("Accessing GPS...");

    // 1. Check if the browser even supports GPS
    if (!navigator.geolocation) {
      setStatusMsg("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    // 2. Ask the browser for the location
    navigator.geolocation.getCurrentPosition(
      async (position) => {

        const { latitude, longitude } = position.coords;

        try {
            await clockInEmployee(user?.uid || "", latitude, longitude);
            setStatusMsg("Ika'y nakapag Clock In na!"); 
        } catch (error) {
            if (error instanceof Error && error.message === "Please allow location access to clock in.") {
                setStatusMsg(error.message); 
            } else if (error instanceof Error && error.message.includes("You are outside the allowed area")) {
                setStatusMsg(error.message); 
            } else {
                setStatusMsg("An unexpected error occurred. Please try again."); 
            } 
        } finally {
            setIsLoading(false);
        }

    
        // CHALLENGE GOES HERE:
        // 1. Get the coordinates: const { latitude, longitude } = position.coords;
        // 2. Create a try/catch block.
        // 3. Inside the 'try': call await clockInEmployee(...) using the user's ID and the coordinates.
        //    (Hint: user?.uid will give you their ID)
        // 4. If it succeeds, update statusMsg to "Clocked In Successfully!"
        // 5. Inside the 'catch': update statusMsg to the error.message so the UI shows your custom Bouncer warnings.
        // 6. Always set isLoading back to false when it finishes!
      },
      () => {
        // This runs if the user clicks "Block" when the browser asks for location permission
        setStatusMsg("Please allow location access to clock in.");
        setIsLoading(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <button 
        onClick={handleClockIn} 
        disabled={isLoading}
        className={`px-8 py-4 rounded-full font-bold text-white text-lg transition shadow-lg 
          ${isLoading ? "bg-gray-400" : "bg-green-500 hover:bg-green-600 active:scale-95"}`}
      >
        {isLoading ? "Processing..." : "Clock In Now"}
      </button>

      {/* This paragraph displays your custom success or error messages! */}
      {statusMsg && (
        <p className={`font-semibold ${statusMsg.includes("Ika'y nakapag Clock In na!") ? "text-green-600" : "text-red-500"}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}