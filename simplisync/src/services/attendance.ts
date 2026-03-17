import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { isWithinSmartZone } from "@/utils/geo";    


export const clockInEmployee = async (userId: string, latitude: number, longitude: number) => {
  try {
    const isValidLocation = isWithinSmartZone(latitude, longitude);
    if (!isValidLocation) {
      throw new Error("Out_Of_Smart_Zone.");
    }


    // YOUR MISSION GOES HERE:
    // 1. Define the collection you want to target (Hint: use the 'collection' function)
    // 2. Use 'addDoc' to create a new record.
    // 3. The record must contain: userId, timeIn, lat, lng, and a default status of "Pending".
    // 4. For timeIn, you MUST use the imported 'serverTimestamp()' function.

    // Return true if it succeeds!
    const attendanceRef = collection(db, "attendanceLogs"); 

    const docRef = await addDoc(attendanceRef, {
      userId,
      timeIn: serverTimestamp(),
      lat: latitude,
      lng: longitude,
      status: "Valid",
    });
    
    console.log("Attendance record created with ID:", docRef.id);
    return true;

  } catch (error) {
    if (error instanceof Error && error.message === "Out_Of_Smart_Zone.") {
        throw new Error("You are outside the allowed area. Please move closer to the office to clock in.");      
    }       
    console.error("Database Error:", error);
    throw new Error("Failed to clock in. Please try again.");       
  }
};