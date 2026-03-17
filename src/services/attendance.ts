import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
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

export const clockOutEmployee = async (userId: string, latitude: number, longitude: number) => {
  try {
    const isValidLocation = isWithinSmartZone(latitude, longitude);
    if (!isValidLocation) {
      throw new Error("OUT_OF_BOUNDS");
    }
    const attendanceRef = collection(db, "attendanceLogs");
    
    // CHALLENGE 1: Create a query (q) that searches attendanceRef 'where' the "userId" is "==" to the userId variable.
    const q =  query(attendanceRef, where("userId", "==", userId)); // YOUR QUERY HERE
    
    const querySnapshot = await getDocs(q);
    console.log("Query returned documents:", querySnapshot.size);

    let activeShiftId = null;

    querySnapshot.forEach((document) => {
      const data = document.data();
      if (data.timeIn && !data.timeOut) {
        activeShiftId = document.id;
      }
    });

    if (!activeShiftId) {
      throw new Error("NO_ACTIVE_SHIFT");
    }

    // CHALLENGE 2: Target the specific document using doc()
    const shiftDocRef = doc(db, "attendanceLogs", activeShiftId); 
    console.log("Targeting document with ID:", activeShiftId);
    
// CHALLENGE 3: Use await updateDoc() to add a timeOut field set to serverTimestamp()
    // YOUR UPDATE LOGIC HERE
     await updateDoc(shiftDocRef, {
      timeOut: serverTimestamp(),
      lat: latitude,
      lng: longitude,
      status: "Completed",
    });

    

    console.log("Success! Clocked out of shift:", activeShiftId);
    return true;

  } catch (error) {
    if (error instanceof Error && error.message === "OUT_OF_BOUNDS") {
      throw new Error("You are outside the allowed area. Please move closer to the office to clock out.");
    }
    if (error instanceof Error && error.message === "NO_ACTIVE_SHIFT") {
      throw new Error("You don't have an active shift to clock out of!");
    }
    console.error("Database Error:", error);
    throw new Error("Failed to clock out. Please try again.");
  }
};