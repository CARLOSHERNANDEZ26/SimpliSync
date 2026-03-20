"use client";

import { useState, useEffect } from "react";
import { fetchAllAttendanceLogs } from "@/services/attendance";

interface AttendanceLog {
  id: string;
  userId: string;
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

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert("No data to export!");
      return;
    }

    // 1. Create the CSV Headers
    const headers = ["Date", "Employee ID", "Time In", "Time Out", "Duration", "Status", "Latitude", "Longitude"];

    // 2. Loop through the logs and format each row
    const csvRows = logs.map((log) => {
      // Safely format the data so it doesn't break if someone forgot to clock out
      const date = log.timeIn ? log.timeIn.toLocaleDateString() : "N/A";
      const timeIn = log.timeIn ? log.timeIn.toLocaleTimeString() : "--:--";
      const timeOut = log.timeOut ? log.timeOut.toLocaleTimeString() : "Working...";
      
      // Calculate duration for the spreadsheet
      let duration = "Working...";
      if (log.timeIn && log.timeOut) {
        const diffMs = log.timeOut.getTime() - log.timeIn.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        duration = `${diffHrs}h ${diffMins}m`;
      }

      // Return the row as an array of strings, wrapping in quotes to prevent comma errors
      return `"${date}","${log.userId}","${timeIn}","${timeOut}","${duration}","${log.status}","${log.lat || ''}","${log.lng || ''}"`;
    });

    // 3. Combine headers and rows with line breaks (\n)
    const csvString = [headers.join(","), ...csvRows].join("\n");

    // 4. Create a hidden download link and click it programmatically
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Name the file dynamically based on today's date
    const today = new Date().toLocaleDateString().replace(/\//g, '-');
    link.setAttribute("download", `SimpliSync_Timesheet_${today}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Clean up after download
  };

  // 5. The Main UI Table
  return (
    <div className="w-full bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
      
      {/* Table Header & Export Button */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Company Attendance Logs</h3>
        
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