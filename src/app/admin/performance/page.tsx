"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, Award, Star, CheckCircle2, Search, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { logAdminAction } from "@/lib/audit";
interface Employee { 
  id: string; 
  fullName: string; 
  department?: string; 
}

interface Evaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  evaluator: string;
  quarter: string;
  year: number;
  metrics: {
    quality: number;
    punctuality: number;
    teamwork: number;
  };
  averageScore: number;
  feedback: string;
  createdAt: { seconds: number } | null;
}

export default function PerformancePage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  const currentYear = new Date().getFullYear();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [quarter, setQuarter] = useState("Q1");
  const [quality, setQuality] = useState(3);
  const [punctuality, setPunctuality] = useState(3);
  const [teamwork, setTeamwork] = useState(3);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { 
    if (!isAdmin) return;
    
    const empQ = query(collection(db, "users"), where("role", "==", "employee")); 
    const unsubEmp = onSnapshot(empQ, (snap) => setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)))); 
    const evalQ = query(collection(db, "evaluations"), orderBy("createdAt", "desc")); 
    const unsubEval = onSnapshot(evalQ, (snap) => setEvaluations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluation)))); 

    return () => { unsubEmp(); unsubEval(); }; 
  }, [isAdmin]);

  const handleSubmitEvaluation = async (e: React.SubmitEvent) => { 
    e.preventDefault();
    if (!selectedEmp || !feedback.trim()) return toast.error("Please select an employee and provide feedback.");

    setIsSaving(true);
    try { 
      const empName = employees.find(e => e.id === selectedEmp)?.fullName || "Unknown";
      const averageScore = Number(((quality + punctuality + teamwork) / 3).toFixed(1));

      await addDoc(collection(db, "evaluations"), {
        employeeId: selectedEmp,
        employeeName: empName,
        evaluator: user?.displayName || "HR Admin",
        quarter,
        year: currentYear,
        metrics: { quality, punctuality, teamwork },
        averageScore,
        feedback,
        createdAt: serverTimestamp()
      });

      toast.success("Performance evaluation saved successfully!");
       
      if (user?.email) {
      await logAdminAction(
        user.email, 
        `Logged Quarterly Appraisal (Score: ${averageScore.toFixed(1)})`, 
        `Employee ID: ${selectedEmp}`
      );
    }
      setIsModalOpen(false);
      setSelectedEmp("");
      setQuality(3);
      setPunctuality(3);
      setTeamwork(3);
      setFeedback("");
    } catch (error: unknown) {
      console.error("Evaluation Error:", error);
      toast.error("Failed to save evaluation.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEvals = evaluations.filter(ev => ev.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()));

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    if (score >= 3.0) return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
  };

  if (!isAdmin && user) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center">Access Denied.</div></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-indigo-500" />
                Performance Appraisals
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Manage quarterly evaluations, track KPIs, and log employee growth.
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search records..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg whitespace-nowrap">
                <Award className="w-5 h-5" /> New Evaluation
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="pb-4 pl-2">Employee</th>
                  <th className="pb-4">Period</th>
                  <th className="pb-4">Evaluator</th>
                  <th className="pb-4 text-center">Avg Score</th>
                  <th className="pb-4">Core Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredEvals.length > 0 ? filteredEvals.map(evalRecord => (
                  <tr key={evalRecord.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900 dark:text-white">{evalRecord.employeeName}</td>
                    <td className="py-4 text-gray-500 font-medium">{evalRecord.quarter} {evalRecord.year}</td>
                    <td className="py-4 text-gray-500">{evalRecord.evaluator}</td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center justify-center gap-1 px-3 py-1 rounded-lg border font-bold text-sm ${getScoreColor(evalRecord.averageScore)}`}>
                        <Star className="w-3.5 h-3.5 fill-current" /> {evalRecord.averageScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate" title={evalRecord.feedback}>
                      {evalRecord.feedback}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="py-8 text-center text-gray-500 italic">No evaluation records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* New Evaluation Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#151515] w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 sticky top-0 bg-white dark:bg-[#151515] z-10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Award className="w-6 h-6 text-indigo-500" /> Log Quarterly Evaluation</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors"><XCircle className="w-6 h-6" /></button>
                </div>

                <form onSubmit={handleSubmitEvaluation} className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase">Employee</label>
                      <select required value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm dark:text-white focus:ring-2 focus:ring-indigo-500">
                        <option value="">-- Choose Employee --</option>
                        {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.fullName} ({emp.department || "No Dept"})</option>))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase">Review Period</label>
                      <select required value={quarter} onChange={(e) => setQuarter(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm dark:text-white focus:ring-2 focus:ring-indigo-500">
                        <option value="Q1">Q1 (Jan - Mar)</option>
                        <option value="Q2">Q2 (Apr - Jun)</option>
                        <option value="Q3">Q3 (Jul - Sep)</option>
                        <option value="Q4">Q4 (Oct - Dec)</option>
                      </select>
                    </div>
                  </div>

                  {/* Rating Sliders */}
                  <div className="bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-5">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">KPI Ratings (1 = Poor, 5 = Excellent)</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Quality of Work</span><span className="font-bold text-indigo-500">{quality} / 5</span></div>
                      <input type="range" min="1" max="5" step="1" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-indigo-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Punctuality & Attendance</span><span className="font-bold text-indigo-500">{punctuality} / 5</span></div>
                      <input type="range" min="1" max="5" step="1" value={punctuality} onChange={(e) => setPunctuality(Number(e.target.value))} className="w-full accent-indigo-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Teamwork & Collaboration</span><span className="font-bold text-indigo-500">{teamwork} / 5</span></div>
                      <input type="range" min="1" max="5" step="1" value={teamwork} onChange={(e) => setTeamwork(Number(e.target.value))} className="w-full accent-indigo-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase">Manager&apos;s Feedback & OKR Notes</label>
                    <textarea required value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Provide actionable feedback, accomplishments, or areas for improvement..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] resize-none outline-none text-sm dark:text-white focus:ring-2 focus:ring-indigo-500"></textarea>
                  </div>

                  <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-4">
                    {isSaving ? "Saving Record..." : <><CheckCircle2 className="w-5 h-5" /> Save Evaluation</>}
                  </button>
                </form>

              </div>
            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}