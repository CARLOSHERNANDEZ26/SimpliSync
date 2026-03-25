import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// 🔥 FIX: Changed 'role' to 'position' so we don't overwrite security access
export const updateUserProfile = async (uid: string, fullName: string, position: string) => {
  if (!uid) throw new Error("User ID is required");

  const userRef = doc(db, "users", uid);
  
  try {
    await setDoc(userRef, {
      fullName: fullName,
      position: position, // Save it as their job title
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