import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc, setDoc } from "firebase/firestore";

export const loginEmployee = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
   return userCredential.user; 
   
  } catch (error) {
    throw new Error("Invalido");
  }
};

import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseConfig, db } from "../lib/firebase";

export const addEmployee = async (name: string, position: string, department: string, joinDate: string, birthDate: string, password: string) => {
  const email = `${name.replace(/\s+/g, '').toLowerCase()}@simplisync.local`;
  
  // Use a secondary auth instance to prevent signing out the current Admin
  const secondaryApp = initializeApp(firebaseConfig, `SecondaryApp-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  
  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    await setDoc(doc(db, "users", userCredential.user.uid), {
      uid: userCredential.user.uid,
      name,
      email,
      position,
      department,
      joinDate,
      birthDate,
      status: "active",
      role: "employee",
      createdAt: serverTimestamp()
    });
    
    await secondaryAuth.signOut();
  } catch (error) {
    console.error("Error creating employee:", error);
    throw new Error("Failed to create employee.");
  }
};


