"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, where } from "firebase/firestore"; // Added getDocs
import { db } from "@/lib/firebase"; 
import toast from "react-hot-toast";

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
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
     

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });


 useEffect(() => {
    let unsubscribeLogs: () => void;
    let isMounted = true; 

    const loadData = async () => {
      if (!user) return; 

      try {
        const userSnap = await getDocs(collection(db, "users"));
        const userDictionary: Record<string, { fullName: string, role: string }> = {};
        
        userSnap.forEach((doc) => {
          const userData = doc.data();
          userDictionary[doc.id] = {
            fullName: userData.fullName || "Unknown User",
            role: userData.role || "No Role Assigned"
          };
        });

        const [year, month] = selectedMonth.split('-');
        const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0);
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

        const q = query(
          collection(db, "attendanceLogs"),
          where("timeIn", ">=", startOfMonth),
          where("timeIn", "<=", endOfMonth),
          orderBy("timeIn", "desc")
        );
        
        unsubscribeLogs = onSnapshot(q, (snapshot) => { 
          if (!isMounted || !user) return; // 2. DON'T UPDATE STATE IF LOGGED OUT

          const liveLogs: AttendanceLog[] = []; 
          snapshot.forEach((doc) => {
            const data = doc.data();
            const employeeProfile = userDictionary[data.userId] || { fullName: "Unknown User", role: "N/A" }; 

            liveLogs.push({
              id: doc.id,
              userId: data.userId,
              fullName: employeeProfile.fullName, 
              role: employeeProfile.role,         
              timeIn: data.timeIn?.toDate ? data.timeIn.toDate() : null,
              timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
              status: data.status,
              lat: data.lat,
              lng: data.lng,
            });
          });
          
          setLogs(liveLogs);
          setIsLoading(false);
        },
        (err) => {
          // 3. SILENCE THE LOGOUT NOISE
          // Only show error if it's NOT a permission error during logout
          if (err.code !== "permission-denied") {
             console.error("Error fetching live admin logs:", err);
             if (isMounted) setError("Failed to load records.");
          }
        });

      } catch (err) {
        console.error("Error during initial data load:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => { 
      isMounted = false; 
      if (unsubscribeLogs) unsubscribeLogs(); 
    };
  }, [selectedMonth, user]); 

  const handleDeleteLog = async (logId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this attendance record? This cannot be undone.");
    if (!isConfirmed) return;

    try {
      await deleteDoc(doc(db, "attendanceLogs", logId)); 
      toast.success("Record permanently deleted.");
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Failed to delete the record.");
    }
  };

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
    if (filteredLogs.length === 0) {
      alert("No data to export!");
      return;
    }

    const escapeCSV = (str: string) => {
      return `"${str.replace(/"/g, '""')}"`; 
    };

    const headers = ["Date", "Employee Name", "Role", "Time In", "Time Out", "Duration", "Status", "Latitude", "Longitude", "System ID"];

    const csvRows = filteredLogs.map((log) => {
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

      // Using the escape helper for strings that might have user input
      return `${escapeCSV(date)},${escapeCSV(log.fullName)},${escapeCSV(log.role)},${escapeCSV(timeIn)},${escapeCSV(timeOut)},${escapeCSV(duration)},${escapeCSV(log.status)},${escapeCSV((log.lat || '').toString())},${escapeCSV((log.lng || '').toString())},${escapeCSV(log.userId)}`;
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

  const filteredLogs = logs.filter((log) => 
    log.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const searchTotalMs = filteredLogs.reduce((total, log) => {
    if (log.timeIn && log.timeOut) {
      return total + (log.timeOut.getTime() - log.timeIn.getTime());
    }
    return total;
  }, 0); 

  const displayHours = (searchTotalMs / (1000 * 60 * 60)).toFixed(1);

return (
    <div className="w-full mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
      {/* SECTION 1: HEADER (Title & Controls) */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Live Company Attendance</h3>
        
        <div className="flex items-center gap-3">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-teal-500 dark:focus:border-teal-500 transition-colors"
          />

          <div className="relative group flex-1 w-full md:max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all"
          />
        </div>

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
      </div>

      {/* SECTION 2: SUMMARY BAR (Now outside the header) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
        <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Monthly Logs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{filteredLogs.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Man-Hours</p>
          <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-1">{displayHours}h</p>
        </div>
      </div>
      
      <div className="w-full px-4 md:px-0">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 block md:table">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-white/5 dark:text-gray-300 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Employee</th>
              <th scope="col" className="px-6 py-4">Time In</th>
              <th scope="col" className="px-6 py-4">Time Out</th>
              <th scope="col" className="px-6 py-4">Duration</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="block md:table-row-group">
            {filteredLogs.length === 0 ? (
              <tr className="block md:table-row">
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 block md:table-cell">No attendance records found in the database.</td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="block md:table-row border border-gray-100 dark:border-white/5 md:border-x-0 md:border-t-0 md:border-b hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mb-4 md:mb-0 bg-white dark:bg-white/5 md:bg-transparent rounded-2xl md:rounded-none p-4 md:p-0 shadow-sm md:shadow-none relative">
                  <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-2 md:py-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 md:border-none">
                    <span className="md:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Date</span>
                    <span>{formatDate(log.timeIn)}</span>
                  </td>
                  
                  <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 border-b border-gray-100 dark:border-white/5 md:border-none">
                    <span className="md:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Employee</span>
                    <div className="flex flex-col text-right md:text-left">
                      <span className="font-semibold text-gray-900 dark:text-white leading-tight">{log.fullName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.role}</span>
                    </div>
                  </td>

                  <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-2 md:py-4 border-b border-gray-100 dark:border-white/5 md:border-none">
                    <span className="md:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Time In</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{formatTime(log.timeIn)}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-2 md:py-4 border-b border-gray-100 dark:border-white/5 md:border-none">
                    <span className="md:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Time Out</span>
                    <span className="text-rose-600 dark:text-rose-400 font-semibold">{formatTime(log.timeOut)}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-2 md:py-4 border-b border-gray-100 dark:border-white/5 md:border-none">
                    <span className="md:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Duration</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{calculateDuration(log.timeIn, log.timeOut)}</span>
                  </td>
                  <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-3 md:py-4 border-b border-gray-100 dark:border-white/5 md:border-none">
                    <span className="md:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Status</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${
                      /^Late/.test(log.status) ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                      /^On Time/.test(log.status) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                      log.status === 'Completed' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400' :
                      log.status === 'Valid' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {log.status}
                    </span>
                  </td>

                  <td className="flex justify-between items-center md:table-cell px-2 md:px-6 py-2 md:py-4 text-right">
                    <span className="md:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Actions</span>
                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="text-gray-400 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 active:scale-95"
                      title="Delete this record"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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