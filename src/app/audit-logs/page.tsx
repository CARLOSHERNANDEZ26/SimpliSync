"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, orderBy, onSnapshot, limit, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, Search, Activity, UserCog, Lock, Banknote } from "lucide-react";

interface SystemLog {
  id: string;
  actionType: string;
  details: string;
  adminEmail: string;
  timestamp: Timestamp | null;
}

export default function AuditLogsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    if (!isAdmin) return;

    // Fetch the latest 100 system logs
    const q = query(
      collection(db, "systemLogs"),
      orderBy("timestamp", "desc"),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemLog)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const getActionIcon = (type: string) => {
    switch (type) {
      case "SECURITY": return <Lock className="w-4 h-4 text-rose-500" />;
      case "HR_ACTION": return <UserCog className="w-4 h-4 text-amber-500" />;
      case "PAYROLL": return <Banknote className="w-4 h-4 text-emerald-500" />;
      case "ATTENDANCE": return <Activity className="w-4 h-4 text-blue-500" />;
      default: return <ShieldCheck className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionBadge = (type: string) => {
    switch (type) {
      case "SECURITY": return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
      case "HR_ACTION": return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
      case "PAYROLL": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
      case "ATTENDANCE": return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
      default: return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300 border-gray-200 dark:border-white/20";
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || log.actionType === filterType;
    return matchesSearch && matchesType;
  });

  if (!isAdmin && user) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">Access Denied.</div></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <Navbar />
        
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500" />
              System Audit Trail
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
              Immutable, chronological records of all administrative and security actions.
            </p>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 mb-6 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search audit events or administrator email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-gray-900 dark:text-white"
              />
            </div>
            
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-gray-900 dark:text-white sm:w-48 cursor-pointer"
            >
              <option value="ALL">All Events</option>
              <option value="SECURITY">Security</option>
              <option value="HR_ACTION">HR Actions</option>
              <option value="PAYROLL">Payroll</option>
              <option value="ATTENDANCE">Attendance</option>
            </select>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="w-full">
              {/* Highly optimized mobile-to-desktop stacking table */}
              <table className="w-full text-left border-collapse block lg:table">
                <thead className="hidden lg:table-header-group">
                  <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/10">
                    <th className="pb-3 px-4 w-48">Timestamp</th>
                    <th className="pb-3 px-4 w-40">Event Type</th>
                    <th className="pb-3 px-4 w-56">Administrator</th>
                    <th className="pb-3 px-4">Event Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 block lg:table-row-group">
                  {isLoading ? (
                    <tr className="block lg:table-row">
                      <td colSpan={4} className="block lg:table-cell py-12 text-center text-indigo-500 animate-pulse font-medium">Decrypting secure logs...</td>
                    </tr>
                  ) : filteredLogs.length > 0 ? (
                    filteredLogs.map(log => (
                      <tr key={log.id} className="block lg:table-row bg-white dark:bg-transparent border lg:border-none border-gray-100 dark:border-white/5 mb-4 lg:mb-0 rounded-2xl p-4 lg:p-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        
                        <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 px-2 lg:px-4 text-gray-600 dark:text-gray-400 font-mono text-xs border-b border-gray-100 dark:border-white/5 lg:border-none">
                          <span className="lg:hidden font-bold uppercase tracking-widest text-[10px] text-gray-400">Timestamp</span>
                          <span>{log.timestamp ? log.timestamp.toDate().toLocaleString() : "Syncing..."}</span>
                        </td>
                        
                        <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 px-2 lg:px-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                          <span className="lg:hidden font-bold uppercase tracking-widest text-[10px] text-gray-400">Type</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionBadge(log.actionType)}`}>
                            {getActionIcon(log.actionType)} {log.actionType.replace("_", " ")}
                          </span>
                        </td>
                        
                        <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 px-2 lg:px-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 lg:border-none text-sm">
                          <span className="lg:hidden font-bold uppercase tracking-widest text-[10px] text-gray-400">Admin</span>
                          <span className="truncate max-w-[200px]">{log.adminEmail}</span>
                        </td>
                        
                        <td className="flex flex-col lg:table-cell py-3 lg:py-4 px-2 lg:px-4 text-gray-700 dark:text-gray-300 text-sm">
                          <span className="lg:hidden font-bold uppercase tracking-widest text-[10px] text-gray-400 mb-1">Details</span>
                          <span className="leading-relaxed">{log.details}</span>
                        </td>
                        
                      </tr>
                    ))
                  ) : (
                    <tr className="block lg:table-row">
                      <td colSpan={4} className="block lg:table-cell py-12 text-center text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 mt-4 lg:w-full">
                        No audit records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}