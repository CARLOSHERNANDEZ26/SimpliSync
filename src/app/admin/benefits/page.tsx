"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gift, Calculator, CheckCircle2, History, AlertTriangle } from "lucide-react";
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
  salaryType: "monthly" | "hourly"; 
  monthsWorked: number;
  daysPresent: number;
  paidLeaveDays: number;
  unpaidAbsences: number;
  totalEarnedBasic: number; 
  calculatedAmount: number; 
  status: "pending" | "distributed";
  isAlreadyPaid?: boolean; 
}

interface DistributionRecord {
  id: string;
  userId?: string;
  fullName: string;
  amount: number;
  totalEarnedBasic?: number;
  unpaidAbsences?: number;
  monthsWorked: number;
  year: number;
  distributedAt?: Timestamp | Date | { seconds: number; nanoseconds: number };
  type?: string;
}

export default function BenefitsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  
  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [bonusRoster, setBonusRoster] = useState<BonusCalculation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historicalRecords, setHistoricalRecords] = useState<DistributionRecord[]>([]);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!isAdmin) return;
    const fetchEmployees = async () => {
      const q = query(collection(db, "users"), where("role", "==", "employee"));
      const snap = await getDocs(q);
      setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeePayroll)));
    };
    fetchEmployees();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const q = query(collection(db, "benefitDistributions"), where("year", "==", currentYear));
        const snap = await getDocs(q);

        setHistoricalRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DistributionRecord)));
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [isAdmin, currentYear]);

  const handleGenerateRoster = async () => {
    setIsGenerating(true);
    setBonusRoster([]);

    try {
      const calculations: BonusCalculation[] = [];
      const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
      
      for (const emp of employees) {
        if (!emp.baseSalary) continue; 

        // Has this employee already received 13th month this year?
        const hasBeenPaid = historicalRecords.some(record => record.userId === emp.id);

        const qAtt = query(
          collection(db, "attendanceLogs"), 
          where("userId", "==", emp.id),
          where("timeIn", ">=", startOfYear),
          where("timeIn", "<=", endOfYear)
        );
        const snapAtt = await getDocs(qAtt);
        
        let firstLogDate: Date | null = null;
        const uniqueDaysPresent = new Set<string>();

        snapAtt.forEach(doc => {
          const data = doc.data();
          if (data.timeIn) {
            const date = data.timeIn.toDate();
            if (!firstLogDate || date < firstLogDate) firstLogDate = date;
            uniqueDaysPresent.add(date.toISOString().split('T')[0]);
          }
        });
        const daysPresent = uniqueDaysPresent.size;

        const qLeave = query(
          collection(db, "leaveRequests"), 
          where("userId", "==", emp.id), 
          where("status", "==", "approved")
        );
        const snapLeave = await getDocs(qLeave);

        let paidLeaveDays = 0;
        snapLeave.forEach(doc => {
           const data = doc.data();
           const leaveStart = new Date(data.startDate);
           leaveStart.setHours(0,0,0,0);
           const leaveEnd = new Date(data.endDate);
           leaveEnd.setHours(23,59,59,999);
           
           if (leaveStart <= endOfYear && leaveEnd >= startOfYear) {
               const overlapStart = leaveStart < startOfYear ? startOfYear : leaveStart;
               const overlapEnd = leaveEnd > endOfYear ? endOfYear : leaveEnd;
               const diffDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 3600 * 24));
               paidLeaveDays += diffDays;
           }
        });

        let monthsWorked = 0;
        if (firstLogDate) {
          const validDate = firstLogDate as Date; 
          const now = new Date();
          const endEvalDate = now.getFullYear() === currentYear ? now : endOfYear;
          const diffMonths = (endEvalDate.getFullYear() - validDate.getFullYear()) * 12 + (endEvalDate.getMonth() - validDate.getMonth());
          monthsWorked = diffMonths < 0 ? 0 : Math.min(diffMonths + 1, 12); 
        }

        let totalEarnedBasic = 0;
        let unpaidAbsences = 0;

        if (emp.salaryType === "hourly") {
            const hourlyRate = emp.baseSalary;
            totalEarnedBasic = (daysPresent + paidLeaveDays) * 8 * hourlyRate;
        } else {
            const monthlySalary = emp.baseSalary;
            const expectedDays = monthsWorked * 22; 
            unpaidAbsences = expectedDays - (daysPresent + paidLeaveDays);
            if (unpaidAbsences < 0) unpaidAbsences = 0;

            const dailyRate = monthlySalary / 22;
            totalEarnedBasic = (monthlySalary * monthsWorked) - (unpaidAbsences * dailyRate);
        }

        if (totalEarnedBasic < 0) totalEarnedBasic = 0;

        const calculatedAmount = totalEarnedBasic / 12;

        calculations.push({
          userId: emp.id,
          fullName: emp.fullName,
          baseSalary: emp.baseSalary,
          salaryType: emp.salaryType || "monthly",
          monthsWorked,
          daysPresent,
          paidLeaveDays,
          unpaidAbsences,
          totalEarnedBasic,
          calculatedAmount,
          status: "pending",
          isAlreadyPaid: hasBeenPaid // 
        });
      }

      setBonusRoster(calculations);
      toast.success("Eligible roster & DOLE calculations generated successfully.");
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate roster.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDistributeAll = async () => {
    // Filter out those who are already paid
    const pendingDistributions = bonusRoster.filter(calc => !calc.isAlreadyPaid);

    if (pendingDistributions.length === 0) {
      toast.error("No pending employees left to distribute to.");
      return;
    }
    
    setIsDistributing(true);

    try {
      const batchRef = collection(db, "benefitDistributions");
      
      for (const calc of pendingDistributions) {
        await addDoc(batchRef, {
          userId: calc.userId,
          fullName: calc.fullName,
          amount: calc.calculatedAmount,
          totalEarnedBasic: calc.totalEarnedBasic,
          unpaidAbsences: calc.unpaidAbsences,
          monthsWorked: calc.monthsWorked,
          year: currentYear,
          distributedAt: serverTimestamp(),
          type: "13th Month Pay"
        });
      }

      if (user?.email) {
        await logAdminAction(
          user.email, 
          `Distributed 13th Month Pay for ${currentYear}`, 
          `Total Employees: ${pendingDistributions.length}`
        );
      }

      toast.success("13th Month Pay officially distributed and logged!");
      
      // Update local history for real-time UI feel
      setHistoricalRecords(prev => [
        ...prev, 
        ...pendingDistributions.map(b => ({
          id: Math.random().toString(), 
          userId: b.userId,
          fullName: b.fullName,
          amount: b.calculatedAmount,
          monthsWorked: b.monthsWorked,
          year: currentYear,
          distributedAt: new Date(), 
          type: "13th Month Pay"
        } as DistributionRecord))
      ]);
      
      // Update roster visually to gray them out immediately
      setBonusRoster(prev => prev.map(calc => ({ ...calc, isAlreadyPaid: true })));

    } catch (error) {
      console.error(error);
      toast.error("Failed to distribute benefits.");
    } finally {
      setIsDistributing(false);
    }
  };

  const formatPeso = (amount: number) => `₱ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatSafeDate = (timestamp: Timestamp | Date | { seconds: number; nanoseconds: number } | null | undefined) => {
    if (!timestamp) return "Just now";
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    if ('toDate' in timestamp && typeof timestamp.toDate === 'function') return timestamp.toDate().toLocaleDateString();
    if ('seconds' in timestamp) return new Date(timestamp.seconds * 1000).toLocaleDateString();
    return "Invalid Date";
  };

  // Only sum the liability for employees who haven't been paid yet
  const totalCalculated = bonusRoster
    .filter(item => !item.isAlreadyPaid)
    .reduce((sum, item) => sum + item.calculatedAmount, 0);

  if (!isAdmin && user) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center">Access Denied.</div></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Gift className="w-10 h-10 text-indigo-500" />
              DOLE 13th-Month Generator
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Automated statutory benefit calculation based on actual yearly earnings.
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-5 rounded-2xl mb-8 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">DOLE Compliance Notice</h4>
              <p className="text-sm text-indigo-800 dark:text-indigo-200 mt-1 leading-relaxed">
                The 13th-month pay is strictly computed as <strong className="font-black">1/12 of the total basic salary actually earned</strong> within the calendar year. Unpaid absences, tardiness, and unworked days directly reduce the total earned basic salary, proportionately lowering the 13th-month pay.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl min-h-[400px]">
                
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-indigo-500" />
                      Pending Roster ({currentYear})
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Eligible Employees: {employees.length}</p>
                  </div>
                  <button 
                    onClick={handleGenerateRoster}
                    disabled={isGenerating || employees.length === 0}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 active:scale-95"
                  >
                    {isGenerating ? "Scanning Year Logs..." : "Scan & Generate"}
                  </button>
                </div>

                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                        <th className="px-4 py-3 rounded-tl-xl">Employee</th>
                        <th className="px-4 py-3">Base Salary</th>
                        <th className="px-4 py-3">Yearly Records</th>
                        <th className="px-4 py-3 text-right">Actual Earned Pay</th>
                        <th className="px-4 py-3 text-right rounded-tr-xl">13th Month Pay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {bonusRoster.length > 0 ? (
                        bonusRoster.map((calc, idx) => (
                          <tr 
                            key={idx} 
                            className={`transition-colors ${calc.isAlreadyPaid ? "opacity-50 bg-gray-50 dark:bg-black/20" : "hover:bg-slate-50 dark:hover:bg-white/[0.02]"}`}
                          >
                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {calc.fullName}
                            </td>
                            
                            <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300">
                              <div className="flex flex-col">
                                <span>{formatPeso(calc.baseSalary)}</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">
                                  {calc.salaryType === 'hourly' ? 'Per Hour' : 'Per Month'}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{calc.monthsWorked} Mos Active</span>
                                {calc.salaryType === "monthly" && calc.unpaidAbsences > 0 ? (
                                  <span className="text-[10px] text-rose-500 font-bold">{calc.unpaidAbsences} Unpaid Absences</span>
                                ) : (
                                  <span className="text-[10px] text-emerald-500 font-bold">{calc.daysPresent + calc.paidLeaveDays} Days Paid</span>
                                )}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">
                              {formatPeso(calc.totalEarnedBasic)}
                            </td>

                            <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                              {calc.isAlreadyPaid ? (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-200 dark:bg-white/10 px-2.5 py-1 rounded-md">
                                  Distributed
                                </span>
                              ) : (
                                formatPeso(calc.calculatedAmount)
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-gray-500 italic">
                            Click &quot;Scan & Generate&quot; to calculate yearly eligibility.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Disbursement Summary</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/5">
                    <span className="text-sm text-gray-500">Pending Distribution</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {bonusRoster.filter(c => !c.isAlreadyPaid).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-white/5">
                    <span className="text-sm text-gray-500">Company Liability</span>
                    <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">{formatPeso(totalCalculated)}</span>
                  </div>
                </div>

                <button 
                  onClick={handleDistributeAll}
                  disabled={bonusRoster.filter(c => !c.isAlreadyPaid).length === 0 || isDistributing}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isDistributing ? "Processing Ledger..." : "Log Distribution"}
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-3xl p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <History className="w-4 h-4" /> Disbursement Ledger
                </h3>
                
                {isLoadingHistory ? (
                  <div className="animate-pulse text-sm text-gray-400 text-center py-4">Loading ledger...</div>
                ) : historicalRecords.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {historicalRecords.map(record => (
                      <div key={record.id} className="bg-white dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{record.fullName}</p>
                          <p className="text-[10px] text-gray-500 uppercase">
                            {String(record.year || currentYear)} • {String(record.monthsWorked || 0)} Mos • {formatSafeDate(record.distributedAt)}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded">
                          {formatPeso(record.amount || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-gray-400 italic py-6">
                    No records found for {currentYear}.
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}