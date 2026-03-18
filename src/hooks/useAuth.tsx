"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore"; // Added onSnapshot!

// 1. Tell TypeScript exactly what powers this context has
interface AuthContextType {
  user: User | null;
  isClockedIn: boolean; 
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isClockedIn: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Create an empty variable to hold our database listener
    let unsubscribeDb: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // IF LOGGED IN: Build the query
        const activeShiftQuery = query(
          collection(db, "attendanceLogs"),
          where("userId", "==", currentUser.uid),
          where("status", "==", "Valid")
        );

        // Save the listener to our variable
        unsubscribeDb = onSnapshot(
          activeShiftQuery, 
          (snapshot) => {
            setIsClockedIn(!snapshot.empty); 
            setLoading(false);
          },
          () => { 
            // Only log if we are actually trying to listen securely
            setIsClockedIn(false);
            setLoading(false);
          }
        );

      } else {
        // 2. IF LOGGED OUT: Instantly kill the database listener so it stops asking for data!
        if (unsubscribeDb) {
          unsubscribeDb(); 
        }
        
        // Reset everything else
        setIsClockedIn(false);
        setLoading(false);
      }
    });

    // 3. Cleanup everything when the app closes
    return () => {
      unsubscribeAuth();
      if (unsubscribeDb) {
        unsubscribeDb();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isClockedIn, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);