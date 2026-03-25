"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

interface AttendanceLog {
  id: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
}

export default function EmployeeHistoryTable() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return; 

    const q = query(
      collection(db, "attendanceLogs"),
      where("userId", "==", user.uid),
      orderBy("timeIn", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveLogs: AttendanceLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          liveLogs.push({
            id: doc.id,
            // Safety check for .toDate() during optimistic updates
            timeIn: data.timeIn?.toDate ? data.timeIn.toDate() : null,
            timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
            status: data.status || "N/A",
          });
        });
        
        setLogs(liveLogs);
        setIsLoading(false);
      },
      (err) => {
        console.error("Firebase Listener Error:", err);
        setError("Unable to sync your history. Check your connection.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--"; 
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const calculateDuration = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return "Working...";
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHrs === 0 ? `${diffMins}m` : `${diffHrs}h ${diffMins}m`;
  };

  // Helper function to style the badges
  const getStatusStyles = (status: string) => {
    if (/^Late/.test(status)) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
    if (/^On Time/.test(status)) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (status === 'Valid' || status === 'Completed') return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  if (isLoading) return <div className="text-center p-8 text-teal-600 animate-pulse font-medium">Syncing your records...</div>;
  if (error) return <div className="text-center p-8 text-rose-500 font-medium">{error}</div>;

  return (
    <div className="w-full mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden transition-all">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Attendance Logs</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-white/5 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4">Time In</th>
              <th scope="col" className="px-6 py-4">Time Out</th>
              <th scope="col" className="px-6 py-4">Duration</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">No attendance records found.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {formatDate(log.timeIn)}
                  </td>
                  
                  {/* Status Badge Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${getStatusStyles(log.status)}`}>
                      {log.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                    {formatTime(log.timeIn)}
                  </td>
                  <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-bold whitespace-nowrap">
                    {formatTime(log.timeOut)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {calculateDuration(log.timeIn, log.timeOut)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}