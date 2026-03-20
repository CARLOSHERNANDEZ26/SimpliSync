import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const updateUserProfile = async (uid: string, fullName: string, role: string) => {
  if (!uid) throw new Error("User ID is required");

  const userRef = doc(db, "users", uid);
  
  try {
    await setDoc(userRef, {
      fullName: fullName,
      role: role,
      isActive: true
    }, { merge: true }); 
    
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile.");
  }
};

export const getUserProfile = async (uid: string) => {
  if (!uid) return null;
  
  const userRef = doc(db, "users", uid); 
  const userSnap = await getDoc(userRef); 
  
  if (userSnap.exists()) {
    return userSnap.data();
  }
  return null;
};