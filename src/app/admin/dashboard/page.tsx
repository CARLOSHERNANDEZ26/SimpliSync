"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie } from "recharts";
import { Users, Activity, ShieldAlert, TrendingUp, PieChart as PieIcon } from "lucide-react";

interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  timestamp: { seconds: number } | null;
}

export default function AdminCommandCenter() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState({ totalEmployees: 0, avgPerformance: 0 });
  const [deptData, setDeptData] = useState<{name: string, value: number, fill: string}[]>([]);
  const [perfData, setPerfData] = useState<{name: string, score: number}[]>([]);

  useEffect(() => {  
    const qLogs = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(8));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
    });

    const qUsers = query(collection(db, "users"));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const employees = snap.docs.filter(d => d.data().role === "employee");
      setStats(prev => ({ ...prev, totalEmployees: employees.length }));

      const depts: Record<string, { totalScore: number, count: number }> = {};
      
      employees.forEach(emp => {
        const d = emp.data().department || "Unassigned";
        const score = emp.data().avgPerformance || 3.5; 
        
        if (!depts[d]) depts[d] = { totalScore: 0, count: 0 };
        depts[d].totalScore += score;
        depts[d].count += 1;
      });

      const COLORS = ["#06b6d4", "#8b5cf6", "#ec4899", "#f59e0b"];

      setDeptData(Object.keys(depts).map((key, index) => ({ 
        name: key, 
        value: depts[key].count,
        fill: COLORS[index % COLORS.length]
      })));

      setPerfData(Object.keys(depts).map(key => ({ 
        name: key, 
        score: Number((depts[key].totalScore / depts[key].count).toFixed(1)) 
      })));
    });

    return () => { unsubLogs(); unsubUsers(); };
  }, []);

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Activity className="w-10 h-10 text-indigo-500" />
              Command Center
            </h1>
            <p className="text-gray-500 mt-2">Real-time HR analytics and system audit trails.</p>
          </div>

          {/* Top Row: Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
              <Users className="text-indigo-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEmployees}</div>
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Headcount</div>
            </div>
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
              <TrendingUp className="text-emerald-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">4.2 / 5.0</div>
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Org Performance</div>
            </div>
            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm">
              <ShieldAlert className="text-rose-500 mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">Active</div>
              <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Audit Monitoring</div>
            </div>
          </div>

          {/* Middle Row: The Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Chart 1: Department Distribution */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-indigo-500" /> Department Diversity
              </h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <PieChart>
                    {/* The fill color is automatically read from our deptData state now */}
                    <Pie data={deptData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Department Performance */}
            <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Org Performance by Dept
              </h3>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={perfData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Bottom Row: Real-time Audit Logs */}
          <div className="bg-white dark:bg-white/5 p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> System Audit Trail
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                  <div>
                    <div className="text-xs font-bold text-indigo-500 uppercase">{log.action}</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">{log.target}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{log.adminEmail}</div>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 bg-white dark:bg-black/40 px-2 py-1 rounded-md border border-gray-100 dark:border-white/10">
                    {log.timestamp ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString() : "..."}
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center text-gray-500 py-8 italic">No audit logs found. Perform an admin action to see logs.</div>
              )}
            </div>
          </div>

        </div>
      </main>
    </ProtectedRoute>
  );
}