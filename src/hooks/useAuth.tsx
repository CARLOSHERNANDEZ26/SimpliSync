"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";

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
    let unsubscribeDb: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        
        const activeShiftQuery = query(
          collection(db, "attendanceLogs"),
          where("userId", "==", currentUser.uid),
          where("timeOut", "==", null) 
        );


        unsubscribeDb = onSnapshot(
          activeShiftQuery, 
          (snapshot) => {
            setIsClockedIn(!snapshot.empty); 
            setLoading(false);
          },
          (error) => { 
            if (error.code !== "permission-denied") {
            console.error("Auth Listener Error:", error);
            setIsClockedIn(false);
            setLoading(false);
            }
          }
        );

      } else {
        if (unsubscribeDb) {
          unsubscribeDb(); 
        }
        setIsClockedIn(false);
        setLoading(false);
      }
    });

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