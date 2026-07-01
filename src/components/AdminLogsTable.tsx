"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { adminForceClockOut } from "@/services/attendance";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { Search, Calendar, Edit, X, Save, ShieldAlert, ChevronLeft, ChevronRight, Layers } from "lucide-react";

interface AttendanceLog {
  id: string;
  userId: string;
  fullName: string;
  role: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  earlyOutReason?: string;
  lateReason?: string;
  isLateExcused?: boolean;
}

export default function AdminLogsTable() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [cutoff, setCutoff] = useState<"1" | "2">(() => {
    const day = new Date().getDate();
    return (day >= 11 && day <= 25) ? "2" : "1";
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;
  const [isForceOutModalOpen, setIsForceOutModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isForceOutLoading, setIsForceOutLoading] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTimeIn, setEditTimeIn] = useState("");
  const [editTimeOut, setEditTimeOut] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editExcuseLate, setEditExcuseLate] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Reset to first page if filters or keyword contexts shift
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, cutoff, searchTerm]);

  useEffect(() => {
    const [year, month] = selectedMonth.split('-').map(Number);

    let startDate: Date;
    let endDate: Date;

    if (cutoff === "1") {
      startDate = new Date(year, month - 2, 26, 0, 0, 0);
      endDate = new Date(year, month - 1, 10, 23, 59, 59, 999);
    } else {
      startDate = new Date(year, month - 1, 11, 0, 0, 0);
      endDate = new Date(year, month - 1, 25, 23, 59, 59, 999);
    }

    const logsRef = collection(db, "attendanceLogs");
    const q = query(logsRef, orderBy("timeIn", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedLogs: AttendanceLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const timeInDate = data.timeIn?.toDate ? data.timeIn.toDate() : null;

          if (timeInDate && timeInDate >= startDate && timeInDate <= endDate) {
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
  }, [selectedMonth, cutoff]);

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

    // Formatting local ISO strings securely to populate the HTML5 datetime-local inputs
    const formatForInput = (dateObj: Date | null) => {
      if (!dateObj) return "";
      const tzOffset = dateObj.getTimezoneOffset() * 60000;
      return new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
    };

    setEditTimeIn(formatForInput(log.timeIn));
    setEditTimeOut(formatForInput(log.timeOut || new Date()));
    setEditReason(log.earlyOutReason || "Admin Resolution: Corrected System Log");
    setEditExcuseLate(log.isLateExcused || false);
    setIsEditModalOpen(true);
  };

  const handleSaveManualEdit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!selectedLog || !editTimeIn || !editTimeOut) return;

    setIsSavingEdit(true);
    try {
      const manualTimeInDate = new Date(editTimeIn);
      const manualTimeOutDate = new Date(editTimeOut);
      const logRef = doc(db, "attendanceLogs", selectedLog.id);

      let newStatus = selectedLog.status;
      if (editExcuseLate && newStatus.toLowerCase().includes("late")) {
        newStatus = "Admin Resolved";
      }

      await updateDoc(logRef, {
        timeIn: manualTimeInDate,
        timeOut: manualTimeOutDate,
        earlyOutReason: editReason,
        isLateExcused: editExcuseLate,
        status: newStatus,
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

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---";
  const formatDate = (date: Date | null) => date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "---";

  const getStatusStyle = (status: string, isLateExcused = false) => {
    const s = isLateExcused ? "admin resolved" : status.toLowerCase();
    if (s.includes("pending") || s.includes("working") || s.includes("ongoing")) {
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30";
    }
    if (s.includes("late") || s.includes("absent") || s.includes("out of bounds")) {
      return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30";
    }
    if (s.includes("resolved") || s.includes("present") || s.includes("on time") || s.includes("approved") || s.includes("force")) {
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30";
    }
    return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400 border border-gray-200 dark:border-white/20";
  };

  const filteredLogs = logs.filter(log => log.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(filteredLogs.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const paginatedLogs = filteredLogs.slice(indexOfFirstRow, indexOfLastRow);

  if (isLoading) return <div className="text-center py-10 animate-pulse text-emerald-600 font-medium">Loading organization logs...</div>;
  if (error) return <div className="text-center py-10 text-rose-500">{error}</div>;

  return (
    <div className="w-full bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden">

      <div className="px-6 py-6 border-b border-gray-200 dark:border-white/10 flex flex-col xl:flex-row justify-between items-center gap-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Attendance Logs</h3>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div className="relative shrink-0">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-sm pl-10 pr-4 py-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            />
          </div>

          <div className="relative shrink-0">
            <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={cutoff}
              onChange={(e) => setCutoff(e.target.value as "1" | "2")}
              className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-sm pl-10 pr-8 py-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer appearance-none"
            >
              <option value="1">1st Cutoff (26-10)</option>
              <option value="2">2nd Cutoff (11-25)</option>
            </select>
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
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 dark:text-white">{log.fullName}</div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(log.status, log.isLateExcused)}`}>
                    {log.isLateExcused ? "Admin Resolved" : log.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{formatDate(log.timeIn)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">IN: {formatTime(log.timeIn)}</span>

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
                    <button
                      type="button"
                      onClick={() => openEditModal(log)}
                      className="text-[10px] font-bold bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-amber-200 dark:border-amber-500/30"
                    >
                      <Edit className="w-3.5 h-3.5" /> Resolve Shift
                    </button>

                    {!log.timeOut && (
                      <button
                        type="button"
                        onClick={() => { setSelectedLog(log); setIsForceOutModalOpen(true); }}
                        className="text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-2 rounded-lg transition-all shadow-md shadow-rose-500/20 active:scale-95"
                      >
                        Force Out
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="text-center py-16 text-gray-500 italic">No attendance records found for this cutoff window.</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.01]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Showing <span className="font-bold text-gray-800 dark:text-white">{indexOfFirstRow + 1}</span> to <span className="font-bold text-gray-800 dark:text-white">{Math.min(indexOfLastRow, filteredLogs.length)}</span> of <span className="font-bold text-gray-800 dark:text-white">{filteredLogs.length}</span> records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-gray-600 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
          <form onSubmit={handleSaveManualEdit} className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 bg-amber-50 dark:bg-amber-500/10">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                <Edit className="w-5 h-5" /> Resolve Shift Record
              </h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                You are manually resolving the attendance log for <strong>{selectedLog.fullName}</strong>. Please ensure accuracy for payroll compliance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Correct Time In</label>
                  <input
                    type="datetime-local"
                    value={editTimeIn}
                    onChange={(e) => setEditTimeIn(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Correct Time Out</label>
                  <input
                    type="datetime-local"
                    value={editTimeOut}
                    onChange={(e) => setEditTimeOut(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Resolution Note (Required)</label>
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., Admin Resolution: Clock-in system failure"
                  required
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 transition-colors"
                />
              </div>

              {selectedLog.status.toLowerCase().includes("late") && (
                <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="excuseLate"
                    checked={editExcuseLate}
                    onChange={(e) => setEditExcuseLate(e.target.checked)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <div>
                    <label htmlFor="excuseLate" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-emerald-500" />
                      Excuse Lateness & Remove Penalty
                    </label>
                    <p className="text-xs text-gray-500 mt-1">If checked, this late log will be officially forgiven and won&apos;t count towards payroll deductions.</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingEdit || !editTimeIn || !editTimeOut || !editReason}
                className="w-full mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50 active:scale-95"
              >
                {isSavingEdit ? "Saving..." : <><Save className="w-4 h-4" /> Save & Resolve</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}