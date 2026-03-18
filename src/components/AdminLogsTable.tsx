"use client";

import { useState, useEffect } from "react";
import { fetchAllAttendanceLogs } from "@/services/attendance";

interface AttendanceLog {
  id: string;
  userId: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
}

export default function AdminLogsTable() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchAllAttendanceLogs();
        setLogs(data);
      } catch (err) {
        setError("Failed to load attendance records.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--"; 
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDuration = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return "Working...";
    
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs === 0) return `${diffMins}m`;
    return `${diffHrs}h ${diffMins}m`;
  };

  // 4. Loading & Error States
  if (isLoading) return <div className="text-center p-12 text-teal-600 animate-pulse font-medium">Loading HR data...</div>;
  if (error) return <div className="text-center p-12 text-rose-500 font-medium">{error}</div>;

  // 5. The Main UI Table
  return (
    <div className="w-full mt-8 overflow-hidden bg-white dark:bg-black/40 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        <span className="bg-teal-100 text-teal-800 text-xs font-bold px-3 py-1 rounded-full dark:bg-teal-900/50 dark:text-teal-400">
          {logs.length} Records
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-white/5 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Employee ID</th>
              <th scope="col" className="px-6 py-4">Time In</th>
              <th scope="col" className="px-6 py-4">Time Out</th>
              <th scope="col" className="px-6 py-4">Duration</th>
              <th scope="col" className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No attendance records found in the database.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {formatDate(log.timeIn)}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                    {log.userId}
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
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${
                      log.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                      log.status === 'Valid' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {log.status}
                    </span>
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