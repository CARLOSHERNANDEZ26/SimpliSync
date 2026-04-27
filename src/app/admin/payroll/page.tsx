"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Banknote, Edit2, Save, XCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import { logAdminAction } from "@/lib/audit";

interface EmployeePayroll {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  baseSalary?: number;
  salaryType?: "monthly" | "hourly";
}

export default function PayrollPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSalary, setEditSalary] = useState<number | "">("");
  const [editType, setEditType] = useState<"monthly" | "hourly">("monthly");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EmployeePayroll));
      setEmployees(fetched);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleEditClick = (emp: EmployeePayroll) => {
    setEditingId(emp.id);
    setEditSalary(emp.baseSalary || "");
    setEditType(emp.salaryType || "monthly");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditSalary("");
  };

 const handleSaveSalary = async (empId: string) => {
    if (editSalary === "") return toast.error("Please enter a valid salary amount.");
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", empId), {
        baseSalary: Number(editSalary),
        salaryType: editType
      });
      
      toast.success("Compensation details updated!");
      
      if (user?.email) {
        const empName = employees.find(e => e.id === empId)?.fullName || "Unknown Employee";
        
        await logAdminAction(
          user.email,
          `Updated Compensation: ${editType} @ ₱${Number(editSalary).toLocaleString()}`,
          `Target: ${empName} (${empId})`
        );
      }

      setEditingId(null);
    } catch (error) {
        console.error("Error updating salary:", error);
      toast.error("Failed to update salary.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin && user) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] text-gray-500">
          Access Denied. Admin privileges required.
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Banknote className="w-10 h-10 text-emerald-500" />
                Compensation setup
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Manage employee base salaries and hourly rates to enable automated benefits.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="pb-4 pl-2">Employee</th>
                  <th className="pb-4">Department</th>
                  <th className="pb-4">Compensation Type</th>
                  <th className="pb-4">Base Amount (₱)</th>
                  <th className="pb-4 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-2">
                      <div className="font-bold text-gray-900 dark:text-white">{emp.fullName || "Unnamed"}</div>
                      <div className="text-xs text-gray-500">{emp.email}</div>
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-300">
                      {emp.department ? <span className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-md text-xs">{emp.department}</span> : <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    
                    {/* Inline Editing Mode */}
                    {editingId === emp.id ? (
                      <>
                        <td className="py-3">
                          <select 
                            value={editType} 
                            onChange={(e) => setEditType(e.target.value as "monthly" | "hourly")}
                            className="bg-slate-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="monthly">Monthly Salary</option>
                            <option value="hourly">Hourly Rate</option>
                          </select>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 font-bold">₱</span>
                            <input 
                              type="number" 
                              value={editSalary} 
                              onChange={(e) => setEditSalary(Number(e.target.value))}
                              placeholder="0.00"
                              className="w-32 bg-slate-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={handleCancelEdit} disabled={isSaving} className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors">
                              <XCircle className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleSaveSalary(emp.id)} disabled={isSaving} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold text-xs transition-colors disabled:opacity-50">
                              <Save className="w-4 h-4" /> Save
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      /* Display Mode */
                      <>
                        <td className="py-4">
                          {emp.salaryType ? (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${emp.salaryType === 'monthly' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
                              {emp.salaryType}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs italic">Not set</span>
                          )}
                        </td>
                        <td className="py-4 font-mono font-medium text-gray-900 dark:text-gray-200">
                          {emp.baseSalary ? `₱${emp.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : <span className="text-rose-400 text-xs">Missing</span>}
                        </td>
                        <td className="py-4 text-right pr-2">
                          <button onClick={() => handleEditClick(emp)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 italic">No employees found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}