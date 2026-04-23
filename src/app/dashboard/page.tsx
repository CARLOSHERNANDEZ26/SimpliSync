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
import { Users, Activity, FileText, PieChart, Clock, ShieldAlert, Sparkles } from "lucide-react"; 
import Link from "next/link";
import toast from "react-hot-toast";

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
  
  const [danglingShift, setDanglingShift] = useState<AttendanceLog | null>(null);
  const [exceptionTime, setExceptionTime] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [isResolving, setIsResolving] = useState(false);

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

  const todaysLogsCount = logs.filter(log => log.timeIn && new Date(log.timeIn).toDateString() === new Date().toDateString()).length;
  const deptBreakdown = employees.reduce((acc, emp) => { acc[emp.department || "Unassigned"] = (acc[emp.department || "Unassigned"] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <ProtectedRoute>
      <main className="min-h-screen lg:h-screen w-full relative overflow-y-auto lg:overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] flex flex-col">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full flex-grow lg:h-full flex flex-col max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 lg:pb-8 min-h-0">
          <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
            
            <div className="w-full lg:w-1/3 flex flex-col space-y-6 lg:h-full">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white shrink-0">
                Welcome, {user?.displayName || (user?.email?.split('@')[0] ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : "User")}
              </h2>
              
              {isAdmin ? (
                <div className="flex flex-col flex-1 min-h-0 space-y-6">
                  {/* Key Metrics Card */}
                  <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col flex-[0.8] overflow-y-auto hide-scrollbar">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 sticky top-0 bg-white dark:bg-[#151515] z-10 pb-2"><Activity className="w-5 h-5 text-teal-500" /> Key Metrics</h3>
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
                  <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl flex flex-col flex-1 overflow-y-auto hide-scrollbar">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2 sticky top-0 bg-white dark:bg-[#151515] z-10 pb-2"><Clock className="w-5 h-5 text-amber-500" /> Pending Actions</h3>
                    {pendingLeaves.length > 0 ? (
                      <div className="space-y-2">{pendingLeaves.slice(0, 3).map(leave => (<Link href="/leave" key={leave.id} className="block p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 border border-amber-100/50 transition-colors"><div className="flex justify-between items-center mb-1"><span className="text-sm font-semibold truncate">{leave.userName}</span><span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">{leave.type.toUpperCase()}</span></div></Link>))}</div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 text-sm text-amber-800">No pending requests.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl">
                  <ClockInButton />
                  <div className="my-6 h-px bg-gray-200 dark:bg-white/10"></div>
                  <ClockOutButton />
                </div>
              )}
            </div>

            <div className="w-full lg:w-2/3 lg:h-full lg:overflow-y-auto pr-2 custom-scrollbar lg:pb-10">
              {isAdmin ? <AdminLogsTable /> : <EmployeeHistoryTable />}
            </div>
          </div>

          {/* 🔥 AI ANNOUNCEMENTS WIDGET (Now safely inside the layout wrapper) */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl mt-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Company Memos & Policies
            </h3>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-2">From: {announcement.author}</p>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-4">{announcement.content}</div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm italic">No recent announcements.</div>
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
      </main>
    </ProtectedRoute>
  );
}