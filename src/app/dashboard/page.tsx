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
import { Users, Activity, FileText, PieChart, Clock, ShieldAlert, Sparkles, Gift, XCircle } from "lucide-react"; 
import Link from "next/link";
import toast from "react-hot-toast";

interface Bonus { id: string; type: string; year: number; amount: number; distributedAt: { seconds: number } | null; }
interface AttendanceLog { id: string; userId: string; timeIn: Date | null; timeOut: Date | null; status: string; fullName?: string; role?: string; }
interface EmployeeData { id: string; fullName: string; department?: string; status?: string; [key: string]: unknown; }
interface PendingLeave { id: string; userName: string; type: string; reason: string; status: string; }
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
    
    if (subjectLine) {
      return subjectLine.replace(/\*\*/g, '').replace(/SUBJECT:/i, '').trim();
    }
    return "Official Company Memorandum"; 
  };

  const handleResolveException = async (e: React.SubmitEvent) => {
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
      unsubscribeUsers = onSnapshot(query(collection(db, "users"), where("role", "==", "employee")), (snap) => setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeData)).filter(emp => emp.status !== "inactive")));
      unsubscribeLeaves = onSnapshot(query(collection(db, "leaveRequests"), where("status", "==", "pending")), (snap) => setPendingLeaves(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PendingLeave))));
    }

    const baseQuery = isAdmin ? query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc"), limit(50)) : query(collection(db, "attendanceLogs"), where("userId", "==", user.uid), orderBy("timeIn", "desc"), limit(30)); 
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
    const q = query(
      collection(db, "bonuses"), 
      where("userId", "==", user.uid), 
      where("year", "==", currentYear), 
      orderBy("distributedAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setBonuses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bonus)));
    });
    
    return () => unsubscribe();
  }, [user?.uid, isAdmin]);

  const todaysLogsCount = logs.filter(log => log.timeIn && new Date(log.timeIn).toDateString() === new Date().toDateString()).length;
  const deptBreakdown = employees.reduce((acc, emp) => { acc[emp.department || "Unassigned"] = (acc[emp.department || "Unassigned"] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] flex flex-col">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full flex-grow flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8">
          <div className="flex flex-col lg:flex-row gap-8 mb-8">
            
            <div className="w-full lg:w-1/3 flex flex-col space-y-6">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white shrink-0">
                Welcome, {user?.displayName || (user?.email?.split('@')[0] ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : "User")}
              </h2>
              
              {isAdmin ? (
                <div className="flex flex-col space-y-6">
                  {/* Key Metrics Card */}
                  <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pb-2"><Activity className="w-5 h-5 text-teal-500" /> Key Metrics</h3>
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5"><Users className="w-6 h-6 text-teal-500 mb-2" /><div className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}</div><div className="text-sm text-gray-500">Active Staff</div></div>
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5"><FileText className="w-6 h-6 text-emerald-500 mb-2" /><div className="text-2xl font-bold text-gray-900 dark:text-white">{todaysLogsCount}</div><div className="text-sm text-gray-500">Logs Today</div></div>
                    </div>
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2"><PieChart className="w-4 h-4" /> Department Breakdown</h4> 
                      <div className="space-y-2">{Object.entries(deptBreakdown).map(([dept, count]) => (<div key={dept} className="flex justify-between items-center text-sm"><span className="text-gray-600">{dept}</span><span className="font-medium bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{count}</span></div>))}</div>
                    </div>
                  </div>

                  {/* Pending Actions Card */}
                  <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 pb-2"><Clock className="w-5 h-5 text-amber-500" /> Pending Actions</h3>
                    {pendingLeaves.length > 0 ? (
                      <div className="space-y-2">{pendingLeaves.slice(0, 3).map(leave => (<Link href="/leave" key={leave.id} className="block p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 border border-amber-100/50 transition-colors"><div className="flex justify-between items-center mb-1"><span className="text-sm font-semibold truncate">{leave.userName}</span><span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">{leave.type.toUpperCase()}</span></div></Link>))}</div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 text-sm text-amber-800">No pending requests.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Existing Clock-in Card */}
                  <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl">
                    <ClockInButton />
                    <div className="my-6 h-px bg-gray-200 dark:bg-white/10"></div>
                    <ClockOutButton />
                  </div>

                  {/* Employee Benefits Card */}
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
              )}
            </div>

            <div className="w-full lg:w-2/3">
              {isAdmin ? <AdminLogsTable /> : <EmployeeHistoryTable />}
            </div>
          </div>

          {/* AI ANNOUNCEMENTS WIDGET */}
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
        
        {/* Dangling Shift Modal */}
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
      
      {/* Modal Header */}
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

      {/* Modal Body (Scrollable) */}
      <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
        {/* We use replace to clean up some of the heavy markdown asterisks for a cleaner reading experience */}
        {selectedMemo.content.replace(/\*\*/g, '')}
      </div>
      
    </div>
  </div>
)}
      </main>
    </ProtectedRoute>
  );
}