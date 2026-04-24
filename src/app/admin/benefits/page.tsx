"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gift, Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

interface EmployeePayroll {
  id: string;
  fullName: string;
  baseSalary?: number;
  salaryType?: "monthly" | "hourly";
}

interface BonusCalculation {
  userId: string;
  fullName: string;
  baseSalary: number;
  monthsWorked: number;
  calculatedAmount: number;
  status: "pending" | "distributed";
}

export default function BenefitsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [bonusRoster, setBonusRoster] = useState<BonusCalculation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!isAdmin) return;
    const fetchEmployees = async () => {
      const q = query(collection(db, "users"), where("role", "==", "employee"));
      const snapshot = await getDocs(q);
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeePayroll)));
    };
    fetchEmployees();
  }, [isAdmin]);

  const handleGenerateRoster = () => {
    setIsGenerating(true);

    const eligibleEmployees = employees.filter(emp => emp.baseSalary && emp.salaryType === "monthly");
    
    if (eligibleEmployees.length === 0) {
      toast.error("No employees found with a configured monthly base salary. Please update the Payroll page first.");
      setIsGenerating(false);
      return;
    }

    const roster: BonusCalculation[] = eligibleEmployees.map(emp => ({
      userId: emp.id,
      fullName: emp.fullName || "Unnamed",
      baseSalary: emp.baseSalary!,
      monthsWorked: 12,
      calculatedAmount: emp.baseSalary!,
      status: "pending"
    }));

    setBonusRoster(roster);
    toast.success("13th-Month roster generated!");
    setIsGenerating(false);
  };

  const handleUpdateMonths = (userId: string, months: number) => {
    if (months < 1 || months > 12) return;
    
    setBonusRoster(prev => prev.map(calc => {
      if (calc.userId === userId) {
        const newAmount = (calc.baseSalary * months) / 12;
        return { ...calc, monthsWorked: months, calculatedAmount: newAmount };
      }
      return calc;
    }));
  };

  const handleDistributeAll = async () => {
    const pendingBonuses = bonusRoster.filter(b => b.status === "pending");
    if (pendingBonuses.length === 0) return toast.error("No pending bonuses to distribute.");

    setIsDistributing(true);
    try {
      const promises = pendingBonuses.map(bonus => 
        addDoc(collection(db, "bonuses"), {
          userId: bonus.userId,
          type: "13th Month Pay",
          year: currentYear,
          amount: bonus.calculatedAmount,
          distributedAt: serverTimestamp()
        })
      );

      await Promise.all(promises);

      setBonusRoster(prev => prev.map(calc => ({ ...calc, status: "distributed" }))); 
      toast.success("All 13th-Month bonuses have been securely distributed!"); 

    } catch (error) {
        console.error("Error distributing bonuses:", error);
      toast.error("Failed to distribute bonuses.");
    } finally {
      setIsDistributing(false);
    }
  };

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
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-rose-400/20 dark:bg-rose-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Gift className="w-10 h-10 text-rose-500" />
                Benefits Administration
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Automated DOLE 13th-Month Pay calculation and distribution for {currentYear}.
              </p>
            </div>
            
            <button 
              onClick={handleGenerateRoster}
              disabled={isGenerating || bonusRoster.length > 0}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              <Calculator className="w-5 h-5" />
              {bonusRoster.length > 0 ? "Roster Generated" : "Generate Roster"}
            </button>
          </div>

          {bonusRoster.length > 0 ? (
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden flex flex-col">
              
              <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">DOLE Compliance Engine Active</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300">Formula: (Total Basic Salary Earned) ÷ 12. Adjust &quot;Months Worked&quot; for mid-year hires.</p>
                  </div>
                </div>
                {bonusRoster.some(b => b.status === "pending") && (
                  <button 
                    onClick={handleDistributeAll}
                    disabled={isDistributing}
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    {isDistributing ? "Processing..." : "Distribute All"}
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                      <th className="pb-4 pl-2">Employee</th>
                      <th className="pb-4">Monthly Base</th>
                      <th className="pb-4">Months Worked</th>
                      <th className="pb-4 text-rose-500">Calculated 13th Month</th>
                      <th className="pb-4 text-right pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {bonusRoster.map(calc => (
                      <tr key={calc.userId} className="text-sm">
                        <td className="py-4 pl-2 font-bold text-gray-900 dark:text-white">{calc.fullName}</td>
                        <td className="py-4 font-mono text-gray-600 dark:text-gray-300">₱{calc.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4">
                          <input 
                            type="number" 
                            min="1" 
                            max="12" 
                            value={calc.monthsWorked}
                            onChange={(e) => handleUpdateMonths(calc.userId, parseInt(e.target.value) || 0)}
                            disabled={calc.status === "distributed"}
                            className="w-20 bg-slate-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-center text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="py-4 font-mono font-bold text-rose-600 dark:text-rose-400 text-lg">
                          ₱{calc.calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 text-right pr-2">
                          {calc.status === "distributed" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                              <CheckCircle2 className="w-4 h-4" /> Distributed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/20 px-2.5 py-1 rounded-lg">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-12 shadow-xl flex flex-col items-center justify-center text-center">
              <Gift className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Roster Generated</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Click the &quot;Generate Roster&quot; button above to pull eligible employees and calculate their 13th-Month pay.
              </p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}