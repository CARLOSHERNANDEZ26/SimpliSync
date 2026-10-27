"use client";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ClockInButton from "@/components/ClockInButton";
import ClockOutButton from "@/components/ClockOutButton";
import AdminLogsTable from "@/components/AdminLogsTable";
import EmployeeHistoryTable from "@/components/EmployeeHistoryTable";
import HRChatbot from "@/components/HRChatbot";
import { verifyLocationPing, resolveDanglingShift } from "@/services/attendance";
import { Users, FileText, ShieldAlert, Sparkles, XCircle, CalendarCheck, AlertCircle, ArrowRight, Tag } from "lucide-react"; 
import Link from "next/link";
import toast from "react-hot-toast";

interface AttendanceLog { id: string; userId: string; timeIn: Date | null; timeOut: Date | null; status: string; fullName?: string; role?: string; }
interface EmployeeData { id: string; fullName: string; department?: string; status?: string; [key: string]: unknown; }
interface PendingLeave { id: string; userName: string; type: string; reason: string; status: string; startDate?: string; }
interface Announcement { id: string; title: string; content: string; category?: string; author: string; createdAt?: { seconds: number; nanoseconds: number }; }

export default function DashboardPage() {
  const { user, isClockedIn } = useAuth(); 
  const isAdmin = user?.email === "admin@simplisync.local";
  const [logs, setLogs] = useState<AttendanceLog[]>([]); 
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [danglingShift, setDanglingShift] = useState<AttendanceLog | null>(null);
  const [selectedMemo, setSelectedMemo] = useState<Announcement | null>(null);
  const [exceptionTime, setExceptionTime] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const getCategoryBadgeColor = (_category?: string): string => {
    return "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300 border-teal-200 dark:border-teal-500/30";
  };

  const handleResolveException = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!user?.uid || !danglingShift) return; 
    setIsResolving(true);
    try {
      const [hours, minutes] = exceptionTime.split(':');
      const manualDate = new Date(danglingShift.timeIn!); 
      manualDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
      await resolveDanglingShift(danglingShift.id, user.uid, manualDate, exceptionReason);
      toast.success("Exception submitted to HR for review.");
      setDanglingShift(null); 
    } catch (error) {
      console.error("Exception Resolution Error:", error);
      toast.error("Failed to submit exception.");
    } finally {
      setIsResolving(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    let unsubscribeUsers = () => {}; let unsubscribeLeaves = () => {};

    if (isAdmin) { 
      unsubscribeUsers = onSnapshot(query(collection(db, "users"), where("role", "==", "employee")), (snap) => setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeData)).filter(emp => emp.status !== "inactive" && emp.status !== "Offboarded")));
      unsubscribeLeaves = onSnapshot(query(collection(db, "leaveRequests"), where("status", "==", "pending")), (snap) => setPendingLeaves(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingLeave))));
    }

    const baseQuery = isAdmin 
      ? query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc"), limit(150)) 
      : query(collection(db, "attendanceLogs"), where("userId", "==", user.uid), orderBy("timeIn", "desc"), limit(30)); 
      
    const unsubscribeLogs = onSnapshot(baseQuery, (snap) => { 
      const fetchedLogs = snap.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, userId: data.userId, timeIn: data.timeIn?.toDate(), timeOut: data.timeOut?.toDate(), status: data.status || "N/A", fullName: data.fullName, role: data.role } as AttendanceLog;
      });
      setLogs(fetchedLogs);
      
      const dangling = fetchedLogs.find(log => { 
        if (!log.timeIn || log.timeOut || log.userId !== user.uid) return false;
        const today = new Date(); today.setHours(0, 0, 0, 0); 
        const shiftDate = new Date(log.timeIn); shiftDate.setHours(0, 0, 0, 0);  
        return shiftDate.getTime() < today.getTime();  
      });
      setDanglingShift(!isAdmin && dangling ? dangling : null);
    });

    return () => { unsubscribeLogs(); if (isAdmin) { unsubscribeUsers(); unsubscribeLeaves(); } };
  }, [user?.uid, isAdmin]);

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(8)), (snap) => setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement))));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isClockedIn && user?.uid) {
      const pingInterval = setInterval(() => navigator.geolocation.getCurrentPosition(async (pos) => await verifyLocationPing(user.uid, pos.coords.latitude, pos.coords.longitude).catch(console.error), console.error, { enableHighAccuracy: true }), 60000); 
      return () => clearInterval(pingInterval);
    }
  }, [isClockedIn, user?.uid]);

  const todaysLogsCount = logs.filter(log => log.timeIn && new Date(log.timeIn).toDateString() === new Date().toDateString()).length;
  
  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[57px] lg:pt-0 lg:pl-[260px] bg-slate-50 dark:bg-[#0a0a0a] flex flex-col">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-400/10 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 w-full flex-grow flex flex-col px-4 sm:px-8 lg:px-10 py-6 pb-24 lg:pb-8">
          
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white shrink-0">
              Welcome back, {user?.displayName || (user?.email?.split('@')[0] ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : "User")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
              {isAdmin ? "Here is what is happening across the company today." : "Here is your workspace overview."}
            </p>
          </div>
          
          {isAdmin ? (
            <div className="flex flex-col gap-8 mb-8 w-full">
              
              {/* 3-Column Clean KPI Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-50 dark:bg-teal-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Workforce</p>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{employees.length}</h3>
                    </div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-100/80 dark:border-teal-500/20 shadow-xs"><Users className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-50 dark:bg-teal-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Present Today</p>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{todaysLogsCount}</h3>
                    </div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-100/80 dark:border-teal-500/20 shadow-xs"><FileText className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-50 dark:bg-teal-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Leaves</p>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{pendingLeaves.length}</h3>
                    </div>
                    <div className="p-3 bg-teal-50 dark:bg-teal-500/15 text-teal-600 dark:text-teal-400 rounded-2xl border border-teal-100/80 dark:border-teal-500/20 shadow-xs"><CalendarCheck className="w-5 h-5" /></div>
                  </div>
                </div>
              </div>

              {/* Lower Section Split: Equal height containers */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
                
                {/* Left Column: Action Required Widget (Equal height to Attendance Logs) */}
                <div className="lg:col-span-4 xl:col-span-4 flex flex-col h-full">
                  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl w-full h-full min-h-[520px] flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Action Required</h3>
                            <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                              {pendingLeaves.length} pending review{pendingLeaves.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                        <Link href="/leave" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors flex items-center gap-1">
                          View All <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      {/* List of pending leaves (up to 5 items) */}
                      {pendingLeaves.length > 0 && (
                        <div className="flex flex-col gap-3">
                          {pendingLeaves.slice(0, 5).map(leave => (
                            <div key={leave.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex justify-between items-center group hover:border-teal-300 dark:hover:border-teal-500/30 transition-all">
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">{leave.userName}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400">
                                    {leave.type} Leave
                                  </span>
                                  {leave.startDate && (
                                    <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                      {leave.startDate}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Link 
                                href="/leave" 
                                className="px-3.5 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-300 rounded-xl shadow-xs group-hover:bg-teal-600 group-hover:text-white group-hover:border-teal-600 transition-all uppercase tracking-wider shrink-0"
                              >
                                Review
                              </Link>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Symmetrical Centered Empty State when no data */}
                    {pendingLeaves.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-3 border border-teal-100/80 dark:border-teal-500/20 shadow-xs">
                          <CalendarCheck className="w-7 h-7" />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">All Caught Up!</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[220px]">
                          No employee leave requests or approval items currently require your action.
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">
                        {pendingLeaves.length > 5 ? `Showing 5 of ${pendingLeaves.length} requests` : `${pendingLeaves.length} pending total`}
                      </span>
                      <Link href="/leave" className="font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
                        Open Leave Desk <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>

                  </div>
                </div>

                {/* Right Column: Paginated Admin Logs Table (Equal height) */}
                <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-w-0">
                  <AdminLogsTable />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-8 w-full">
              <div className="lg:col-span-4 xl:col-span-4 flex flex-col h-full">
                <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 shadow-xl h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Work Attendance</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Record your daily shift time-in and time-out.</p>
                    <ClockInButton />
                    <div className="my-6 h-px bg-gray-200 dark:bg-white/10"></div>
                    <ClockOutButton />
                  </div>
                  <div className="pt-4 text-center text-xs text-gray-400 font-medium">
                    SimpliSync Geo-Verified Timekeeping
                  </div>
                </div>
              </div>
              <div className="lg:col-span-8 xl:col-span-8 flex flex-col h-full min-w-0">
                <EmployeeHistoryTable />
              </div>
            </div>
          )}

          {/* COMPANY MEMOS */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl col-span-1 lg:col-span-2 mt-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              Company Memos & Updates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {announcements.length > 0 ? (
                announcements.map((memo) => (
                  <div 
                    key={memo.id} 
                    onClick={() => setSelectedMemo(memo)}
                    className="group cursor-pointer p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-teal-500/40 hover:bg-teal-50/40 dark:hover:bg-teal-500/5 transition-all duration-300 flex flex-col justify-between min-h-[140px]"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border whitespace-nowrap flex items-center gap-1 ${getCategoryBadgeColor(memo.category)}`}>
                          <Tag className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" /> {memo.category || "General"}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                          {memo.createdAt ? new Date(memo.createdAt.seconds * 1000).toLocaleDateString() : "New"}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-tight">
                        {memo.title || "Official Company Memorandum"}
                      </h4>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs font-bold text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                      <span>From {memo.author}</span>
                      <span>Read memo &rarr;</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-gray-500 italic bg-slate-50 dark:bg-black/10 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                  No new company announcements.
                </div>
              )}
            </div>
          </div>
        </div>

        <HRChatbot logs={logs} />
        
        {/* Dangling Shift Modal */}
        {danglingShift && !isAdmin && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-rose-200 dark:border-rose-500/30">
              <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400"><ShieldAlert className="w-8 h-8" /><h3 className="text-2xl font-bold text-gray-900 dark:text-white">Unclosed Shift Detected</h3></div>
              <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-100 mb-6"><p className="text-sm text-rose-800">Our system detected that you clocked in on <strong>{danglingShift.timeIn?.toLocaleDateString()}</strong> but never clocked out. You must resolve this shift before continuing.</p></div>
              <form onSubmit={handleResolveException} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-500 uppercase">Actual Time Out</label><input type="time" value={exceptionTime} onChange={(e) => setExceptionTime(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-gray-900 dark:text-white" required /></div>
                <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-500 uppercase">Reason for Exception</label><textarea value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} placeholder="e.g., Power outage..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[100px] resize-none outline-none text-gray-900 dark:text-white" required /></div>
                <button type="submit" disabled={isResolving} className="mt-4 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-70">{isResolving ? "Submitting..." : "Submit to HR"}</button>
              </form>
            </div>
          </div>
        )}

        {/* The Reading Modal */}
        {selectedMemo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#151515] w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] rounded-t-3xl">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">{selectedMemo.title || "Official Company Memorandum"}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeColor(selectedMemo.category)}`}>
                      {selectedMemo.category || "Uncategorized"}
                    </span>
                    <p className="text-xs text-gray-500 font-semibold">
                      Published {selectedMemo.createdAt ? new Date(selectedMemo.createdAt.seconds * 1000).toLocaleDateString() : "Just now"} by {selectedMemo.author}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMemo(null)} 
                  className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 shadow-sm"
                >
                  <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedMemo.content}
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}