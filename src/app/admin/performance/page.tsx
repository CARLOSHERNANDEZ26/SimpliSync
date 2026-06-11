"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, Award, Star, CheckCircle2, Search, XCircle, ChevronDown, Edit2, Trash2, AlertTriangle } from "lucide-react";
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
  
  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvalId, setEditingEvalId] = useState<string | null>(null);
  
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

  const openNewEvaluation = () => {
    setEditingEvalId(null);
    setSelectedEmp("");
    setQuarter("Q1");
    setQuality(3);
    setPunctuality(3);
    setTeamwork(3);
    setFeedback("");
    setIsModalOpen(true);
  };

  const openEditEvaluation = (evalRecord: Evaluation) => {
    setEditingEvalId(evalRecord.id);
    setSelectedEmp(evalRecord.employeeId);
    setQuarter(evalRecord.quarter);
    setQuality(evalRecord.metrics?.quality || 3);
    setPunctuality(evalRecord.metrics?.punctuality || 3);
    setTeamwork(evalRecord.metrics?.teamwork || 3);
    setFeedback(evalRecord.feedback);
    setIsModalOpen(true);
  };

  const handleDeleteEvaluation = (id: string, empName: string) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-300 max-w-md w-full bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl p-5 border border-gray-200 dark:border-white/10`}>
        <div className="flex items-center gap-2 text-rose-600 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-bold">Delete Official Record?</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to permanently delete this appraisal for <strong>{empName}</strong>? This action will be logged.
        </p>
        <div className="flex gap-3">
          <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-4 py-2 text-sm font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await deleteDoc(doc(db, "evaluations", id));
                toast.success("Appraisal deleted.");
                if (user?.email) await logAdminAction(user.email, "Deleted Performance Appraisal", `Employee: ${empName}`);
              } catch (error) {
                console.error("Delete Error:", error);
                toast.error("Failed to delete record.");
              }
            }} 
            className="flex-1 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition-colors"
          >
            Delete Record
          </button>
        </div>
      </div>
    ), { id: `confirm-${id}`, duration: 5000 });
  };

  const handleSubmitEvaluation = async (e: React.FormEvent) => { 
    e.preventDefault();
    if (!selectedEmp || !feedback.trim()) return toast.error("Please select an employee and provide feedback.");

    if (!editingEvalId) {
      const duplicateExists = evaluations.some(
        ev => ev.employeeId === selectedEmp && ev.quarter === quarter && ev.year === currentYear
      );
      if (duplicateExists) {
        return toast.error(`An appraisal for this employee in ${quarter} ${currentYear} already exists! Please edit the existing record instead.`);
      }
    }

    setIsSaving(true);
    try { 
      const empName = employees.find(e => e.id === selectedEmp)?.fullName || "Unknown";
      const averageScore = Number(((quality + punctuality + teamwork) / 3).toFixed(1));

      const payload = {
        employeeId: selectedEmp,
        employeeName: empName,
        evaluator: user?.displayName || "HR Admin",
        quarter,
        year: currentYear,
        metrics: { quality, punctuality, teamwork },
        averageScore,
        feedback,
      };

      if (editingEvalId) {
        await updateDoc(doc(db, "evaluations", editingEvalId), payload);
        toast.success("Performance evaluation updated!");
        if (user?.email) await logAdminAction(user.email, `Updated Quarterly Appraisal (Score: ${averageScore.toFixed(1)})`, `Employee: ${empName}`);
      } else {
        await addDoc(collection(db, "evaluations"), { ...payload, createdAt: serverTimestamp() });
        toast.success("Performance evaluation saved successfully!");
        if (user?.email) await logAdminAction(user.email, `Logged Quarterly Appraisal (Score: ${averageScore.toFixed(1)})`, `Employee: ${empName}`);
      }
       
      setIsModalOpen(false);
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
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <TrendingUp className="w-10 h-10 text-indigo-500" />
                Employee Performance Appraisals
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
              <button onClick={openNewEvaluation} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg whitespace-nowrap">
                <Award className="w-5 h-5" /> New Evaluation
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="pb-4 pl-2">Employee</th>
                  <th className="pb-4">Period</th>
                  <th className="pb-4">Evaluator</th>
                  <th className="pb-4 text-center">Avg Score</th>
                  <th className="pb-4">Core Feedback</th>
                  <th className="pb-4 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredEvals.length > 0 ? filteredEvals.map(evalRecord => (
                  <tr key={evalRecord.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
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
                    <td className="py-4 text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEditEvaluation(evalRecord)} className="p-2 text-gray-400 hover:text-indigo-500 bg-gray-100 dark:bg-white/5 rounded-lg transition-colors" title="Edit Record">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteEvaluation(evalRecord.id, evalRecord.employeeName)} className="p-2 text-gray-400 hover:text-rose-500 bg-gray-100 dark:bg-white/5 rounded-lg transition-colors" title="Delete Record">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-500 italic">No evaluation records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center md:items-center md:justify-start md:pt-[90px] bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all overflow-y-auto">
              <div className="bg-white dark:bg-[#151515] w-full max-w-2xl flex flex-col max-h-[90dvh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up my-auto md:my-0">
                
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#151515]">
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-500" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {editingEvalId ? "Edit Evaluation" : "New Evaluation"}
                    </h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors p-1">
                    <XCircle className="w-7 h-7" />
                  </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 p-5 sm:p-6">
                  <form id="evaluation-form" onSubmit={handleSubmitEvaluation} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Employee</label>
                        <div className="relative">
                          <select 
                            required 
                            value={selectedEmp} 
                            onChange={(e) => setSelectedEmp(e.target.value)} 
                            disabled={!!editingEvalId} 
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="" disabled>-- Choose Employee --</option>
                            {employees.map(emp => (<option key={emp.id} value={emp.id} className="text-gray-900 dark:text-white">{emp.fullName} ({emp.department || "No Dept"})</option>))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Review Period</label>
                        <div className="relative">
                          <select 
                            required 
                            value={quarter} 
                            onChange={(e) => setQuarter(e.target.value)} 
                            disabled={!!editingEvalId}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-10 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer disabled:opacity-50"
                          >
                            <option value="Q1" className="text-gray-900 dark:text-white">Q1 (Jan - Mar)</option>
                            <option value="Q2" className="text-gray-900 dark:text-white">Q2 (Apr - Jun)</option>
                            <option value="Q3" className="text-gray-900 dark:text-white">Q3 (Jul - Sep)</option>
                            <option value="Q4" className="text-gray-900 dark:text-white">Q4 (Oct - Dec)</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-6">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">KPI Ratings (1 = Poor, 5 = Excellent)</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Quality of Work</span><span className="font-bold text-indigo-500">{quality} / 5</span></div>
                        <input type="range" min="1" max="5" step="1" value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Punctuality & Attendance</span><span className="font-bold text-indigo-500">{punctuality} / 5</span></div>
                        <input type="range" min="1" max="5" step="1" value={punctuality} onChange={(e) => setPunctuality(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm"><span className="font-medium text-gray-700 dark:text-gray-300">Teamwork & Collaboration</span><span className="font-bold text-indigo-500">{teamwork} / 5</span></div>
                        <input type="range" min="1" max="5" step="1" value={teamwork} onChange={(e) => setTeamwork(Number(e.target.value))} className="w-full accent-indigo-500 cursor-pointer" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase">Manager&apos;s Feedback & OKR Notes</label>
                      <textarea 
                        required 
                        value={feedback} 
                        onChange={(e) => setFeedback(e.target.value)} 
                        placeholder="Provide actionable feedback, accomplishments, or areas for improvement..." 
                        className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] resize-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-indigo-500"
                      ></textarea>
                    </div>
                  </form>
                </div>

                <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#151515]">
                  <button form="evaluation-form" type="submit" disabled={isSaving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                    {isSaving ? "Saving Record..." : <><CheckCircle2 className="w-5 h-5" /> {editingEvalId ? "Update Evaluation" : "Save Evaluation"}</>}
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}