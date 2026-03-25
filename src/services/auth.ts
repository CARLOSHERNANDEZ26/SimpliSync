import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { serverTimestamp, doc, setDoc } from "firebase/firestore";

export const loginEmployee = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
   return userCredential.user; 
   
  } catch (error) {
    console.error("Login error:", error);
    throw new Error("Invalido");
  }
};

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseConfig, db } from "../lib/firebase";

// Inside auth.ts
// Add the 'role' parameter to the end of the list
export const addEmployee = async (fullName: string, position: string, department: string, joinDate: string, birthDate: string, password: string, role: string) => {
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
      role: role, // 🔥 Now it dynamically saves whatever the Admin selected!
      createdAt: serverTimestamp()
    });
    
    await secondaryAuth.signOut();
  } catch (error) {
    console.error("Error creating employee:", error);
    throw new Error("Failed to create employee.");
  }
};


