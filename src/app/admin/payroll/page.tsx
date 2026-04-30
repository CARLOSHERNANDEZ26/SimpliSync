"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Banknote, Edit2, Save, XCircle, Search, Calculator, ScanSearch, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { logAdminAction } from "@/lib/audit";
import { calculateMandatoryDeductions } from "@/lib/deductions";  
import { getSuggestedDeduction } from "@/services/payrollEngine";

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
  
  // 🔥 State for the Automated Absence Scanner
  const [isScanning, setIsScanning] = useState<string | null>(null);

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

  const handleSaveSalary = async (empId: string, customSalaryAmount?: number) => {
    const finalAmount = customSalaryAmount !== undefined ? customSalaryAmount : editSalary;
    if (finalAmount === "") return toast.error("Please enter a valid salary amount.");
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", empId), {
        baseSalary: Number(finalAmount),
        salaryType: editType
      });
      
      toast.success("Compensation details updated!");
      
      if (user?.email) {
        const empName = employees.find(e => e.id === empId)?.fullName || "Unknown Employee";
        await logAdminAction(
          user.email,
          `Updated Compensation: ${editType} @ ₱${Number(finalAmount).toLocaleString()}`,
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

  const handleScanAbsences = async (emp: EmployeePayroll) => {
    if (!emp.baseSalary || emp.salaryType !== "monthly") {
      return toast.error("Set a monthly base salary first.");
    }

    setIsScanning(emp.id);
    const today = new Date();
    
    try {
      const result = await getSuggestedDeduction(emp.id, emp.baseSalary, today.getFullYear(), today.getMonth() + 1, 22);

      if (result.unpaidAbsences === 0) {
        toast.success(`${emp.fullName} has perfect attendance or approved leaves. No deductions detected.`);
        setIsScanning(null);
        return;
      }

      const newSalary = emp.baseSalary - result.suggestedDeduction;

      toast.custom((t) => (
        <div className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-300 max-w-md w-full bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border border-gray-200 dark:border-white/10`}>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-bold">Unpaid Absences Detected</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            The system detected <strong>{result.unpaidAbsences} unpaid absences</strong> for {emp.fullName} this month.
          </p>
          <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-lg border border-gray-200 dark:border-white/5 mb-4 text-xs font-mono text-gray-700 dark:text-gray-300">
            <div>Expected Days: {result.expectedDays}</div>
            <div>Days Clocked In: {result.daysPresent}</div>
            <div>Approved Paid Leaves: {result.paidLeaveDays}</div>
            <div className="text-rose-500 font-bold mt-1">Suggested Deduction: ₱{result.suggestedDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => { handleSaveSalary(emp.id, newSalary); toast.dismiss(t.id); }} 
              className="flex-1 px-4 py-2.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md shadow-amber-500/20 transition-colors"
            >
              Apply Deduction
            </button>
          </div>
        </div>
      ), { id: `scan-${emp.id}`, duration: 8000 });

    } catch (error) {
      console.error(error);
      toast.error("Failed to scan absences.");
    } finally {
      setIsScanning(null);
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
          
          {/* 1. Header & Search Control Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Banknote className="w-10 h-10 text-emerald-500" />
                Compensation Setup
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Manage base salaries. Statutory deductions are automatically calculated by the DOLE compliance engine.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search employees..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 md:py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* 2. Main Employee Payroll Table Section */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="pb-4 pl-2">Employee</th>
                  <th className="pb-4">Comp. Type</th>
                  <th className="pb-4">Base Amount</th>
                  <th className="pb-4">Est. Deductions</th>
                  <th className="pb-4">Net Pay</th>
                  <th className="pb-4 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredEmployees.map(emp => {
                  const deductions = emp.baseSalary && emp.salaryType === 'monthly' 
                    ? calculateMandatoryDeductions(emp.baseSalary) 
                    : null;

                  return (
                    <tr key={emp.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-2">
                        <div className="font-bold text-gray-900 dark:text-white">{emp.fullName || "Unnamed"}</div>
                        <div className="text-xs text-gray-500">{emp.email}</div>
                      </td>
                      
                      {/* Row Editing Mode Layout */}
                      {editingId === emp.id ? (
                        <>
                          <td className="py-3">
                            <select 
                              value={editType} 
                              onChange={(e) => setEditType(e.target.value as "monthly" | "hourly")}
                              className="bg-slate-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 min-w-[120px] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
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
                                className="w-32 bg-slate-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            </div>
                          </td>
                          <td colSpan={2} className="py-3">
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600/70 dark:text-emerald-400/70 italic font-medium bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg w-fit">
                              <Calculator className="w-3.5 h-3.5" /> Auto-calculated upon save
                            </span>
                          </td>
                          <td className="py-3 text-right pr-2">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={handleCancelEdit} disabled={isSaving} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                                <XCircle className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleSaveSalary(emp.id)} disabled={isSaving} className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20 active:scale-95">
                                <Save className="w-4 h-4" /> Save
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* Standard Row Display Layout */
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
                            {emp.baseSalary ? `₱${emp.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : <span className="text-rose-400 text-xs font-sans font-semibold">Missing Data</span>}
                          </td>
                          
                          <td className="py-4">
                            {deductions ? (
                              <div className="flex flex-col">
                                <span className="text-rose-500 font-mono font-medium">-₱{deductions.totalMandatory.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-0.5">SSS / PHIC / HDMF</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs italic">{emp.salaryType === 'hourly' ? "Time-based" : "N/A"}</span>
                            )}
                          </td>

                          <td className="py-4">
                            {deductions && emp.baseSalary ? (
                              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold text-lg">
                                ₱{(emp.baseSalary - deductions.totalMandatory).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs italic">Pending Setup</span>
                            )}
                          </td>

                          {/* 3. Row Action Buttons (Scanner & Edit) Section */}
                          <td className="py-4 text-right pr-2">
                            <div className="flex items-center justify-end gap-2">
                              {emp.salaryType === 'monthly' && emp.baseSalary && (
                                <button 
                                  onClick={() => handleScanAbsences(emp)} 
                                  disabled={isScanning === emp.id}
                                  title="Scan for absences this month"
                                  className="p-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors active:scale-90 disabled:opacity-50"
                                >
                                  <ScanSearch className={`w-4 h-4 ${isScanning === emp.id ? 'animate-pulse' : ''}`} />
                                </button>
                              )}
                              <button onClick={() => handleEditClick(emp)} className="p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 rounded-lg transition-colors active:scale-90">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500 italic">No employees found matching your search.</td>
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