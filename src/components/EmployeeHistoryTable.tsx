"use client";

import { useState, useEffect } from "react";
import { fetchUserAttendanceLogs } from "@/services/attendance";
import { useAuth } from "@/hooks/useAuth";

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
    const loadData = async () => {
      if (!user) return; // Safety check
      
      try {
        const data = await fetchUserAttendanceLogs(user.uid);
        setLogs(data); 
      } catch (err) { 
        setError("Failed to load your attendance history."); 
        console.error(err);
      } finally { 
        setIsLoading(false);
      }
    };

    loadData(); 
  }, [user]); 

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
    if (diffHrs === 0) return `${diffMins}m`;
    return `${diffHrs}h ${diffMins}m`;
  };

  if (isLoading) return <div className="text-center p-8 text-teal-600 animate-pulse">Loading your history...</div>;
  if (error) return <div className="text-center p-8 text-rose-500">{error}</div>;

  return (
    <div className="w-full mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Timesheet</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-white/5 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Time In</th>
              <th scope="col" className="px-6 py-4">Time Out</th>
              <th scope="col" className="px-6 py-4">Duration</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? ( 
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No shifts recorded yet.</td>
              </tr>
            ) : (
              logs.map((log) => ( 
                <tr key={log.id} className="border-b dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"> 
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap"> 
                    {formatDate(log.timeIn)}
                  </td>
                  <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                    {formatTime(log.timeIn)}
                  </td>
                  <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-medium whitespace-nowrap">
                    {formatTime(log.timeOut)}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
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