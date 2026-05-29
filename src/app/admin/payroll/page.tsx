"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Banknote, Edit2, Save, XCircle, Search, Calculator, Calendar, FileText, CheckCircle2, Download, Printer, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import { calculateMandatoryDeductions } from "@/lib/deductions";  
import { 
  calculateHourlyRate, 
  calculateLatePenaltyMinutes, 
  calculateUndertimeMinutes, 
  calculateTimeDeductionPeso,
  calculateOvertimePay 
} from "@/services/payrollEngine";

interface EmployeePayroll {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  baseSalary?: number;
  salaryType?: "monthly" | "hourly";
}

interface PayrollResult {
  semiMonthlyBase: number;
  hourlyRate: number;
  daysPresent: number;
  paidLeaveDays: number; 
  unpaidAbsences: number; 
  absenceDeductionPeso: number; 
  totalLateMins: number;
  totalUndertimeMins: number;
  timePenaltiesPeso: number;
  totalOtMinutes: number; 
  otPayPeso: number;      
  sss: number;
  philhealth: number;
  pagibig: number;
  totalMandatory: number;
  netPay: number;
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

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [cutoffPeriod, setCutoffPeriod] = useState<1 | 2>(1);
  const [applyDeductions, setApplyDeductions] = useState(true);
  
