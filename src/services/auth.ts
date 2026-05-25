import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from "firebase/auth";
import { serverTimestamp, doc, setDoc } from "firebase/firestore";
import { firebaseConfig, db, auth } from "../lib/firebase";

// ✅ Login Employee Function
export const loginEmployee = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: unknown) {
    console.error("Login Error:", error);
    throw error; 
  }
};

// ✅ Add Employee Function (With Leave Credits Initialized)
export const addEmployee = async (
  fullName: string, 
  position: string, 
  department: string, 
  joinDate: string, 
  birthDate: string, 
  password: string, 
  role: string, 
  scheduleDays: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], 
  scheduleHours: { start: string; end: string } = { start: "09:00", end: "17:00" }
) => {
  const email = `${fullName.replace(/\s+/g, '').toLowerCase()}@simplisync.local`;
  
  const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });
    
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      fullName,
      email,
      position,
      department,
      joinDate,
      birthDate,
      status: "active",
      role: role, 
      scheduleDays,
      scheduleHours,
      vlCredits: 15,  
      slCredits: 15,  
      silCredits: 5,  
      
      createdAt: serverTimestamp()
    });
    
    await secondaryAuth.signOut();
  } catch (error) {
    console.error("Error creating employee:", error);
    throw new Error("Failed to create employee.");
  }
};