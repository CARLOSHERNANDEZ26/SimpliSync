"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gavel, AlertTriangle, Send, FileText, XCircle, UserX, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

interface Employee {
  id: string; 
  fullName: string; 
  department?: string; 
}
interface DisciplinaryRecord { 
  id: string; 
  employeeId: string; 
  employeeName: string; 
  offenseType: string; 
  description: string; 
  aiRecommendation: string; 
  status: string; 
  createdAt: { seconds: number }
 }

export default function DisciplinaryPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<DisciplinaryRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [offenseType, setOffenseType] = useState("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const empQ = query(collection(db, "users"), where("role", "==", "employee"));
    const unsubEmp = onSnapshot(empQ, (snap) => setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee))));
    const recQ = query(collection(db, "disciplinaryRecords"), orderBy("createdAt", "desc"));
    const unsubRec = onSnapshot(recQ, (snap) => setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisciplinaryRecord))));

    return () => { unsubEmp(); unsubRec(); };
  }, [isAdmin]);

  const handleGenerateAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !offenseType || !description) return toast.error("Please fill all fields.");

    setIsGenerating(true);
    setAiDraft("");

    const empName = employees.find(e => e.id === selectedEmp)?.fullName || "the employee";

    const advisorPrompt = `Act as an expert Philippine HR Advisor. An employee named ${empName} has committed the following offense: ${offenseType}. 
    Context/Description: ${description}. 
    1. Briefly state the recommended standard disciplinary action (e.g., Verbal Warning, Written Warning, Notice to Explain) based on standard corporate policies and DOLE guidelines.
    2. Draft a professional, unbiased official memo/notice to be issued to the employee.`;

    try {
      const response = await fetch("/api/generate-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: advisorPrompt }),
      });

      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "AI Generation failed");

      setAiDraft(data.memo || "");
      toast.success("AI Recommendation Generated!");
    } catch (error) {
        console.error("AI Advisor Error:", error);
      toast.error("Failed to connect to AI Advisor.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveRecord = async () => {
    if (!aiDraft) return;
    setIsSaving(true);
    try {
      const empName = employees.find(e => e.id === selectedEmp)?.fullName || "Unknown";
      await addDoc(collection(db, "disciplinaryRecords"), {
        employeeId: selectedEmp,
        employeeName: empName,
        offenseType,
        description,
        aiRecommendation: aiDraft,
        status: "Drafted - Pending HR Review",
        createdAt: serverTimestamp()
      });
      toast.success("Disciplinary record securely saved.");
      setIsModalOpen(false);
      setAiDraft("");
      setOffenseType("");
      setDescription("");
      setSelectedEmp("");
    } catch (error) {
        console.error ("Failed to save record.", error);
      toast.error("Failed to save record.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin && user) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center">Access Denied.</div></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Gavel className="w-10 h-10 text-rose-500" />
                Disciplinary Action Advisor
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                AI-assisted incident resolution and DOLE-compliant memo drafting.
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
              <AlertTriangle className="w-5 h-5" /> Log Incident
            </button>
          </div>

          {/* AI Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl mb-8 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Ethical AI Usage Policy</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                The AI Advisor provides guidance based on standard HR practices. All generated notices are drafts and must be reviewed by the HR Administrator before being issued to ensure full compliance with the company handbook and due process.
              </p>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="pb-4 pl-2">Employee</th>
                  <th className="pb-4">Offense</th>
                  <th className="pb-4">Date Logged</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {records.length > 0 ? records.map(record => (
                  <tr key={record.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-2 font-bold text-gray-900 dark:text-white flex items-center gap-2"><UserX className="w-4 h-4 text-gray-400" /> {record.employeeName}</td>
                    <td className="py-4 text-rose-600 dark:text-rose-400 font-medium">{record.offenseType}</td>
                    <td className="py-4 text-gray-500">{record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</td>
                    <td className="py-4"><span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-1 rounded text-xs font-bold">{record.status}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500 italic">No disciplinary records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Incident Logging Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-[#151515] w-full max-w-4xl rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh]">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-rose-500" /> Log New Incident</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-rose-500 transition-colors"><XCircle className="w-6 h-6" /></button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                  {/* Left Column: Input Form */}
                  <div className="w-full lg:w-1/2 p-6 border-r border-gray-200 dark:border-white/10 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleGenerateAdvisor} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Select Employee</label>
                        <select required value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm dark:text-white">
                          <option value="">-- Choose Employee --</option>
                          {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.fullName} ({emp.department || "No Dept"})</option>))}
                        </select>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Offense Type</label>
                        <select required value={offenseType} onChange={(e) => setOffenseType(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm dark:text-white">
                          <option value="">-- Select Offense Category --</option>
                          <option value="Chronic Tardiness">Chronic Tardiness</option>
                          <option value="Absenteeism / AWOL">Absenteeism / AWOL</option>
                          <option value="Insubordination">Insubordination</option>
                          <option value="Policy Violation">Policy Violation (Dress Code, IT, etc.)</option>
                          <option value="Misconduct">Professional Misconduct</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Incident Details & Context</label>
                        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide specific dates, facts, and previous verbal warnings if applicable..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] resize-none outline-none text-sm dark:text-white"></textarea>
                      </div>

                      <button type="submit" disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50">
                        {isGenerating ? "Consulting AI Advisor..." : <><Send className="w-4 h-4" /> Ask AI Advisor</>}
                      </button>
                    </form>
                  </div>

                  {/* Right Column: AI Output & Manual Entry */}
                  <div className="w-full lg:w-1/2 p-6 flex flex-col bg-slate-50 dark:bg-black/10 overflow-y-auto custom-scrollbar">
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                        <FileText className="w-4 h-4" /> AI Draft & Manual Entry
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">Use the AI on the left, or manually type the formal notice below.</p>
                    </div>
                    
                    {/* Always visible textarea */}
                    <textarea
                      value={aiDraft}
                      onChange={(e) => setAiDraft(e.target.value)}
                      placeholder="Type the formal Notice to Explain here..."
                      className="flex-1 w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 overflow-y-auto custom-scrollbar resize-none outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    
                    {/* Save button activates as soon as they type something and select an employee */}
                    <button 
                      onClick={handleSaveRecord} 
                      disabled={isSaving || !aiDraft.trim() || !selectedEmp || !offenseType} 
                      className="mt-4 w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                    >
                      {isSaving ? "Saving..." : "Save Official Record"}
                    </button>
                  
                    {aiDraft && (
                      <button onClick={handleSaveRecord} disabled={isSaving} className="mt-4 w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50">
                        {isSaving ? "Saving..." : "Save Record & Draft"}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}