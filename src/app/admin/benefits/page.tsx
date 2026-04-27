"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gift, Calculator, CheckCircle2, AlertCircle, Trash2, History, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { logAdminAction } from "@/lib/audit";

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!isAdmin) return;
    
    const fetchData = async () => {
      try {
        const qUsers = query(collection(db, "users"), where("role", "==", "employee"));
        const usersSnap = await getDocs(qUsers);
        const emps = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeePayroll));
        setEmployees(emps);

        const qBonuses = query(collection(db, "bonuses"), where("year", "==", currentYear));
        const bonusesSnap = await getDocs(qBonuses);
        
        const existingBonuses = bonusesSnap.docs
          .map(doc => doc.data())
          .filter(data => data.type === "13th Month Pay");

        if (existingBonuses.length > 0) {
          const historyRoster: BonusCalculation[] = existingBonuses.map(b => {
            const emp = emps.find(e => e.id === b.userId);
            return {
              userId: b.userId,
              fullName: emp?.fullName || "Unknown Employee",
              baseSalary: emp?.baseSalary || 0,
              monthsWorked: 12,
              calculatedAmount: b.amount,
              status: "distributed"
            };
          });
          setBonusRoster(historyRoster);
        }
      } catch (error) {
        console.error("Error fetching benefits data:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchData();
  }, [isAdmin, currentYear]);

  const handleGenerateRoster = () => {
    setIsGenerating(true);

    const eligibleEmployees = employees.filter(emp => emp.baseSalary && emp.salaryType === "monthly");
    
    if (eligibleEmployees.length === 0) {
      toast.error("No eligible employees found. Please update the Payroll page first.");
      setIsGenerating(false);
      return;
    }

    const newRoster: BonusCalculation[] = eligibleEmployees.map(emp => {
      const alreadyDistributed = bonusRoster.find(b => b.userId === emp.id && b.status === "distributed");
      
      if (alreadyDistributed) {
        return alreadyDistributed;
      }

      return {
        userId: emp.id,
        fullName: emp.fullName || "Unnamed",
        baseSalary: emp.baseSalary!,
        monthsWorked: 12,
        calculatedAmount: emp.baseSalary!,
        status: "pending"
      };
    });

    const newPendingCount = newRoster.filter(r => r.status === "pending").length;

    setBonusRoster(newRoster);
    
    if (newPendingCount > 0) {
      toast.success(`Generated calculations for ${newPendingCount} new eligible employees.`);
    } else {
      toast.success("All eligible employees have already received their 13th-Month Pay this year.");
    }
    
    setIsGenerating(false);
  };

  const handleUpdateMonths = (userId: string, months: number) => {
    if (months < 1 || months > 12) return;
    
    setBonusRoster(prev => prev.map(calc => {
      if (calc.userId === userId && calc.status === "pending") {
        const newAmount = (calc.baseSalary * months) / 12;
        return { ...calc, monthsWorked: months, calculatedAmount: newAmount };
      }
      return calc;
    }));
  };

 const executeClearRoster = () => {
    try {
      setBonusRoster(prev => prev.filter(b => b.status === "distributed"));
      toast.success("Pending calculations cleared.", { duration: 1500 });
    } catch (error: unknown) {
      console.error("Clear Roster Error:", error);
      toast.error("Failed to clear roster.");
    }
  };

  const confirmClearRoster = () => {
    const hasPending = bonusRoster.some(b => b.status === "pending");
    if (!hasPending) {
      return toast.error("No pending calculations to clear.");
    }

    toast.custom((t) => (
      <div className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-00 max-w-md w-full bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border border-gray-200 dark:border-white/10`}>
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-bold">Clear Pending Roster?</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          This will discard pending 13th-month calculations. Distributed records will remain untouched.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-4 py-2.5 text-sm font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { executeClearRoster(); toast.dismiss(t.id); }} 
            className="flex-1 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20 transition-colors"
          >
            Clear Roster
          </button>
        </div>
      </div>
    ), { id: 'confirm-clear', duration: 5000 });
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

      setBonusRoster(prev => prev.map(calc => 
        calc.status === "pending" ? { ...calc, status: "distributed" } : calc
      )); 
      
      toast.success("All pending 13th-Month bonuses have been securely distributed!"); 
      
      if (user?.email) {
        const totalAmount = pendingBonuses.reduce((sum, b) => sum + b.calculatedAmount, 0);
        await logAdminAction(
          user.email, 
          `Distributed 13th-Month Pay to ${pendingBonuses.length} employees`, 
          `Total: ₱${totalAmount.toLocaleString()} (FY ${currentYear})`
        );
      }
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
              disabled={isGenerating || isLoadingHistory}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              <Calculator className="w-5 h-5" />
              Generate / Update Roster
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center items-center py-20 text-gray-500 flex-col gap-3">
              <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
              <p className="text-sm font-bold uppercase tracking-widest">Syncing Records...</p>
            </div>
          ) : bonusRoster.length > 0 ? (
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden flex flex-col">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-rose-50 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-500/20 mb-6 gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-rose-500 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 dark:text-rose-400">DOLE Compliance Engine</h4>
                    <p className="text-xs text-rose-700 dark:text-rose-300">
                      {bonusRoster.some(b => b.status === "pending") 
                        ? "Review pending calculations before distributing." 
                        : `Viewing historical distribution records for ${currentYear}.`}
                    </p>
                  </div>
                </div>
                
                {bonusRoster.some(b => b.status === "pending") && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={confirmClearRoster}
                      disabled={isDistributing}
                      className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 px-3 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Clear Pending
                    </button>
                    <button 
                      onClick={handleDistributeAll}
                      disabled={isDistributing}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 shadow-md shadow-rose-500/20"
                    >
                      {isDistributing ? "Processing..." : "Distribute Pending"}
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                      <th className="pb-4 pl-2">Employee</th>
                      <th className="pb-4">Monthly Base</th>
                      <th className="pb-4">Months Worked</th>
                      <th className="pb-4 text-rose-500">13th Month Pay</th>
                      <th className="pb-4 text-right pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {bonusRoster.map(calc => (
                      <tr key={calc.userId} className="text-sm">
                        <td className="py-4 pl-2 font-bold text-gray-900 dark:text-white">{calc.fullName}</td>
                        <td className="py-4 font-mono text-gray-600 dark:text-gray-300">₱{calc.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="py-4">
                          {calc.status === "distributed" ? (
                            <span className="px-3 text-gray-500 dark:text-gray-400">Locked</span>
                          ) : (
                            <input 
                              type="number" 
                              min="1" 
                              max="12" 
                              value={calc.monthsWorked}
                              onChange={(e) => handleUpdateMonths(calc.userId, parseInt(e.target.value) || 0)}
                              className="w-20 bg-slate-100 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-center text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                            />
                          )}
                        </td>
                        <td className="py-4 font-mono font-bold text-rose-600 dark:text-rose-400 text-lg">
                          ₱{calc.calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 text-right pr-2">
                          {calc.status === "distributed" ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                              <CheckCircle2 className="w-4 h-4" /> Distributed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-500/30">
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
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-12 shadow-xl flex flex-col items-center justify-center text-center mt-6">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mb-4">
                <History className="w-10 h-10 text-rose-300 dark:text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Records for {currentYear}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Click &quot;Generate / Update Roster&quot; to pull eligible employees and calculate their 13th-Month pay.
              </p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}