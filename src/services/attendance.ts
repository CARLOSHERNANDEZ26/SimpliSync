import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, orderBy, getDoc } from "firebase/firestore";
import { isWithinSmartZone } from "@/utils/geo";    
import { time } from "console";

export const clockInEmployee = async (userId: string, latitude: number, longitude: number) => {
  try {
    const isValidLocation = isWithinSmartZone(latitude, longitude);
    if (!isValidLocation) {
      throw new Error("Out_Of_Smart_Zone.");
    }
    
   
    const now = new Date();
    const targetTime = new Date();

    let targetHour = 8;
    let targetMinute = 0;

    try {
      const settingsSnap = await getDoc(doc(db, "settings", "company"));
      if (settingsSnap.exists() && settingsSnap.data().shiftStartTime) {
        const timeString = settingsSnap.data().shiftStartTime; 
        
        const [hourStr, minuteStr] = timeString.split(':');
        targetHour = parseInt(hourStr, 10);
        targetMinute = parseInt(minuteStr, 10);

      }
    } catch (e) {
      console.warn("Could not load company settings, defaulting to 8:00 AM", e);
    }

    targetTime.setHours(targetHour, targetMinute, 0, 0);

    let finalStatus = "On Time";

    if (now > targetTime) {
      const diffInMs = now.getTime() - targetTime.getTime();
      const diffInMins = Math.floor(diffInMs / (1000 * 60));
      
      if (diffInMins > 0) {
        finalStatus = `Late (${diffInMins}m)`;
      }
    }

    const attendanceRef = collection(db, "attendanceLogs"); 
    const docRef = await addDoc(attendanceRef, {
      userId,
      timeIn: serverTimestamp(),
      timeOut: null,
      lat: latitude,
      lng: longitude,
      status: finalStatus, 
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
    const q =  query(attendanceRef, where("userId", "==", userId), where("timeOut", "==", null)); 
    
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
    const shiftDocRef = doc(db, "attendanceLogs", activeShiftId); 
    console.log("Targeting document with ID:", activeShiftId);
     await updateDoc(shiftDocRef, {
      timeOut: serverTimestamp(),
      lat: latitude,
      lng: longitude,
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

export const fetchAllAttendanceLogs = async () => {
  try {
    const attendanceRef = collection(db, "attendanceLogs");

    const q = query(attendanceRef, orderBy("timeIn", "desc"));

    const querySnapshot = await getDocs(q);

    const logs: {
      id: string;
      userId: string;
      timeIn: Date | null;
      timeOut: Date | null;
      status: string;
      lat: number;
      lng: number;
    }[] = [];

    querySnapshot.forEach((document) => {
      const data = document.data();

      const formattedTimeIn = data.timeIn ? data.timeIn.toDate() : null;
      const formattedTimeOut = data.timeOut ? data.timeOut.toDate() : null;

      logs.push({
        id: document.id,
        userId: data.userId,
        timeIn: formattedTimeIn,
        timeOut: formattedTimeOut,
        status: data.status,
        lat: data.lat,
        lng: data.lng,
      });
    });

    console.log(`Successfully fetched ${logs.length} logs!`);
    return logs;

  } catch (error) {
    console.error("Error fetching logs:", error);
    throw new Error("Failed to fetch attendance records.");
  }

  
};

export const fetchUserAttendanceLogs = async (userId: string) => {
  try {
    const attendanceRef = collection(db, "attendanceLogs");

    const q = query(
      attendanceRef, 
      where("userId", "==", userId),
      orderBy("timeIn", "desc")
    );

    const querySnapshot = await getDocs(q);

    const logs: {
      id: string;
      userId: string;
      timeIn: Date | null;
      timeOut: Date | null;
      status: string;
      lat: number;
      lng: number;
    }[] = [];

    querySnapshot.forEach((document) => {
      const data = document.data();
      logs.push({
        id: document.id,
        userId: data.userId,
        timeIn: data.timeIn ? data.timeIn.toDate() : null,
        timeOut: data.timeOut ? data.timeOut.toDate() : null,
        status: data.status,
        lat: data.lat,
        lng: data.lng,
      });
    });

    return logs;

  } catch (error) {
    console.error("Error fetching user logs:", error);
    throw new Error("Failed to fetch your attendance records.");
  }
};