"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase"; 

interface AttendanceLog {
  id: string;
  userId: string;
  fullName: string; 
  role: string;     
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  lat?: number;
  lng?: number;
}

export default function AdminLogsTable() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe: () => void; 

    const loadData = () => {
      // 1. Live Listen to Users first
      const usersUnsub = onSnapshot(collection(db, "users"), (userSnap) => {
        const userDictionary: Record<string, { fullName: string, role: string }> = {};
        userSnap.forEach((doc) => {
          const userData = doc.data();
          userDictionary[doc.id] = {
            fullName: userData.fullName || "Unknown User",
            role: userData.role || "No Role Assigned"
          };
        });

        const q = query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc"));
        
        unsubscribe = onSnapshot(q, (snapshot) => { 
            const liveLogs: AttendanceLog[] = []; 
            
            snapshot.forEach((doc) => {
              const data = doc.data();
              const employeeProfile = userDictionary[data.userId] || { fullName: "Unknown User", role: "N/A" }; 

              liveLogs.push({
                id: doc.id,
                userId: data.userId,
                fullName: employeeProfile.fullName, 
                role: employeeProfile.role,         
                timeIn: data.timeIn ? data.timeIn.toDate() : null,
                timeOut: data.timeOut ? data.timeOut.toDate() : null,
                status: data.status,
                lat: data.lat,
                lng: data.lng,
              });
            });
            
            setLogs(liveLogs);
            setIsLoading(false);
          },
          (err) => {
            console.error("Error fetching live admin logs:", err);
            setError("Failed to load company attendance records.");
            setIsLoading(false);
          }
        );
      }); // <--- THIS WAS THE MISSING CLOSING FOR THE USERS LISTENER

      return usersUnsub;
    };

    const usersCleanup = loadData();

    return () => {
      if (unsubscribe) unsubscribe();
      if (usersCleanup) usersCleanup();
    };
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

  if (isLoading) return <div className="text-center p-12 text-teal-600 animate-pulse font-medium">Syncing cross-collection data...</div>;
  if (error) return <div className="text-center p-12 text-rose-500 font-medium">{error}</div>;

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert("No data to export!");
      return;
    }

    // Upgraded CSV Headers to include Name and Role!
    const headers = ["Date", "Employee Name", "Role", "Time In", "Time Out", "Duration", "Status", "Latitude", "Longitude", "System ID"];

    const csvRows = logs.map((log) => {
      const date = log.timeIn ? log.timeIn.toLocaleDateString() : "N/A";
      const timeIn = log.timeIn ? log.timeIn.toLocaleTimeString() : "--:--";
      const timeOut = log.timeOut ? log.timeOut.toLocaleTimeString() : "Working...";
      
      let duration = "Working...";
      if (log.timeIn && log.timeOut) {
        const diffMs = log.timeOut.getTime() - log.timeIn.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)); 
        duration = `${diffHrs}h ${diffMins}m`;
      }

      return `"${date}","${log.fullName}","${log.role}","${timeIn}","${timeOut}","${duration}","${log.status}","${log.lat || ''}","${log.lng || ''}","${log.userId}"`;
    });

    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date().toLocaleDateString().replace(/\//g, '-');
    link.setAttribute("download", `SimpliSync_Timesheet_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
  };

  return (
    <div className="w-full mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
      
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Company Attendance</h3>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-300 text-sm font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-white/5 dark:text-gray-300">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              {/* Changed Employee ID to Employee */}
              <th scope="col" className="px-6 py-4">Employee</th>
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
                  
                  {/* The newly designed Employee Cell! */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 dark:text-white">{log.fullName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.role}</span>
                    </div>
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
                      /^Late/.test(log.status) ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                      /^On Time/.test(log.status) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
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