  const [payrollData, setPayrollData] = useState<Record<string, PayrollResult>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<{ emp: EmployeePayroll; result: PayrollResult } | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "users"), where("role", "==", "employee"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeePayroll)));
    });
    return () => unsubscribe();
  }, [isAdmin]);

  const handleEditClick = (emp: EmployeePayroll) => {
    setEditingId(emp.id);
    setEditSalary(emp.baseSalary || "");
    setEditType(emp.salaryType || "monthly");
  };

  const handleSaveSalary = async (empId: string) => {
    if (editSalary === "") return toast.error("Please enter a valid salary.");
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", empId), { baseSalary: Number(editSalary), salaryType: editType });
      toast.success('Compensation details updated!', { duration: 1000 });
      setEditingId(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update salary.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    setPayrollData({}); 

    const [year, monthStr] = selectedMonth.split('-');
    const monthIndex = parseInt(monthStr) - 1; 

    const startDate = new Date(parseInt(year), monthIndex, cutoffPeriod === 1 ? 1 : 16, 0, 0, 0);
    const endDate = cutoffPeriod === 1
      ? new Date(parseInt(year), monthIndex, 15, 23, 59, 59)
      : new Date(parseInt(year), monthIndex + 1, 0, 23, 59, 59);

    const generatedResults: Record<string, PayrollResult> = {};

    try {
      for (const emp of employees) {
        if (!emp.baseSalary) continue; 

        const hourlyRate = emp.salaryType === "hourly" ? emp.baseSalary : calculateHourlyRate(emp.baseSalary);
        const dailyRate = hourlyRate * 8; 

        const attQuery = query(
          collection(db, "attendanceLogs"),
          where("userId", "==", emp.id),
          where("timeIn", ">=", startDate),
          where("timeIn", "<=", endDate)
        );
        const attSnap = await getDocs(attQuery);

        let totalLateMins = 0;
        let totalUndertimeMins = 0;
        let totalOtMinutes = 0;
        let otPayPeso = 0;
        const uniqueDaysPresent = new Set<string>();

        attSnap.forEach(doc => {
          const data = doc.data();
          if (data.timeIn) {
            const dateStr = data.timeIn.toDate().toISOString().split('T')[0];
            uniqueDaysPresent.add(dateStr);
            if (!data.isLateExcused) {
              totalLateMins += calculateLatePenaltyMinutes(data.timeIn.toDate(), "08:00");
            }
          }
          if (data.timeOut) {
            totalUndertimeMins += calculateUndertimeMinutes(data.timeOut.toDate(), "17:00");
            
            // Calculate OT for this shift
            const otResult = calculateOvertimePay(data.timeOut.toDate(), hourlyRate);
            totalOtMinutes += otResult.otMinutes;
            otPayPeso += otResult.otPay;
          }
        });
        const daysPresent = uniqueDaysPresent.size;

        const leaveQuery = query(
          collection(db, "leaveRequests"),
          where("userId", "==", emp.id),
          where("status", "==", "approved")
        );
        const leaveSnap = await getDocs(leaveQuery);
        
        let paidLeaveDays = 0;
        leaveSnap.forEach(doc => {
          const data = doc.data();

          if (data.type === "lwop") return; 

          const leaveStart = new Date(data.startDate);
          leaveStart.setHours(0, 0, 0, 0);
          const leaveEnd = new Date(data.endDate);
          leaveEnd.setHours(23, 59, 59, 999);

          if (leaveStart <= endDate && leaveEnd >= startDate) {
            const overlapStart = leaveStart < startDate ? startDate : leaveStart;
            const overlapEnd = leaveEnd > endDate ? endDate : leaveEnd;
            const diffTime = overlapEnd.getTime() - overlapStart.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            paidLeaveDays += diffDays;
          }
        });

        const expectedDaysInCutoff = 11; 
        let unpaidAbsences = 0;
        let absenceDeductionPeso = 0;

        if (emp.salaryType === "monthly") {
          unpaidAbsences = expectedDaysInCutoff - (daysPresent + paidLeaveDays);
          if (unpaidAbsences < 0) unpaidAbsences = 0;
          if (unpaidAbsences > expectedDaysInCutoff) unpaidAbsences = expectedDaysInCutoff;
          absenceDeductionPeso = unpaidAbsences * dailyRate;
        }

        const semiMonthlyBase = emp.salaryType === "hourly" 
          ? ((daysPresent + paidLeaveDays) * 8 * hourlyRate) 
          : (emp.baseSalary / 2);

        const lateDeductionPeso = calculateTimeDeductionPeso(totalLateMins, hourlyRate);
        const undertimeDeductionPeso = calculateTimeDeductionPeso(totalUndertimeMins, hourlyRate);
        const totalTimePenalties = lateDeductionPeso + undertimeDeductionPeso;
        const totalAttendanceDeductions = totalTimePenalties + absenceDeductionPeso;

        const estimatedMonthlyForGov = emp.salaryType === "hourly" ? (hourlyRate * 8 * 22) : emp.baseSalary;
        
        // Add Overtime to taxable income base
        const grossPay = semiMonthlyBase + otPayPeso; 
        
        let mandatory = { sss: 0, philhealth: 0, pagibig: 0, totalMandatory: 0, taxableIncome: grossPay - totalAttendanceDeductions };
        
        if (applyDeductions) {
          mandatory = calculateMandatoryDeductions(estimatedMonthlyForGov, cutoffPeriod);
        }

        const netPay = grossPay - totalAttendanceDeductions - mandatory.totalMandatory;

        generatedResults[emp.id] = {
          semiMonthlyBase, hourlyRate, daysPresent, paidLeaveDays, unpaidAbsences, absenceDeductionPeso,
          totalLateMins, totalUndertimeMins, timePenaltiesPeso: totalTimePenalties,
          totalOtMinutes, otPayPeso,
          sss: mandatory.sss, philhealth: mandatory.philhealth, pagibig: mandatory.pagibig,
          totalMandatory: mandatory.totalMandatory, netPay
        };
      }

      setPayrollData(generatedResults);
      toast.success(`Payroll generated for ${Object.keys(generatedResults).length} employees!`);
    } catch (error) {
      console.error("Payroll Engine Error:", error);
      toast.error("Failed to generate payroll. Check console.");
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPayrollToCSV = () => {
    const monthName = new Date(0, parseInt(selectedMonth.split('-')[1]) - 1).toLocaleString('default', { month: 'long' });
    const year = selectedMonth.split('-')[0];
    const cutoffText = cutoffPeriod === 1 ? "1st-15th" : "16th-End";
    const titleString = `Payroll_Export_${monthName}_${year}_${cutoffText}`; 
    
    let csvContent = `Company Payroll - ${monthName} ${year} (${cutoffText})\n\n`;
    csvContent += `Employee Name,Department,Base Salary,Type,Semi-Monthly Base,Overtime (Mins),Overtime Pay (PHP),Days Present,Paid Leave (Days),Unpaid Absences,Absence Penalty (PHP),Late/UT (Mins),Time Penalty (PHP),SSS,PhilHealth,Pag-IBIG,Total Gov Deductions,Net Pay\n`;
    
    filteredEmployees.forEach(emp => {
      const result = payrollData[emp.id];
      if (result) {
        csvContent += `"${emp.fullName}","${emp.department || "N/A"}",${emp.baseSalary},${emp.salaryType},${result.semiMonthlyBase.toFixed(2)},${result.totalOtMinutes},${result.otPayPeso.toFixed(2)},${result.daysPresent},${result.paidLeaveDays},${result.unpaidAbsences},${result.absenceDeductionPeso.toFixed(2)},${result.totalLateMins + result.totalUndertimeMins},${result.timePenaltiesPeso.toFixed(2)},${result.sss.toFixed(2)},${result.philhealth.toFixed(2)},${result.pagibig.toFixed(2)},${result.totalMandatory.toFixed(2)},${result.netPay.toFixed(2)}\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${titleString}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Payroll successfully exported to CSV!");
  };

  const filteredEmployees = employees.filter(emp => emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
  const formatPeso = (amount: number) => `₱ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getCutoffLabel = () => {
    const monthName = new Date(0, parseInt(selectedMonth.split('-')[1]) - 1).toLocaleString('default', { month: 'long' });
    const year = selectedMonth.split('-')[0];
    return `${monthName} ${cutoffPeriod === 1 ? '1-15' : `16-End`}, ${year}`;
  };

  if (!isAdmin && user) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center">Access Denied.</div></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] print:pt-0 print:bg-white">
        <div className="print:hidden">
          <Navbar />
        </div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 print:hidden">
          
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Banknote className="w-10 h-10 text-emerald-500" />
              Payroll Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Automated semi-monthly salary generation, OT calculations, and deductions.
            </p>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl mb-8 flex flex-col xl:flex-row items-center justify-between gap-6">
            
            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
              <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Payroll Month</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 w-full" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 flex-1 md:flex-none">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cutoff Period</label>
                <select 
                  value={cutoffPeriod} onChange={(e) => setCutoffPeriod(Number(e.target.value) as 1 | 2)} 
                  className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 w-full cursor-pointer"
                >
                  <option value={1}>1st Cutoff (1st - 15th)</option>
                  <option value={2}>2nd Cutoff (16th - End)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 w-full md:w-auto pt-1 md:pt-0">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:block">&nbsp;</label>
                <label className="flex items-center gap-3 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 cursor-pointer hover:border-emerald-500/50 transition-colors h-[42px]">
                  <input 
                    type="checkbox" checked={applyDeductions} onChange={(e) => setApplyDeductions(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 select-none">
                    Apply Gov. Deductions
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
              {Object.keys(payrollData).length > 0 && (
                 <button 
                  onClick={exportPayrollToCSV}
                  className="w-full sm:w-auto bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-6 py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
                 >
                   <Download className="w-5 h-5" /> Export Data
                 </button>
              )}
              
              <button 
                onClick={handleGeneratePayroll} disabled={isGenerating || employees.length === 0}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
              >
                {isGenerating ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Computing...</>
                ) : (
                  <><Calculator className="w-5 h-5" /> Calculate </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Employee Compensation List</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" placeholder="Search employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                  className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all" 
                />
              </div>
            </div>

            <table className="w-full text-left min-w-[1200px]">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="pb-4 pl-4">Employee</th>
                  <th className="pb-4 text-right">Base Rate</th>
                  <th className="pb-4 text-right border-l border-gray-100 dark:border-white/5 pl-4">Earnings (Base + OT)</th>
                  <th className="pb-4 text-right">Attendance Deductions</th>
                  <th className="pb-4 text-right">Gov. Deductions</th>
                  <th className="pb-4 text-right text-emerald-500">Net Pay</th>
                  <th className="pb-4 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredEmployees.map(emp => {
                  const result = payrollData[emp.id]; 
                  
                  return (
                    <tr key={emp.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                      
                      <td className="py-4 pl-4">
                        <div className="font-bold text-gray-900 dark:text-white text-base">{emp.fullName}</div>
                        <div className="text-xs text-gray-500">{emp.department || "No Department"}</div>
                      </td>

                      <td className="py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                        {editingId === emp.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input type="number" value={editSalary} onChange={(e) => setEditSalary(Number(e.target.value))} placeholder="Amount" className="w-24 px-2 py-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded text-right dark:text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                            <select value={editType} onChange={(e) => setEditType(e.target.value as "monthly" | "hourly")} className="px-2 py-1.5 bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded text-xs dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer">
                              <option value="monthly">/mo</option>
                              <option value="hourly">/hr</option>
                            </select>
                            <button onClick={() => handleSaveSalary(emp.id)} disabled={isSaving} className="text-emerald-500 hover:text-emerald-600"><Save className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-rose-500"><XCircle className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-3">
                            {emp.baseSalary ? (
                              <div className="flex flex-col items-end">
                                <span className="text-gray-900 dark:text-white">{formatPeso(emp.baseSalary)}</span>
                                <span className="text-[10px] text-gray-400 uppercase tracking-widest">{emp.salaryType === 'hourly' ? 'Per Hour' : 'Per Month'}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic text-xs">Not Set</span>
                            )}
                            <button onClick={() => handleEditClick(emp)} className="text-gray-400 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>

                      {result ? (
                        <>
                          <td className="py-4 text-right border-l border-gray-100 dark:border-white/5 pl-4 font-semibold text-gray-900 dark:text-white">
                            <div>{formatPeso(result.semiMonthlyBase)}</div>
                            {result.otPayPeso > 0 ? (
                              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-bold mt-0.5">
                                + {formatPeso(result.otPayPeso)} OT ({result.totalOtMinutes}m)
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-400 font-normal mt-0.5">No OT Logged</div>
                            )}
                          </td>
                          
                          <td className="py-4 text-right">
                            {(result.absenceDeductionPeso > 0 || result.timePenaltiesPeso > 0) ? (
                              <>
                                <span className="text-rose-600 dark:text-rose-400 font-bold">
                                  - {formatPeso(result.absenceDeductionPeso + result.timePenaltiesPeso)}
                                </span>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                  {result.unpaidAbsences > 0 ? `${result.unpaidAbsences} days absent` : ''} 
                                  {(result.unpaidAbsences > 0 && (result.totalLateMins + result.totalUndertimeMins) > 0) ? ' + ' : ''}
                                  {(result.totalLateMins + result.totalUndertimeMins) > 0 ? `${result.totalLateMins + result.totalUndertimeMins} mins lost` : ''}
                                </div>
                              </>
                            ) : (
                              <span className="text-gray-400 font-medium">None</span>
                            )}
                          </td>

                          <td className="py-4 text-right">
                            <span className="text-amber-600 dark:text-amber-400 font-bold">- {formatPeso(result.totalMandatory)}</span>
                            <div className="text-[10px] text-gray-400 mt-0.5 tracking-tighter">
                              {!applyDeductions ? "Waived" : cutoffPeriod === 1 ? `SSS: ${formatPeso(result.sss)} | P-IBIG: ${formatPeso(result.pagibig)}` : `PH: ${formatPeso(result.philhealth)}`}
                            </div>
                          </td>
                          <td className="py-4 text-right text-lg font-black text-emerald-600 dark:text-emerald-400">
                            {formatPeso(result.netPay)}
                          </td>
                          <td className="py-4 text-center">
                            <button 
                              onClick={() => setSelectedPayslip({ emp, result })}
                              className="text-[10px] font-bold bg-slate-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1 mx-auto"
                            >
                              <FileText className="w-3 h-3" /> Payslip
                            </button>
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="py-4 text-center border-l border-gray-100 dark:border-white/5">
                          <span className="text-xs text-gray-400 italic flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            Ready to compute
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* DOLE-Compliant Payslip Modal with Overtime */}
        {selectedPayslip && (
          // FIX 1: Unbreakable modal scroll container (no items-center clipping)
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto print:bg-white print:overflow-visible">
            <div className="min-h-screen flex items-start justify-center p-2 sm:p-6 print:p-0">
              
              <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full text-gray-900 mt-4 sm:mt-10 mb-4 sm:mb-10 print:m-0 print:shadow-none print:w-full print:max-w-none">
                
                {/* FIX 2: Responsive Header that wraps cleanly on tiny screens */}
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center p-4 sm:p-5 border-b border-gray-200 print:hidden bg-slate-50 rounded-t-xl gap-3">
                  <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <button 
                      onClick={() => setSelectedPayslip(null)} 
                      className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 bg-gray-200/50 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors font-bold text-xs sm:text-sm active:scale-95"
                    >
                      <ArrowLeft className="w-4 h-4" /> 
                      <span className="hidden sm:inline">Back to Payroll</span>
                      <span className="sm:hidden">Back</span>
                    </button>
                    <h3 className="font-bold text-gray-700 hidden sm:block text-sm">Payslip Preview</h3>
                  </div>

                  <button 
                    onClick={() => window.print()} 
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-95 w-full sm:w-auto"
                  >
                    <Printer className="w-4 h-4 shrink-0" /> Save as PDF
                  </button>
                </div>

                <div className="p-5 sm:p-8 md:p-12 print:p-8 bg-white">
                  <div className="text-center mb-6 sm:mb-8 border-b-2 border-gray-900 pb-4 sm:pb-6">
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-emerald-700 print:text-black">SimplifV Payroll</h1>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mt-1">Subic City, Zambales</p>
                    <h2 className="text-base sm:text-lg font-bold mt-4 uppercase text-gray-800">Payslip</h2>
                    <p className="text-xs sm:text-sm text-gray-600 font-semibold">Pay Period: {getCutoffLabel()}</p>
                  </div>

                  {/* Employee Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-8 text-xs sm:text-sm">
                    <div>
                      <span className="font-bold text-gray-500 uppercase text-[10px] sm:text-xs block mb-0.5">Employee Name</span>
                      <span className="font-semibold text-sm sm:text-base">{selectedPayslip.emp.fullName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-500 uppercase text-[10px] sm:text-xs block mb-0.5">Department</span>
                      <span className="font-semibold text-sm sm:text-base">{selectedPayslip.emp.department || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-500 uppercase text-[10px] sm:text-xs block mb-0.5">Salary Profile</span>
                      <span className="font-semibold">{formatPeso(selectedPayslip.emp.baseSalary || 0)} / {selectedPayslip.emp.salaryType === 'hourly' ? 'Hr' : 'Mo'}</span>
                    </div>
                    <div>
                      <span className="font-bold text-gray-500 uppercase text-[10px] sm:text-xs block mb-0.5">Hourly Rate</span>
                      <span className="font-semibold">{formatPeso(selectedPayslip.result.hourlyRate)}</span>
                    </div>
                  </div>

                  {/* FIX 3: Dynamic Table - Stacks vertically on mobile, side-by-side on desktop */}
                  <div className="w-full border border-gray-300 mb-8 rounded-lg overflow-hidden flex flex-col md:flex-row">
                    
                    {/* Earnings Container */}
                    <div className="w-full md:w-1/2 flex flex-col border-b md:border-b-0 md:border-r border-gray-300">
                      <div className="bg-gray-100 p-3 font-bold uppercase text-[10px] sm:text-xs tracking-wider border-b border-gray-300 text-gray-700">
                        Earnings
                      </div>
                      <div className="p-4 flex flex-col gap-3 min-h-[140px] text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-gray-700">Basic Pay (Gross)</span>
                          <span className="font-semibold text-right">{formatPeso(selectedPayslip.result.semiMonthlyBase)}</span>
                        </div>
                        {selectedPayslip.result.otPayPeso > 0 && (
                          <div className="flex justify-between gap-2 text-teal-700 font-medium">
                            <span>Overtime Pay ({selectedPayslip.result.totalOtMinutes}m)</span>
                            <span className="font-semibold text-right">+ {formatPeso(selectedPayslip.result.otPayPeso)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-500 text-[10px] sm:text-xs mt-auto pt-4 border-t border-gray-100">
                          <span>Days Present: {selectedPayslip.result.daysPresent}</span>
                          {selectedPayslip.result.paidLeaveDays > 0 && (
                            <span>Paid Leaves: {selectedPayslip.result.paidLeaveDays}</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 mt-auto border-t border-gray-300 bg-gray-50 flex justify-between gap-2 font-bold text-gray-800 text-sm">
                        <span>Total Earnings</span>
                        <span className="text-right">{formatPeso(selectedPayslip.result.semiMonthlyBase + selectedPayslip.result.otPayPeso)}</span>
                      </div>
                    </div>
                    
                    {/* Deductions Container */}
                    <div className="w-full md:w-1/2 flex flex-col">
                      <div className="bg-gray-100 p-3 font-bold uppercase text-[10px] sm:text-xs tracking-wider border-b border-gray-300 text-gray-700">
                        Deductions
                      </div>
                      <div className="p-4 flex flex-col gap-3 min-h-[140px] text-xs sm:text-sm">
                        {selectedPayslip.result.absenceDeductionPeso > 0 && (
                          <div className="flex justify-between gap-2 text-rose-600 print:text-black">
                            <span>Unpaid Absences ({selectedPayslip.result.unpaidAbsences}d)</span>
                            <span className="font-semibold text-right">{formatPeso(selectedPayslip.result.absenceDeductionPeso)}</span>
                          </div>
                        )}
                        {selectedPayslip.result.timePenaltiesPeso > 0 && (
                          <div className="flex justify-between gap-2 text-rose-600 print:text-black">
                            <span>Lates/UT ({selectedPayslip.result.totalLateMins + selectedPayslip.result.totalUndertimeMins}m)</span>
                            <span className="font-semibold text-right">{formatPeso(selectedPayslip.result.timePenaltiesPeso)}</span>
                          </div>
                        )}
                        {selectedPayslip.result.sss > 0 && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-700">SSS Contrib.</span>
                            <span className="font-semibold text-right">{formatPeso(selectedPayslip.result.sss)}</span>
                          </div>
                        )}
                        {selectedPayslip.result.philhealth > 0 && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-700">PhilHealth Contrib.</span>
                            <span className="font-semibold text-right">{formatPeso(selectedPayslip.result.philhealth)}</span>s
                          </div>
                        )}
                        {selectedPayslip.result.pagibig > 0 && (
                          <div className="flex justify-between gap-2">
                            <span className="text-gray-700">Pag-IBIG Contrib.</span>
                            <span className="font-semibold text-right">{formatPeso(selectedPayslip.result.pagibig)}</span>
                          </div>
                        )}
                        {selectedPayslip.result.timePenaltiesPeso === 0 && selectedPayslip.result.absenceDeductionPeso === 0 && selectedPayslip.result.totalMandatory === 0 && (
                          <div className="text-gray-400 italic text-center my-auto">No deductions.</div>
                        )}
                      </div>
                      <div className="p-4 mt-auto border-t border-gray-300 bg-gray-50 flex justify-between gap-2 font-bold text-rose-700 print:text-black text-sm">
                        <span>Total Deductions</span>
                        <span className="text-right">{formatPeso(selectedPayslip.result.absenceDeductionPeso + selectedPayslip.result.timePenaltiesPeso + selectedPayslip.result.totalMandatory)}</span>
                      </div>
                    </div>

                  </div>

                  {/* Net Pay */}
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end bg-emerald-50 print:bg-transparent print:border print:border-gray-900 p-4 sm:p-6 rounded-lg mb-8 sm:mb-12 gap-2">
                    <span className="text-base sm:text-lg font-black uppercase text-emerald-900 print:text-black tracking-widest">Net Pay</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-700 print:text-black underline underline-offset-4">{formatPeso(selectedPayslip.result.netPay)}</span>
                  </div>

                  {/* Signatures */}
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-8 pt-8 sm:pt-12 px-2 sm:px-4">
                    <div className="text-center w-full sm:w-48">
                      <div className="border-b border-gray-800 pb-1 font-semibold text-xs sm:text-sm truncate">{selectedPayslip.emp.fullName}</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1 uppercase tracking-wider">Employee Signature</div>
                    </div>
                    <div className="text-center w-full sm:w-48">
                      <div className="border-b border-gray-800 pb-1 font-semibold text-xs sm:text-sm">Human Resources</div>
                      <div className="text-[10px] sm:text-xs text-gray-500 mt-1 uppercase tracking-wider">Authorized By</div>
                    </div>
                  </div>
                  
                  <div className="mt-12 text-center text-[10px] text-gray-400 print:block hidden">
                    Generated by SimpliSync Solutions • Document Date: {new Date().toLocaleDateString()}
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}