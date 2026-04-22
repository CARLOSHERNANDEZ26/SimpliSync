"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase"; 
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { verifyLocationPing } from "@/services/attendance"; 

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

  useEffect(() => {
    let pingInterval: NodeJS.Timeout;

    if (user && isClockedIn) {
      const sendPing = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              verifyLocationPing(user.uid, position.coords.latitude, position.coords.longitude);
            },
            (error) => console.error("Heartbeat GPS failed:", error),
            { enableHighAccuracy: true }
          );
        }
      };

      sendPing();

      pingInterval = setInterval(sendPing, 60000);
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [user, isClockedIn]); 

  return (
    <AuthContext.Provider value={{ user, isClockedIn, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);