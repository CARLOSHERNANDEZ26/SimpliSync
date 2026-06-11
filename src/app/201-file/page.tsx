"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FolderOpen, User, Award, ShieldCheck, AlertTriangle, Gift, Banknote, Printer, ArrowLeft, ChevronLeft, ChevronRight, Eye, X, Send, CheckCircle, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface Evaluation { id: string; quarter: string; year: number; evaluator: string; averageScore: number; feedback: string; metrics: { quality: number; punctuality: number; teamwork: number; }; }
interface DisciplinaryRecord { id: string; employeeId: string; offenseType: string; formalNotice: string; status: string; employeeExplanation?: string; adminResolution?: string; verdict?: string; createdAt: { seconds: number } | null; }
interface Bonus { id: string; type: string; year: number; amount: number; distributedAt: { seconds: number } | null; }
interface DistributedPayslip {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  department: string;
  baseSalary: number;
  salaryType: "monthly" | "hourly";
  year: number;
  month: number;
  cutoffPeriod: number;
  authorizedBy: string;
  distributedAt: { seconds: number } | null;
  metrics: {
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
  };
}

export default function Employee201FilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"records" | "payslips">("records");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryRecord[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<DisciplinaryRecord | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [payslips, setPayslips] = useState<DistributedPayslip[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<DistributedPayslip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [explanationText, setExplanationText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Minimal Year Filter State
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState<number>(currentYear);

  // Pagination states
  const [payslipPage, setPayslipPage] = useState(1);
  const payslipsPerPage = 5;

  // Reset pagination when year changes
  useEffect(() => {
    setPayslipPage(1);
  }, [filterYear]);

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubEval = onSnapshot(query(collection(db, "evaluations"), where("employeeId", "==", user.uid), orderBy("year", "desc")), (snap) => {
      setEvaluations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Evaluation)));
      setIsLoading(false);
    });

    const unsubDisc = onSnapshot(query(collection(db, "disciplinaryRecords"), where("employeeId", "==", user.uid), orderBy("createdAt", "desc")), (snap) => {
      setDisciplinaryActions(snap.docs.map(d => {
        const data = d.data();
        return { id: d.id, employeeId: data.employeeId, offenseType: data.offenseType, formalNotice: data.formalNotice || "Notice payload unavailable.", status: data.status || "Issued", employeeExplanation: data.employeeExplanation || "", adminResolution: data.adminResolution || "", verdict: data.verdict || "", createdAt: data.createdAt };
      }));
    });

    const unsubBonus = onSnapshot(query(collection(db, "benefitDistributions"), where("userId", "==", user.uid)), (snap) => {
      setBonuses(snap.docs.map(d => ({ id: d.id, ...d.data() } as Bonus)));
    });

    const unsubPayslips = onSnapshot(query(collection(db, "payslips"), where("userId", "==", user.uid), orderBy("year", "desc"), orderBy("month", "desc"), orderBy("cutoffPeriod", "desc")), (snap) => {
      setPayslips(snap.docs.map(d => ({ id: d.id, ...d.data() } as DistributedPayslip)));
    });

    return () => { unsubEval(); unsubDisc(); unsubBonus(); unsubPayslips(); };
  }, [user?.uid]);

  const handleSubmitExplanation = async () => {
    if (!selectedNotice || !explanationText.trim()) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "disciplinaryRecords", selectedNotice.id), { employeeExplanation: explanationText, status: "Explanation Submitted", explanationDate: serverTimestamp() });
      toast.success("Official explanation submitted to HR.");
      setSelectedNotice({ ...selectedNotice, status: "Explanation Submitted", employeeExplanation: explanationText });
      setExplanationText("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit explanation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPeso = (amount: number) => `₱ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const getMonthName = (m: number) => new Date(0, m - 1).toLocaleString('default', { month: 'long' });

  // Minimal Filter Logic
  const filteredEvals = evaluations.filter(e => e.year === filterYear);
  const filteredNotices = disciplinaryActions.filter(n => n.createdAt ? new Date(n.createdAt.seconds * 1000).getFullYear() === filterYear : true);
  const filteredBonuses = bonuses.filter(b => b.year === filterYear);
  const filteredPayslips = payslips.filter(p => p.year === filterYear);

  // 13th Month Calculation based on filtered year
  const totalBasicEarned = filteredPayslips.reduce((sum, p) => sum + p.metrics.semiMonthlyBase, 0);
  const estimated13thMonth = totalBasicEarned / 12;

  // Generate Year Options
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Pagination processing
  const totalPayslipPages = Math.ceil(filteredPayslips.length / payslipsPerPage);
  const currentPayslips = filteredPayslips.slice((payslipPage - 1) * payslipsPerPage, payslipPage * payslipsPerPage);

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] print:bg-white print:pt-0">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none print:hidden"></div>
        <div className="print:hidden"><Navbar /></div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 print:p-0">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3"><FolderOpen className="w-10 h-10 text-teal-500" /> My 201 File</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Your official credentials, historical reviews, and compensation ledger.</p>
            </div>
            
            <div className="flex items-center gap-3 self-start md:self-auto">
              {/* Minimal Year Sorter */}
              <div className="relative flex items-center bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-3 py-1.5 shadow-sm">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <select 
                  value={filterYear} 
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer appearance-none pr-4"
                >
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Existing Tabs */}
              <div className="bg-gray-200/60 dark:bg-white/5 p-1 rounded-2xl flex gap-1 shadow-sm">
                <button onClick={() => setActiveTab("records")} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "records" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>Records & Appraisals</button>
                <button onClick={() => setActiveTab("payslips")} className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === "payslips" ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}>My Payslips</button>
              </div>
            </div>
          </div>

          {activeTab === "records" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl text-center">
                  <div className="w-24 h-24 bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-200"><User className="w-10 h-10" /></div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user?.displayName || "Employee"}</h2>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-bold text-gray-500 border border-gray-200"><ShieldCheck className="w-3.5 h-3.5" /> Official Profile</span>
                  <div className="mt-6 space-y-4 text-left">
                    <div className="flex justify-between border-b pb-3"><span className="text-xs font-bold text-gray-400 uppercase">Email</span><span className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</span></div>
                    <div className="flex justify-between border-b pb-3"><span className="text-xs font-bold text-gray-400 uppercase">Status</span><span className="text-sm font-bold text-emerald-500">Active Account</span></div>
                    <div className="flex justify-between pb-1"><span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">UID</span><span className="text-xs font-mono text-gray-500 truncate max-w-[120px]">{user?.uid}</span></div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-200 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-teal-900 dark:text-teal-400 mb-4 flex items-center gap-2"><Gift className="w-5 h-5" /> Incentives & Bonuses</h3>
                  
                  {/* Subtle 13th Month Tracker */}
                  <div className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-teal-100 dark:border-white/5 flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">13th Month Accrual</span>
                    <span className="text-sm font-mono font-black text-emerald-600 dark:text-emerald-400">{formatPeso(estimated13thMonth)}</span>
                  </div>

                  {filteredBonuses.length > 0 ? (
                    <div className="space-y-3">
                      {filteredBonuses.map(b => (
                        <div key={b.id} className="bg-white dark:bg-black/40 p-4 rounded-2xl border border-teal-100 flex items-center justify-between">
                          <div><div className="text-sm font-bold text-gray-900 dark:text-white">{b.type}</div><div className="text-[10px] text-gray-500 uppercase tracking-wider">{b.year} • Processed</div></div>
                          <div className="text-lg font-mono font-bold text-emerald-600">+{formatPeso(b.amount)}</div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center py-6 bg-white/50 dark:bg-black/20 rounded-2xl border border-dashed"><p className="text-sm text-gray-500 italic">No additional compensation logged for {filterYear}.</p></div>}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Award className="w-5 h-5 text-teal-500" /> Quarterly Appraisals</h3>
                  {isLoading ? <div className="text-center py-10 text-gray-500">Syncing records...</div> : filteredEvals.length > 0 ? (
                    <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                      {filteredEvals.map(ev => (
                        <div key={ev.id} className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100">
                          <div className="flex justify-between border-b pb-4 mb-4"><h4 className="text-lg font-bold">{ev.quarter} {ev.year} Review</h4><span className="px-3 py-1 bg-teal-100 text-teal-700 font-bold text-sm rounded-lg">{ev.averageScore.toFixed(1)} / 5.0</span></div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-black/40 p-4 rounded-xl border">&quot;{ev.feedback}&quot;</p>
                        </div>
                      ))}
                    </div>
                  ) : <div className="text-center text-gray-500 py-10 bg-slate-50 dark:bg-black/10 rounded-2xl border border-dashed">No reviews on record for {filterYear}.</div>}
                </div>

                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-500" /> Official HR Notices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredNotices.length > 0 ? filteredNotices.map(act => (
                      <div key={act.id} onClick={() => setSelectedNotice(act)} className="cursor-pointer p-4 bg-rose-50/40 dark:bg-rose-500/5 border border-rose-100 rounded-2xl hover:border-rose-400 transition-all flex flex-col justify-between">
                        <div><div className="flex justify-between text-[10px] font-bold text-gray-400"><span>{act.offenseType}</span><span>{act.createdAt ? new Date(act.createdAt.seconds * 1000).toLocaleDateString() : ""}</span></div><h4 className="text-sm font-bold mt-2">Notice to Explain</h4><p className="text-xs text-gray-500 mt-1 line-clamp-2">{act.formalNotice}</p></div>
                        <div className="text-[10px] font-bold mt-4 uppercase text-rose-600 tracking-wider flex items-center gap-1">{act.status}</div>
                      </div>
                    )) : <div className="col-span-full text-center text-gray-500 py-8 bg-slate-50 dark:bg-black/10 rounded-2xl border border-dashed">No issues on file for {filterYear}. Excellent!</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Payslip Browsing View Screen */
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl print:hidden animate-fade-in-up">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2"><Banknote className="w-5 h-5 text-emerald-500" /> Issued Statements Balance</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b">
                      <th className="pb-3 pl-2">Statement Period</th>
                      <th className="pb-3">Cutoff Half</th>
                      <th className="pb-3 text-right">Gross Earnings</th>
                      <th className="pb-3 text-right text-emerald-500">Net Pay Out</th>
                      <th className="pb-3 text-center w-32">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {currentPayslips.map(ps => (
                      <tr key={ps.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 pl-2 font-bold text-gray-900 dark:text-white">{getMonthName(ps.month)} {ps.year}</td>
                        <td className="py-4 font-semibold text-gray-500 uppercase text-xs">{ps.cutoffPeriod === 1 ? "1st Cutoff (1-15)" : "2nd Cutoff (16-End)"}</td>
                        <td className="py-4 text-right font-mono font-medium">{formatPeso(ps.metrics.semiMonthlyBase + ps.metrics.otPayPeso)}</td>
                        <td className="py-4 text-right font-mono font-black text-emerald-600">{formatPeso(ps.metrics.netPay)}</td>
                        <td className="py-4 text-center">
                          <button onClick={() => setSelectedPayslip(ps)} className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-500 rounded-lg flex items-center gap-1 mx-auto transition-colors"><Eye className="w-3.5 h-3.5" /> View Slip</button>
                        </td>
                      </tr>
                    ))}
                    {filteredPayslips.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-gray-500 italic">No statement ledgers found for {filterYear}.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPayslipPages > 1 && (
                <div className="mt-6 flex justify-between items-center border-t pt-4">
                  <span className="text-xs text-gray-400">Page {payslipPage} of {totalPayslipPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setPayslipPage(p => Math.max(p - 1, 1))} disabled={payslipPage === 1} className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setPayslipPage(p => Math.min(p + 1, totalPayslipPages))} disabled={payslipPage === totalPayslipPages} className="p-1.5 border rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Full Interactive Payslip Inspection Overlay Sheet Panel */}
        {selectedPayslip && (
          <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm overflow-y-auto print:bg-white print:overflow-visible">
            <div className="min-h-screen flex items-start justify-center p-4 print:p-0">
              <div className="bg-white text-gray-900 rounded-3xl w-full max-w-2xl mt-10 p-8 shadow-2xl print:m-0 print:shadow-none print:max-w-none">
                <div className="flex justify-between items-center border-b pb-4 mb-6 print:hidden">
                  <button onClick={() => setSelectedPayslip(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"><ArrowLeft className="w-3.5 h-3.5" /> Close</button>
                  <button onClick={() => window.print()} className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"><Printer className="w-4 h-4" /> Print Document</button>
                </div>

                <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
                  <h1 className="text-2xl font-black uppercase text-emerald-700 print:text-black tracking-wider">SimplifV Payroll</h1>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">Subic City, Zambales</p>
                  <h2 className="text-base font-bold mt-4 uppercase tracking-widest bg-slate-100 print:bg-transparent py-1 rounded">Official Payslip</h2>
                  <p className="text-xs font-bold text-gray-600 mt-1">Period: {getMonthName(selectedPayslip.month)} {selectedPayslip.cutoffPeriod === 1 ? '1-15' : '16-End'}, {selectedPayslip.year}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-b pb-4">
                  <div><span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Employee Name</span><span className="font-bold text-sm">{selectedPayslip.fullName}</span></div>
                  <div><span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Department Allocation</span><span className="font-bold text-sm">{selectedPayslip.department}</span></div>
                  <div><span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Base Compensation</span><span className="font-medium">{formatPeso(selectedPayslip.baseSalary)} / {selectedPayslip.salaryType}</span></div>
                  <div><span className="text-gray-400 font-bold uppercase tracking-wider block text-[10px]">Hourly Derived Rate</span><span className="font-medium">{formatPeso(selectedPayslip.metrics.hourlyRate)}</span></div>
                </div>

                <div className="border rounded-xl overflow-hidden flex flex-col sm:flex-row mb-6 text-xs">
                  <div className="w-full sm:w-1/2 border-b sm:border-b-0 sm:border-r p-4 space-y-2.5">
                    <div className="font-black text-gray-400 uppercase tracking-widest border-b pb-1.5 mb-2">Gross Earnings</div>
                    <div className="flex justify-between"><span>Basic Half Allowance</span><span className="font-semibold">{formatPeso(selectedPayslip.metrics.semiMonthlyBase)}</span></div>
                    {selectedPayslip.metrics.otPayPeso > 0 && <div className="flex justify-between font-bold text-teal-600"><span>Overtime ({selectedPayslip.metrics.totalOtMinutes}m)</span><span>+ {formatPeso(selectedPayslip.metrics.otPayPeso)}</span></div>}
                    <div className="flex justify-between border-t pt-2 font-bold text-gray-900 mt-4 bg-slate-50 p-2 rounded"><span>Total Gross</span><span>{formatPeso(selectedPayslip.metrics.semiMonthlyBase + selectedPayslip.metrics.otPayPeso)}</span></div>
                  </div>
                  <div className="w-full sm:w-1/2 p-4 space-y-2.5 bg-slate-50/30">
                    <div className="font-black text-gray-400 uppercase tracking-widest border-b pb-1.5 mb-2">Deductions</div>
                    {selectedPayslip.metrics.absenceDeductionPeso > 0 && <div className="flex justify-between text-rose-600 font-medium"><span>Absences ({selectedPayslip.metrics.unpaidAbsences}d)</span><span>-{formatPeso(selectedPayslip.metrics.absenceDeductionPeso)}</span></div>}
                    {selectedPayslip.metrics.timePenaltiesPeso > 0 && <div className="flex justify-between text-rose-600 font-medium"><span>Tardiness Lost Time</span><span>-{formatPeso(selectedPayslip.metrics.timePenaltiesPeso)}</span></div>}
                    {selectedPayslip.metrics.sss > 0 && <div className="flex justify-between"><span>SSS Contribution</span><span>{formatPeso(selectedPayslip.metrics.sss)}</span></div>}
                    {selectedPayslip.metrics.philhealth > 0 && <div className="flex justify-between"><span>PhilHealth Contribution</span><span>{formatPeso(selectedPayslip.metrics.philhealth)}</span></div>}
                    {selectedPayslip.metrics.pagibig > 0 && <div className="flex justify-between"><span>Pag-IBIG Contribution</span><span>{formatPeso(selectedPayslip.metrics.pagibig)}</span></div>}
                    <div className="flex justify-between border-t pt-2 font-bold text-rose-700 mt-4 bg-rose-50/50 p-2 rounded"><span>Total Losses</span><span>{formatPeso(selectedPayslip.metrics.absenceDeductionPeso + selectedPayslip.metrics.timePenaltiesPeso + selectedPayslip.metrics.totalMandatory)}</span></div>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-emerald-50 print:border p-4 rounded-xl mb-8"><span className="text-sm font-black uppercase text-emerald-900 tracking-widest">Net Pay Received</span><span className="text-2xl font-black text-emerald-700 font-mono underline">{formatPeso(selectedPayslip.metrics.netPay)}</span></div>
                <div className="flex justify-between pt-6 text-xs text-center"><div className="w-40 border-t pt-1 font-bold">{selectedPayslip.fullName}</div><div className="w-40 border-t pt-1 font-bold">{selectedPayslip.authorizedBy}</div></div>
              </div>
            </div>
          </div>
        )}

        {/* Notice Modal Block */}
        {selectedNotice && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden animate-fade-in">
            <div className="bg-white dark:bg-[#151515] w-full max-w-5xl h-[85vh] max-h-[750px] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col overflow-hidden animate-zoom-in">
              
              <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 shrink-0">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" /> Official HR Memorandum File
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider font-semibold">
                    Category: <span className="text-rose-500 font-bold">{selectedNotice.offenseType}</span>
                  </p>
                </div>
                <button 
                  onClick={() => { setSelectedNotice(null); setExplanationText(""); }} 
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full transition-colors shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
                
                <div className="w-full lg:w-1/2 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-white/5 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                  <div className="mb-4">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Issued Notice Context</span>
                  </div>
                  
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-100 dark:border-white/5 text-sm text-gray-700 dark:text-gray-300 leading-relaxed shadow-sm whitespace-pre-wrap font-sans space-y-4">
                    {selectedNotice.formalNotice
                      .split("\n")
                      .map((line, idx) => {
                        const cleanLine = line.replace(/###/g, "").trim();
                        
                        const boldSegments: React.ReactNode[] = [];
                        let keyIdx = 0;
                        const parts = cleanLine.split(/\*\*(.*?)\*\*/g);
                        
                        parts.forEach((part, pIdx) => {
                          if (pIdx % 2 === 1) {
                            boldSegments.push(<strong key={keyIdx++} className="font-extrabold text-rose-600 dark:text-rose-400">{part}</strong>);
                          } else {
                            boldSegments.push(part);
                          }
                        });

                        if (line.startsWith("---") || line.startsWith("###")) {
                          return <div key={idx} className="my-4 h-0.5 bg-gray-200 dark:bg-white/10 w-full" />;
                        }
                        if (line.includes("MEMORANDUM") || line.includes("DATE:")) {
                          return <div key={idx} className="bg-slate-50 dark:bg-black/20 p-2.5 rounded-xl border border-gray-100 dark:border-white/5 font-mono text-xs font-bold text-gray-600 dark:text-gray-400">{boldSegments}</div>;
                        }
                        return <p key={idx} className="mt-1">{boldSegments}</p>;
                    })}
                  </div>
                </div>

                <div className="w-full lg:w-1/2 p-6 overflow-y-auto custom-scrollbar flex flex-col bg-white dark:bg-[#151515]">
                  <div className="mb-4 flex flex-col">
                    <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Written Explanation Response</span>
                    <span className="text-xs text-gray-500 mt-0.5">In compliance with DOLE regulations, provide your official detailed defense statement below.</span>
                  </div>

                  {selectedNotice.employeeExplanation ? (
                    <div className="flex-1 flex flex-col justify-between bg-teal-500/5 rounded-2xl p-5 border border-teal-500/20 shadow-inner">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 block mb-2">My Submitted Explanation Statement</span>
                        <div className="text-sm italic text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                          &ldquo;{selectedNotice.employeeExplanation}&rdquo;
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-teal-500/10 flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
                        <CheckCircle className="w-4 h-4 shrink-0" /> Response safely logged into system database archive.
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col gap-4">
                      <textarea 
                        value={explanationText} 
                        onChange={(e) => setExplanationText(e.target.value)} 
                        placeholder="Type your official explanation. Be precise with dates, facts, and mitigating circumstances..." 
                        className="flex-1 w-full p-4 bg-slate-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl text-sm outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-rose-500 transition-all min-h-[180px] leading-relaxed custom-scrollbar font-medium" 
                      />
                      <button 
                        onClick={handleSubmitExplanation} 
                        disabled={isSubmitting || !explanationText.trim()} 
                        className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 disabled:bg-gray-300 dark:disabled:bg-white/5 text-white disabled:text-gray-400 font-bold rounded-xl transition-all shadow-lg shadow-rose-600/10 flex items-center justify-center gap-2 active:scale-95 shrink-0"
                      >
                        {isSubmitting ? (
                          <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Transmitting File...</>
                        ) : (
                          <><Send className="w-4 h-4" /> Submit Official Explanation</>
                        )}
                      </button>
                    </div>
                  )}

                  {selectedNotice.status.includes("Resolved") && selectedNotice.verdict && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-500/30 shadow-sm mt-5 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">HR Case Resolution Verdict</span>
                      <h4 className="text-base font-extrabold text-emerald-900 dark:text-emerald-400 mb-2">{selectedNotice.verdict}</h4>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed font-medium bg-white dark:bg-black/20 p-3 rounded-xl border border-emerald-200/40 dark:border-emerald-500/10 italic">
                        &ldquo;{selectedNotice.adminResolution || "Case officially reviewed and finalized by HR Admin."}&rdquo;
                      </p>
                    </div>
                  )}
                  
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5 text-center text-[10px] uppercase font-bold tracking-widest text-gray-400 shrink-0">
                SimpliSync Compliance Management Engine • Due Process Protocol
              </div>

            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}