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
import HRChatbot from "@/components/HRChatbot"; // Import the chatbot
import { Users, Activity, FileText, PieChart, Calendar, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";

interface AttendanceLog {
  id: string;
  userId: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  fullName?: string;
  role?: string;
}

interface EmployeeData {
  id: string;
  name: string;
  department?: string;
  birthDate?: string;
  joinDate?: string;
  status?: string;
  role?: string;
  [key: string]: any;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]); 
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
  const isAdmin = user?.email === "admin@simplisync.local";

  useEffect(() => {
    if (!user?.uid) return;

    let unsubscribeUsers: () => void = () => {};
    let unsubscribeLeaves: () => void = () => {};

    if (isAdmin) {
      // Fetch full employee data for analytics (filtering out inactive locally to handle legacy docs without a status field)
      const usersQuery = query(collection(db, "users"), where("role", "==", "employee"));
      unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const empData = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as EmployeeData))
          .filter(emp => emp.status !== "inactive");
        setEmployees(empData);
      });

      const leavesQuery = query(collection(db, "leaveRequests"), where("status", "==", "pending"));
      unsubscribeLeaves = onSnapshot(leavesQuery, (snapshot) => {
        setPendingLeaves(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    }

    const baseQuery = isAdmin 
      ? query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc"), limit(50)) 
      : query(collection(db, "attendanceLogs"), where("userId", "==", user.uid), orderBy("timeIn", "desc"), limit(30)); 

    const unsubscribeLogs = onSnapshot(baseQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          timeIn: data.timeIn?.toDate ? data.timeIn.toDate() : null,
          timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
          status: data.status || "N/A",
          fullName: data.fullName,  
          role: data.role,       
        } as AttendanceLog;
      });
      
      setLogs(fetchedLogs);
    });

    return () => {
      unsubscribeLogs();
      if (isAdmin) {
        unsubscribeUsers();
        unsubscribeLeaves();
      }
    };
  }, [user?.uid, isAdmin]);

  const employeeCount = employees.length;

  const todaysLogsCount = logs.filter(log => {
    if (!log.timeIn) return false;
    const today = new Date();
    return log.timeIn.getDate() === today.getDate() &&
           log.timeIn.getMonth() === today.getMonth() &&
           log.timeIn.getFullYear() === today.getFullYear();
  }).length;

  // Analytics Calculations
  const deptBreakdown = employees.reduce((acc, emp) => {
    const dept = emp.department || "Unassigned";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const currentMonth = new Date().getMonth();
  const upcomingBirthdays = employees.filter(emp => {
    if (!emp.birthDate) return false;
    const [year, month, day] = emp.birthDate.split('-');
    // Month is 0-indexed in JS Date, but 1-12 in string
    return parseInt(month, 10) - 1 === currentMonth;
  });

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left Column: Actions / Admin Stats */}
            <div className="w-full lg:w-1/3 space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
                Welcome, {user?.displayName || (user?.email?.split('@')[0] ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : "User")}
              </h2>
              </div>
              
              {isAdmin ? (
                <>
                  {/* Admin Overview Metrics */}
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl space-y-5">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white items-center flex gap-2">
                      <Activity className="w-5 h-5 text-teal-500" />
                      Key Metrics
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                        <Users className="w-6 h-6 text-teal-500 mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{employeeCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Active Staff</div>
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                        <FileText className="w-6 h-6 text-emerald-500 mb-2" />
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{todaysLogsCount}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logs Today</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <PieChart className="w-4 h-4" /> Department Breakdown
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(deptBreakdown).length > 0 ? (
                          Object.entries(deptBreakdown).map(([dept, count]) => (
                            <div key={dept} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 dark:text-gray-400">{dept}</span>
                              <span className="font-medium text-gray-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{count}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">No departments data yet.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pending Actions & Events */}
                  <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Clock className="w-5 h-5 text-amber-500" />
                          Pending Actions
                        </h3>
                        {pendingLeaves.length > 0 && (
                          <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold">{pendingLeaves.length}</span>
                        )}
                      </div>
                      
                      {pendingLeaves.length > 0 ? (
                        <div className="space-y-2">
                          {pendingLeaves.slice(0, 3).map(leave => (
                            <Link href="/leave" key={leave.id} className="block p-3 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 border border-amber-100/50 dark:border-amber-500/10 transition-colors">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate pr-2">{leave.userName}</span>
                                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider bg-amber-100 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">{leave.type}</span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{leave.reason}</div>
                            </Link>
                          ))}
                          {pendingLeaves.length > 3 && (
                            <Link href="/leave" className="block text-center text-xs font-semibold text-teal-600 dark:text-teal-400 pt-2 hover:underline">
                              See all {pendingLeaves.length} pending requests
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-sm text-amber-800 dark:text-amber-200">
                          No pending leave or expense requests requiring approval.
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white items-center flex gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-teal-500" />
                        Upcoming Events
                      </h3>
                      <div className="space-y-3">
                        {upcomingBirthdays.length > 0 ? (
                          upcomingBirthdays.map((emp) => (
                            <div key={emp.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">{emp.name}'s Birthday</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">This Month</div>
                              </div>
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                                🎂
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">No birthdays or anniversaries this month.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-xl">
                  <ClockInButton />
                  <div className="my-6 h-px bg-gray-200 dark:bg-white/10"></div>
                  <ClockOutButton />
                </div>
              )}
            </div>

            {/* Right Column: Tables */}
            <div className="w-full lg:w-2/3">
              {isAdmin ? <AdminLogsTable /> : <EmployeeHistoryTable />}
            </div>

          </div>
        </div>

        <HRChatbot logs={logs} />
      </main>
    </ProtectedRoute>
  );
}