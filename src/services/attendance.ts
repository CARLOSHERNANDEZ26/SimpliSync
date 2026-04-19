import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, orderBy, getDoc } from "firebase/firestore";
import { isWithinSmartZone } from "@/utils/geo";    

export const clockInEmployee = async (userId: string, latitude: number, longitude: number) => {
  try {
    // 1. Fetch Company Settings FIRST
    const settingsSnap = await getDoc(doc(db, "settings", "company"));
    const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;

    // 2. Set coordinates with fallbacks
    const officeLat = settingsData?.officeLat || 14.942155;
    const officeLng = settingsData?.officeLng || 120.217151;
    const allowedRadius = settingsData?.allowedRadius || 50;
    const shiftStartTime = settingsData?.shiftStartTime || "08:00";

    // 3. Perform the dynamic location check with ALL 5 arguments
    const isValidLocation = isWithinSmartZone(latitude, longitude, officeLat, officeLng, allowedRadius);
    
    if (!isValidLocation) {
      throw new Error("Out_Of_Smart_Zone.");
    }
    
    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const fullName = userData?.fullName || "Unknown Employee";
    const position = userData?.position || "N/A";

    const now = new Date();
    const targetTime = new Date();
    const [hourStr, minuteStr] = shiftStartTime.split(':');
    targetTime.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);
    
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
      fullName, 
      position,    
      timeIn: serverTimestamp(),
      timeOut: null,
      lat: latitude,
      lng: longitude,
      status: finalStatus, 
    });

     await updateDoc(doc(db, "users", userId), {
      workStatus: "Working"
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
    const settingsSnap = await getDoc(doc(db, "settings", "company"));
    const settingsData = settingsSnap.exists() ? settingsSnap.data() : null;
    
    const officeLat = settingsData?.officeLat || 14.942155;
    const officeLng = settingsData?.officeLng || 120.217151;
    const allowedRadius = settingsData?.allowedRadius || 50;

    const isValidLocation = isWithinSmartZone(latitude, longitude, officeLat, officeLng, allowedRadius);
    
    if (!isValidLocation) {
      throw new Error("OUT_OF_BOUNDS");
    }

    const userDoc = await getDoc(doc(db, "users", userId));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const fullName = userData?.fullName || "Unknown Employee";
    const position = userData?.position || "N/A";

    const attendanceRef = collection(db, "attendanceLogs");
    const q =  query(attendanceRef, where("userId", "==", userId), where("timeOut", "==", null)); 
    
    const querySnapshot = await getDocs(q);
    
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
    
    await updateDoc(shiftDocRef, { 
      timeOut: serverTimestamp(),
      lat: latitude,
      lng: longitude,
      fullName, 
      position,     
    });

    await updateDoc(doc(db, "users", userId), {
      workStatus: "Offline" 
    });

    return true;

  } catch (error) {
    if (error instanceof Error && error.message === "OUT_OF_BOUNDS") {
      throw new Error("You are outside the allowed area. Please move closer to the office to clock out.");
    }
    if (error instanceof Error && error.message === "NO_ACTIVE_SHIFT") {
      throw new Error("You don't have an active shift to clock out of!");
    }
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
    console.error("Error fetching attendance logs:", error);
    throw new Error("Failed to fetch attendance records.");
  }
};

export async function verifyLocationPing(userId: string, latitude: number, longitude: number) {  
  try{
    const settingsSnap = await getDoc(doc(db, "settings", "company")); 
    const settingsData = settingsSnap.exists() ? settingsSnap.data() : null; 
    
    const officeLat = settingsData?.officeLat || 14.942155; 
    const officeLng = settingsData?.officeLng || 120.217151;
    const allowedRadius = settingsData?.allowedRadius || 50;

    
    const isValidLocation = isWithinSmartZone(latitude, longitude, officeLat, officeLng, allowedRadius);
    
    await updateDoc(doc(db, "users", userId), {
      workStatus: isValidLocation ? "Working" : "Out of Bounds", 
      lastPing: serverTimestamp(),
    });
    
    return isValidLocation;
  }catch (error) {
    console.error("Ping Error:", error);
  }
}

export const resolveDanglingShift = async (
  shiftId: string,
  userId: string,
  manualTimeOut: Date,
  reason: string
) => {
  try {
    const shiftDocRef = doc(db, "attendanceLogs", shiftId);
    const userDocRef = doc(db, "users", userId);
    
    await updateDoc(shiftDocRef, {
      timeOut: manualTimeOut,
      status: "Pending HR Review",
      exceptionReason: reason,
      resolvedAt: serverTimestamp(),
    });

    await updateDoc(userDocRef, {
      workStatus: "Offline" 
    });

    return { success: true, message: "Shift resolved successfully." };
  } catch (error) {    
    console.error("Error resolving shift:", error);
    throw error;
  }
}

export const fetchUserAttendanceLogs = async (userId: string) => {
  try {
    const attendanceRef = collection(db, "attendanceLogs");
    const q = query(attendanceRef, where("userId", "==", userId), orderBy("timeIn", "desc"));
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
    console.error("Error fetching user attendance logs:", error);
    throw new Error("Failed to fetch your attendance records.");
  }
};

export const adminForceClockOut = async (userId: string, shiftId: string) => {
  try {
    const shiftDocRef = doc(db, "attendanceLogs", shiftId);
    
    await updateDoc(shiftDocRef, {
      timeOut: serverTimestamp(),
      status: "Force Clocked Out (Admin)",
    });

    await updateDoc(doc(db, "users", userId), {
      workStatus: "Offline" 
    });

    return { success: true, message: "Employee forcefully clocked out." };
  } catch (error) {
    console.error("Admin Override Error:", error);
    throw new Error("Failed to execute Admin Override.");
  }
};