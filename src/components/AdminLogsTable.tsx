"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import { adminForceClockOut } from "@/services/attendance";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { Trash2, Search, Calendar, Edit, X, Save, ShieldCheck, ShieldAlert } from "lucide-react";

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
  earlyOutReason?: string;
  lateReason?: string;
  isLateExcused?: boolean;
}

export default function AdminLogsTable() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isForceOutModalOpen, setIsForceOutModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isForceOutLoading, setIsForceOutLoading] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTimeOut, setEditTimeOut] = useState("");
  const [editReason, setEditReason] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const [year, month] = selectedMonth.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const logsRef = collection(db, "attendanceLogs");
    const q = query(logsRef, orderBy("timeIn", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs: AttendanceLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const timeInDate = data.timeIn?.toDate ? data.timeIn.toDate() : null;
          
          if (timeInDate && timeInDate >= startOfMonth && timeInDate <= endOfMonth) {
            fetchedLogs.push({
              id: doc.id,
              userId: data.userId,
              fullName: data.fullName || "Unknown",
              role: data.role || "N/A",
              timeIn: timeInDate,
              timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
              status: data.status || "N/A",
              earlyOutReason: data.earlyOutReason,
              lateReason: data.lateReason,
              isLateExcused: data.isLateExcused || false,
            });
          }
        });
        setLogs(fetchedLogs);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error fetching logs:", err);
        setError("Failed to load logs.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedMonth]);

  const confirmDeleteLog = async (logId: string) => {
    if (window.confirm("Are you sure you want to permanently delete this log? This cannot be undone.")) {
      try {
        await deleteDoc(doc(db, "attendanceLogs", logId));
        toast.success("Log deleted successfully.");
      } catch (err) {
        console.error("Delete Error:", err);
        toast.error("Failed to delete log.");
      }
    }
  };

  const executeForceClockOut = async () => {
    if (!selectedLog) return;
    setIsForceOutLoading(true);
    try {
      await adminForceClockOut(selectedLog.userId, selectedLog.id);
      toast.success(`${selectedLog.fullName} forcefully clocked out.`);
      setIsForceOutModalOpen(false);
      setSelectedLog(null);
    } catch (err) {
      console.error("Force Out Error:", err);
      toast.error("Failed to force clock out.");
    } finally {
      setIsForceOutLoading(false);
    }
  };

  const openEditModal = (log: AttendanceLog) => {
    setSelectedLog(log);
    const targetDate = log.timeOut || new Date();
    const tzOffset = targetDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(targetDate.getTime() - tzOffset).toISOString().slice(0, 16);
    
    setEditTimeOut(localISOTime);
    setEditReason(log.earlyOutReason || "Admin Resolution: Power Outage");
    setIsEditModalOpen(true);
  };

  const handleSaveManualEdit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedLog || !editTimeOut) return;
    
    setIsSavingEdit(true);
    try {
      const manualTimeOutDate = new Date(editTimeOut);
      const logRef = doc(db, "attendanceLogs", selectedLog.id);
      
      await updateDoc(logRef, {
        timeOut: manualTimeOutDate,
        earlyOutReason: editReason,
        status: "Admin Resolved",
      });

      await updateDoc(doc(db, "users", selectedLog.userId), {
        workStatus: "Offline"
      });

      toast.success("Shift manually resolved!");
      setIsEditModalOpen(false);
      setSelectedLog(null);
    } catch (err) {
      console.error("Edit Save Error:", err);
      toast.error("Failed to apply manual edit.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Toggle Lateness Excuse
  const toggleLateExcuse = async (logId: string, currentlyExcused: boolean | undefined) => {
    try {
      await updateDoc(doc(db, "attendanceLogs", logId), {
        isLateExcused: !currentlyExcused
      });
      toast.success(!currentlyExcused ? "Lateness Officially Excused!" : "Penalty Reinstated.");
    } catch (error) {
      console.error("Error toggling late excuse:", error);
      toast.error("Failed to update excuse status.");
    }
  };

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---";
  const formatDate = (date: Date | null) => date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "---";

  const filteredLogs = logs.filter(log => log.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="text-center py-10 animate-pulse text-emerald-600 font-medium">Loading organization logs...</div>;
  if (error) return <div className="text-center py-10 text-rose-500">{error}</div>;

  return (
    <div className="w-full mt-8 bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      
      <div className="px-6 py-6 border-b border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Company Attendance Logs</h3>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input 
               type="month" 
               value={selectedMonth} 
               onChange={(e) => setSelectedMonth(e.target.value)} 
               className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-sm pl-10 pr-4 py-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer" 
             />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">In / Out</th>
              <th className="px-6 py-4 text-center">Admin Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 dark:text-white">{log.fullName}</div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${log.status.includes('Late') ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{formatDate(log.timeIn)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">IN: {formatTime(log.timeIn)}</span>
                    
                    {/* Late Reason Display */}
                    {log.lateReason && (
                      <span className="text-[9px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-500/20 uppercase tracking-widest mt-1 w-fit">
                        Late Reason: {log.lateReason}
                      </span>
                    )}

                    <div className="flex flex-col mt-1">
                      <span className={log.timeOut ? "text-rose-600 dark:text-rose-400" : "text-amber-500 animate-pulse"}>
                        OUT: {log.timeOut ? formatTime(log.timeOut) : "WORKING..."}
                      </span>
                      {log.earlyOutReason && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 uppercase tracking-widest mt-1 w-fit">
                          {log.earlyOutReason}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center gap-2">
                    
                    {/* Excuse Late Button */}
                    {log.lateReason && (
                      <button 
                        type="button"
                        onClick={() => toggleLateExcuse(log.id, log.isLateExcused)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border ${log.isLateExcused ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {log.isLateExcused ? <><ShieldCheck className="w-3 h-3"/> Excused</> : <><ShieldAlert className="w-3 h-3"/> Forgive Late</>}
                      </button>
                    )}

                    <button 
                      type="button"
                      onClick={() => openEditModal(log)}
                      className="text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-amber-200 dark:border-amber-500/30"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>

                    {!log.timeOut && (
                      <button 
                      type="button"
                      onClick={() => { setSelectedLog(log); setIsForceOutModalOpen(true); }}
                      className="text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-md shadow-rose-500/20 active:scale-95"
                      >
                        Force Out
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={() => confirmDeleteLog(log.id)} 
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all active:scale-90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-20 text-gray-500 italic">No attendance records found for this period.</div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isForceOutModalOpen}
        onClose={() => { setIsForceOutModalOpen(false); setSelectedLog(null); }}
        onConfirm={executeForceClockOut}
        title="Force Clock Out"
        message={`Are you sure you want to end the active shift for ${selectedLog?.fullName}? This action cannot be undone and will mark their status as "Force Clocked Out (Admin)".`}
        confirmText={isForceOutLoading ? "Processing..." : "Yes, Force Clock Out"}
      />

      {isEditModalOpen && selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
          <form onSubmit={handleSaveManualEdit} className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 bg-amber-50 dark:bg-amber-500/10">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                <Edit className="w-5 h-5" /> Manual Shift Edit
              </h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You are manually editing the Time Out record for <strong>{selectedLog.fullName}</strong>.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Correct Time Out</label>
                <input 
                  type="datetime-local" 
                  value={editTimeOut}
                  onChange={(e) => setEditTimeOut(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Resolution Note (Required)</label>
                <input 
                  type="text" 
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., Admin Resolution: Power Outage"
                  required
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button 
                type="submit"
                disabled={isSavingEdit || !editTimeOut || !editReason}
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50 active:scale-95"
              >
                {isSavingEdit ? "Saving..." : <><Save className="w-4 h-4" /> Save Record</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}