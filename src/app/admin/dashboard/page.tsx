"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { 
  collection, query, onSnapshot, orderBy, limit, getDocs, where, startAfter, 
  QueryDocumentSnapshot, DocumentData, QueryConstraint
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts";
import { Users, Activity, ShieldAlert, TrendingUp, PieChart as PieIcon, Calendar, RefreshCw, FileText, CalendarDays } from "lucide-react";

interface AuditLog {
  id: string;
  adminEmail: string;
  actionType: string;
  details: string;
  timestamp: { seconds: number } | null;
}

interface EmployeeProfile {
  id: string;
  role: string;
  department?: string;
  status?: string; 
}

interface EvaluationData {
  id: string;
  employeeId: string;
  averageScore: number;
}

export default function AdminCommandCenter() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(""); 
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({ totalEmployees: 0, avgPerformance: 0, activePolicies: 0, cutoffLabel: "" });
  const [deptData, setDeptData] = useState<{name: string, value: number, fill: string}[]>([]);
  const [perfData, setPerfData] = useState<{name: string, score: number}[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationData[]>([]);

  useEffect(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const monthName = today.toLocaleString(undefined, { month: 'short' });
    const lastDay = new Date(currentYear, today.getMonth() + 1, 0).getDate();
    
    const label = today.getDate() <= 15 
      ? `${monthName} 1 - 15, ${currentYear}`
      : `${monthName} 16 - ${lastDay}, ${currentYear}`;
      
    setStats(prev => ({ ...prev, cutoffLabel: label }));
  }, []);

  const formatTargetText = (text: string) => {
    if (!text) return "";
    const firebaseUidRegex = /\(?([A-Za-z0-9]{28})\)?/g;
    let cleaned = text.replace(firebaseUidRegex, "").trim();
    if (cleaned.toLowerCase().startsWith("employee id:")) {
      cleaned = "Employee Profile";
    }
    return cleaned;
  };

  const fetchLogs = useCallback(async (isFirstLoad = true, cursorDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    setLoadingLogs(true);
    try {
      const constraints: QueryConstraint[] = [orderBy("timestamp", "desc"), limit(10)];

      if (selectedDate) {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        constraints.unshift(where("timestamp", ">=", startOfDay), where("timestamp", "<=", endOfDay));
      }

      if (!isFirstLoad && cursorDoc) constraints.push(startAfter(cursorDoc));

      const qLogs = query(collection(db, "systemLogs"), ...constraints);
      const snap = await getDocs(qLogs);

      const fetchedLogs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));

      if (isFirstLoad) {
        setLogs(fetchedLogs);
      } else {
        setLogs(prev => [...prev, ...fetchedLogs]);
      }

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === 10);
    } catch (err) {
      console.error("Error fetching logs:", err);
    } finally {
      setLoadingLogs(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchLogs(true, null);
  }, [fetchLogs]);

  useEffect(() => {  
    const qUsers = query(collection(db, "users"), where("role", "==", "employee"));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setEmployees(snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          role: data.role || "employee",
          department: data.department,
          status: data.status || "active"
        } as EmployeeProfile;
      }));
    });

    const qEvals = query(collection(db, "evaluations"));
    const unsubEvals = onSnapshot(qEvals, (snap) => {
      setEvaluations(snap.docs.map(d => ({ id: d.id, ...d.data() } as EvaluationData)));
    });

    const qPolicies = query(collection(db, "announcements"));
    const unsubPolicies = onSnapshot(qPolicies, (snap) => {
      setStats(prev => ({ ...prev, activePolicies: snap.docs.length }));
    });

    return () => { unsubUsers(); unsubEvals(); unsubPolicies(); };
  }, []);

  useEffect(() => {
    if (!employees.length) return;
    const activeEmployees = employees.filter(emp => 
      !["inactive", "Resigned", "Terminated", "End of Contract"].includes(emp.status || "")
    );

    const activeEmpIds = new Set(activeEmployees.map(e => e.id));
    const empDeptMap: Record<string, string> = {};
    const deptCounts: Record<string, number> = {};

    // Map active departments
    activeEmployees.forEach(emp => {
      const dept = emp.department || "Unassigned";
      empDeptMap[emp.id] = dept;
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });

    const COLORS = ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
    const newDeptData = Object.entries(deptCounts).map(([name, count], i) => ({
      name, value: count, fill: COLORS[i % COLORS.length]
    }));

    // Aggregate Evaluation Scores exclusively for active team structures
    const deptScores: Record<string, { total: number, count: number }> = {};
    let totalOrgScore = 0;
    let totalEvalsCount = 0;

    evaluations.forEach(ev => {
      // Ignore evaluation logs tied to offboarded accounts
      if (!activeEmpIds.has(ev.employeeId)) return;

      const dept = empDeptMap[ev.employeeId] || "Unassigned";
      if (!deptScores[dept]) deptScores[dept] = { total: 0, count: 0 };

      deptScores[dept].total += ev.averageScore;
      deptScores[dept].count += 1;
      
      totalOrgScore += ev.averageScore;
      totalEvalsCount += 1;
    });

    const newPerfData = Object.entries(deptScores).map(([name, data]) => ({
      name,
      score: Number((data.total / data.count).toFixed(1))
    }));

    const trueOrgAvg = totalEvalsCount > 0 ? Number((totalOrgScore / totalEvalsCount).toFixed(1)) : 0;

    setDeptData(newDeptData);
    setPerfData(newPerfData);
    setStats(prev => ({ ...prev, totalEmployees: activeEmployees.length, avgPerformance: trueOrgAvg }));

  }, [employees, evaluations]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="w-10 h-10 text-indigo-500" />
              Company Performance Center
            </h1>
            <p className="text-gray-500 mt-2">Real-time HR analytics and system audit logs.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
              <Users className="text-indigo-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</div>
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Active Headcount</div>
            </div>
            
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm relative group overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative z-10">
                <TrendingUp className="text-emerald-500 mb-2" />
                <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-baseline gap-1">
                  {stats.avgPerformance > 0 ? stats.avgPerformance.toFixed(1) : "-"} 
                  <span className="text-sm font-medium text-gray-400">/ 5.0</span>
                </div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-0.5">Team Performance</div>
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
              <FileText className="text-amber-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activePolicies}</div>
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Active Policies</div>
            </div>

            {/* Current Cutoff Date window tracking */}
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm relative group overflow-hidden">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-teal-50 dark:bg-teal-500/10 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
              <div className="relative z-10">
                <CalendarDays className="text-teal-500 mb-2" />
                <div className="text-lg font-black text-gray-900 dark:text-white font-mono truncate tracking-tight py-0.5">
                  {stats.cutoffLabel || "Calculating..."}
                </div>
                <div className="text-xs text-gray-400 uppercase font-bold tracking-wider mt-1">Current Cutoff Window</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-500" /> Active Department Diversity
              </h3>
              <div className="flex-1 min-h-[250px]">
                {deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={deptData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400 italic">No department data available.</div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Active Performance by Dept
              </h3>
              <div className="flex-1 min-h-[250px]">
                {perfData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={perfData} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} interval={0} angle={-15} textAnchor="end" />
                      <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                      <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400 italic">Submit an active evaluation to generate chart.</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" /> System Audit Logs
              </h3>
              
              <div className="flex items-center gap-3">
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="pl-9 pr-4 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                {selectedDate && (
                  <button onClick={() => setSelectedDate("")} className="text-xs text-rose-500 font-semibold hover:underline">
                    Clear Filter
                  </button>
                )}
                <button 
                  onClick={() => fetchLogs(true, null)} 
                  disabled={loadingLogs}
                  className="p-2 rounded-xl border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div>
                    <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">
                      {log.actionType || "GENERAL"}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                      {formatTargetText(log.details)}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1.5 font-mono">
                      {log.adminEmail}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-black/40 px-2 py-1 rounded-md border border-gray-200 dark:border-white/10 shrink-0 ml-4">
                    {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "..."}
                  </div>
                </div>
              )) : !loadingLogs && (
                <div className="col-span-full text-center text-gray-500 py-8 italic">No audit logs found for this filter.</div>
              )}
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => fetchLogs(false, lastDoc)}
                  disabled={loadingLogs}
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 rounded-xl shadow transition-colors"
                >
                  {loadingLogs ? "Loading older entries..." : "Load More Logs"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}