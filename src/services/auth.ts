import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export const loginEmployee = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
   return userCredential.user; // Return the user object on successful login
   

    
  } catch (error) {
    const firebaseError = error as { code: string };
    console.error("Internal auth error:", firebaseError.code);
    throw new Error("Invalido");
  }
};