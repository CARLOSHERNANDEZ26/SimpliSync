import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export const loginEmployee = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
   return userCredential.user; 
   
  } catch (error) {
    throw new Error("Invalido");
  }
};


