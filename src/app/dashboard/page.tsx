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
import HRChatbot from "@/components/HRChatbot";
import { verifyLocationPing, resolveDanglingShift } from "@/services/attendance";
import { Users, Activity, FileText, Clock, ShieldAlert, Sparkles, Gift, XCircle, TrendingUp, CalendarCheck, AlertCircle, ArrowRight } from "lucide-react"; 
import Link from "next/link";
import toast from "react-hot-toast";

interface Bonus { id: string; type: string; year: number; amount: number; distributedAt: { seconds: number } | null; }
interface AttendanceLog { id: string; userId: string; timeIn: Date | null; timeOut: Date | null; status: string; fullName?: string; role?: string; }
interface EmployeeData { id: string; fullName: string; department?: string; status?: string; [key: string]: unknown; }
interface PendingLeave { id: string; userName: string; type: string; reason: string; status: string; startDate?: string; }
interface Announcement { id: string; content: string; author: string; createdAt: { seconds: number } | null; }

export default function DashboardPage() {
  const { user, isClockedIn } = useAuth(); 
  const isAdmin = user?.email === "admin@simplisync.local";
  
  const [logs, setLogs] = useState<AttendanceLog[]>([]); 
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeave[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  
  const [danglingShift, setDanglingShift] = useState<AttendanceLog | null>(null);
  const [selectedMemo, setSelectedMemo] = useState<{id: string, content: string, author: string, createdAt: { seconds: number } | null} | null>(null);
  const [exceptionTime, setExceptionTime] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const getMemoTitle = (content: string) => {
    const lines = content.split('\n');
    const subjectLine = lines.find(line => line.toUpperCase().includes('SUBJECT:'));
    if (subjectLine) return subjectLine.replace(/\*\*/g, '').replace(/SUBJECT:/i, '').trim();
    return "Official Company Memorandum"; 
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
      ? query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc"), limit(50)) 
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
    const unsubscribe = onSnapshot(query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(3)), (snap) => setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement))));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isClockedIn && user?.uid) {
      const pingInterval = setInterval(() => navigator.geolocation.getCurrentPosition(async (pos) => await verifyLocationPing(user.uid, pos.coords.latitude, pos.coords.longitude).catch(console.error), console.error, { enableHighAccuracy: true }), 60000); 
      return () => clearInterval(pingInterval);
    }
  }, [isClockedIn, user?.uid]);

  useEffect(() => {
    if (!user?.uid || isAdmin) return; 
    const currentYear = new Date().getFullYear();
    const q = query(collection(db, "bonuses"), where("userId", "==", user.uid), where("year", "==", currentYear), orderBy("distributedAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => setBonuses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bonus))));
    return () => unsubscribe();
  }, [user?.uid, isAdmin]);

  const todaysLogsCount = logs.filter(log => log.timeIn && new Date(log.timeIn).toDateString() === new Date().toDateString()).length;
  
  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] flex flex-col">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
          
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white shrink-0">
              Welcome back, {user?.displayName || (user?.email?.split('@')[0] ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : "User")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
              {isAdmin ? "Here is what is happening across your organization today." : "Here is your workspace overview."}
            </p>
          </div>
          
          {isAdmin ? (
            <div className="flex flex-col gap-8 mb-8 w-full">
              
              {/* KPI Widget Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 dark:bg-blue-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Workforce</p>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{employees.length}</h3>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl"><Users className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Present Today</p>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{todaysLogsCount}</h3>
                    </div>
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl"><FileText className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                  <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Leaves</p>
                      <h3 className="text-3xl font-black text-gray-900 dark:text-white">{pendingLeaves.length}</h3>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl"><CalendarCheck className="w-5 h-5" /></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-600 to-emerald-500 p-6 rounded-3xl shadow-lg hover:shadow-xl transition-shadow relative overflow-hidden group">
                   <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
                   <div className="relative z-10 flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mb-1">Company Status</p>
                      <h3 className="text-xl font-black text-white mt-1 leading-tight">Operations<br/>Nominal</h3>
                    </div>
                    <div className="p-3 bg-white/20 text-white rounded-2xl"><TrendingUp className="w-5 h-5" /></div>
                  </div>
                </div>
              </div>

              {/* Lower Section Split */}
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Column: Action Center & Activity */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6">
                  
                  {/* Action Center */}
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Action Required</h3>
                      <Link href="/leave" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></Link>
                    </div>
                    <div className="flex flex-col gap-3">
                      {pendingLeaves.length > 0 ? (
                        pendingLeaves.slice(0, 3).map(leave => (
                          <div key={leave.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex justify-between items-center group hover:border-amber-200 dark:hover:border-amber-500/30 transition-colors">
                            <div>
                              <div className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[120px]">{leave.userName}</div>
                              <div className="text-[10px] font-semibold text-gray-500 mt-0.5 uppercase tracking-wide text-teal-600 dark:text-teal-400">{leave.type} Leave</div>
                            </div>
                            <Link href="/leave" className="px-3 py-1.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-700 dark:text-gray-300 rounded-lg shadow-sm group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all uppercase tracking-wider">Review</Link>
                          </div>
                        ))
                      ) : (
                        <div className="py-6 text-center bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                          <CalendarCheck className="w-6 h-6 text-emerald-400 mb-2 opacity-50 mx-auto" />
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400">All caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Activity Feed */}
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl flex-1">
                     <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500" /> Live Feed</h3>
                      <Link href="/timesheets" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors flex items-center gap-1">Logs <ArrowRight className="w-3 h-3" /></Link>
                    </div>
                    <div>
                      {logs.length > 0 ? (
                        <div className="relative border-l border-gray-200 dark:border-white/10 ml-2 space-y-5 pb-2">
                          {logs.slice(0, 4).map(log => (
                            <div key={log.id} className="relative pl-5">
                              <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-[#1a1a1a] ${log.status.toLowerCase().includes('late') ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                              <div>
                                {/* Dynamically show timeOut if it exists, otherwise show timeIn */}
                                <div className="text-[10px] font-bold text-gray-400 mb-0.5 uppercase tracking-wider">
                                  {log.timeOut 
                                    ? log.timeOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                    : log.timeIn 
                                      ? log.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                                      : "Just now"}
                                </div>
                                <div className="text-sm text-gray-900 dark:text-white font-medium">
                                  <span className="font-bold">{log.fullName}</span> {log.timeOut ? "clocked out." : "clocked in."}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400">No activity yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Right Column: Admin Logs Table */}
                <div className="w-full lg:w-2/3">
                  <AdminLogsTable />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 mb-8 w-full">
              <div className="w-full lg:w-1/3 flex flex-col space-y-6">
                
                <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl">
                  <ClockInButton />
                  <div className="my-6 h-px bg-gray-200 dark:bg-white/10"></div>
                  <ClockOutButton />
                </div>

                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-200 dark:border-rose-500/20 shadow-xl">
                  <h3 className="text-lg font-bold text-rose-900 dark:text-rose-400 mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5" /> My Benefits & Bonuses
                  </h3>
                  {bonuses.length > 0 ? (
                    <div className="space-y-3">
                      {bonuses.map(bonus => (
                        <div key={bonus.id} className="bg-white dark:bg-black/40 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/10 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{bonus.type}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">{bonus.year} • Distributed</div>
                          </div>
                          <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +₱{bonus.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-white/50 dark:bg-black/20 rounded-2xl border border-white/20 dark:border-white/5">
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No bonuses distributed yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full lg:w-2/3">
                <EmployeeHistoryTable />
              </div>
            </div>
          )}

          {/* COMMON AREA: COMPANY MEMOS */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl col-span-1 lg:col-span-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Company Memos & Updates
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {announcements.length > 0 ? (
                announcements.map((memo) => (
                  <div 
                    key={memo.id} 
                    onClick={() => setSelectedMemo(memo)}
                    className="group cursor-pointer p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-indigo-500/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-300 flex flex-col justify-between min-h-[120px]"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2 block">
                        {memo.createdAt ? new Date(memo.createdAt.seconds * 1000).toLocaleDateString() : "New"} • From {memo.author}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {getMemoTitle(memo.content)}
                      </h4>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-bold text-gray-400 group-hover:text-indigo-500 transition-colors">
                      Click to read full memo &rarr;
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-gray-500 italic bg-slate-50 dark:bg-black/10 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                  No new company announcements.
                </div>
              )}
            </div>
          </div>
        </div>

        <HRChatbot logs={logs} />
        
        {/* Dangling Shift Modal (Employee Only) */}
        {danglingShift && !isAdmin && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full border border-rose-200 dark:border-rose-500/30">
              <div className="flex items-center gap-3 mb-4 text-rose-600 dark:text-rose-400"><ShieldAlert className="w-8 h-8" /><h3 className="text-2xl font-bold text-gray-900 dark:text-white">Unclosed Shift Detected</h3></div>
              <div className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-xl border border-rose-100 mb-6"><p className="text-sm text-rose-800">Our system detected that you clocked in on <strong>{danglingShift.timeIn?.toLocaleDateString()}</strong> but never clocked out. You must resolve this shift before continuing.</p></div>
              <form onSubmit={handleResolveException} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-500 uppercase">Actual Time Out</label><input type="time" value={exceptionTime} onChange={(e) => setExceptionTime(e.target.value)} className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 outline-none" required /></div>
                <div className="flex flex-col gap-1.5"><label className="text-xs font-bold text-gray-500 uppercase">Reason for Exception</label><textarea value={exceptionReason} onChange={(e) => setExceptionReason(e.target.value)} placeholder="e.g., Power outage..." className="w-full bg-slate-50 border border-gray-200 rounded-xl px-4 py-3 min-h-[100px] resize-none outline-none" required /></div>
                <button type="submit" disabled={isResolving} className="mt-4 w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-70">{isResolving ? "Submitting..." : "Submit to HR"}</button>
              </form>
            </div>
          </div>
        )}

        {/* The Reading Modal */}
        {selectedMemo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#151515] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-[#151515] z-10 rounded-t-3xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {getMemoTitle(selectedMemo.content)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                    Published by {selectedMemo.author} • {selectedMemo.createdAt ? new Date(selectedMemo.createdAt.seconds * 1000).toLocaleDateString() : ""}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedMemo(null)} 
                  className="text-gray-400 hover:text-rose-500 transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedMemo.content.replace(/\*\*/g, '')}
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}