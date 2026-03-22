"use client";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import ClockInButton from "@/components/ClockInButton";
import ClockOutButton from "@/components/ClockOutButton";
import AdminLogsTable from "@/components/AdminLogsTable";
import EmployeeHistoryTable from "@/components/EmployeeHistoryTable";
import HRChatbot from "@/components/HRChatbot"; // Import the chatbot

interface AttendanceLog {
  id: string;
  userId: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  fullName?: string;
  role?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]); // Define logs here!
  const isAdmin = user?.email === "admin@simplisync.local";

  useEffect(() => {
    if (!user?.uid) return;

    const baseQuery = isAdmin 
      ? query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc"), limit(50)) 
      : query(collection(db, "attendanceLogs"), where("userId", "==", user.uid), orderBy("timeIn", "desc"), limit(30)); 

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          timeIn: data.timeIn?.toDate ? data.timeIn.toDate() : null,
          timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
          status: data.status || "N/A",
          fullName: data.fullName,  
          role: data.role,       
        } as AttendanceLog;
      });
      
      setLogs(fetchedLogs);
    });

    return () => unsubscribe();
  }, [user?.uid, isAdmin]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left Column: Actions */}
            <div className="w-full lg:w-1/3 space-y-8">
              <h2 className="text-4xl font-bold">Welcome, {user?.email?.split('@')[0]}</h2>
              <div className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl">
                <ClockInButton />
                <div className="my-6 h-px bg-gray-200 dark:bg-white/10"></div>
                <ClockOutButton />
              </div>
            </div>

            {/* Right Column: Tables */}
            <div className="w-full lg:w-2/3">
              {isAdmin ? <AdminLogsTable /> : <EmployeeHistoryTable />}
            </div>

          </div>
        </div>

        {/* NOW 'logs' IS DEFINED AND ACCESSIBLE HERE! */}
        <HRChatbot logs={logs} />
        
      </main>
    </ProtectedRoute>
  );
}