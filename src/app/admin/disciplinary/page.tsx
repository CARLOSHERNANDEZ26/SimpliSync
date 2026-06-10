"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Gavel, AlertTriangle, Send, FileText, XCircle, UserX, ShieldAlert, CheckCircle, Clock, UserCheck, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { logAdminAction } from "@/lib/audit";

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
  formalNotice: string; 
  status: string; 
  employeeExplanation?: string;
  adminResolution?: string;
  verdict?: string;
  createdAt: { seconds: number } | null;
  explanationDate?: { seconds: number } | null;
  resolutionDate?: { seconds: number } | null;
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
  const [selectedCase, setSelectedCase] = useState<DisciplinaryRecord | null>(null);
  const [verdict, setVerdict] = useState("");
  const [resolutionText, setResolutionText] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;

    const empQ = query(collection(db, "users"), where("role", "==", "employee"));
    const unsubEmp = onSnapshot(empQ, (snap) => setEmployees(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee))));
    
    const recQ = query(collection(db, "disciplinaryRecords"), orderBy("createdAt", "desc"));
    const unsubRec = onSnapshot(recQ, (snap) => setRecords(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisciplinaryRecord))));

    return () => { unsubEmp(); unsubRec(); };
  }, [isAdmin]);

  const handleGenerateAdvisor = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmp || !offenseType || !description) return toast.error("Please fill all fields.");

    setIsGenerating(true);
    setAiDraft("");
    const empName = employees.find(e => e.id === selectedEmp)?.fullName || "the employee";

    const todayString = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

    const advisorPrompt = `Act as an expert Philippine HR Advisor. Today is ${todayString}. An employee named ${empName} has committed the following offense: ${offenseType}. 
    Context/Description: ${description}. 
    1. Briefly state the recommended standard disciplinary action (e.g., Verbal Warning, Written Warning, Notice to Explain) based on standard corporate policies and DOLE guidelines.
    2. Draft a professional, unbiased official memo/notice to be issued to the employee. You MUST use today's exact date (${todayString}) in the memo header.`;

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
        formalNotice: aiDraft,
        status: "Drafted - Pending HR Review",
        createdAt: serverTimestamp()
      });
      toast.success("Disciplinary record securely saved.");

      if (user?.email) {
        await logAdminAction(
          user.email, 
          `Issued Notice to Explain for ${offenseType}`, 
          `Employee: ${empName}`
        );
      }
      setIsModalOpen(false);
      setAiDraft("");
      setOffenseType("");
      setDescription("");
      setSelectedEmp("");
    } catch (error) {
      console.error("Failed to save record.", error);
      toast.error("Failed to save record.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolveCase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCase || !verdict || !resolutionText.trim()) return toast.error("Please fill all resolution fields.");
    
    setIsResolving(true);
    try {
      const recordRef = doc(db, "disciplinaryRecords", selectedCase.id);
      
      await updateDoc(recordRef, {
        status: `Resolved - ${verdict}`,
        verdict,
        adminResolution: resolutionText,
        resolutionDate: serverTimestamp()
      });

      toast.success(`Case closed. Verdict: ${verdict}`);

      if (user?.email) {
        await logAdminAction(
          user.email, 
          `Resolved Disciplinary Case: ${verdict}`, 
          `Employee: ${selectedCase.employeeName} | Offense: ${selectedCase.offenseType}`
        );
      }
      
      handleCloseCaseModal();
    } catch (error) {
      console.error("Resolution Error:", error);
      toast.error("Failed to resolve the case.");
    } finally {
      setIsResolving(false);
    }
  };

  const handleOpenCaseModal = (record: DisciplinaryRecord) => {
    setSelectedCase(record);
    setVerdict(record.verdict || "");
    setResolutionText(record.adminResolution || "");
  };

  const handleCloseCaseModal = () => {
    setSelectedCase(null);
    setVerdict("");
    setResolutionText("");
  };

  const getStatusBadge = (status: string) => {
    if (status.includes("Resolved")) {
      return <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3"/> {status}</span>;
    }
    if (status.includes("Explanation Submitted")) {
      return <span className="bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><UserCheck className="w-3 h-3"/> Ready for Review</span>;
    }
    return <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> Pending Employee Reply</span>;
  };

  if (!isAdmin && user) return <ProtectedRoute><div className="min-h-screen flex items-center justify-center">Access Denied.</div></ProtectedRoute>;

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-rose-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
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
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg animate-fade-in"
            >
              <AlertTriangle className="w-5 h-5" /> Log Incident
            </button>
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-2xl mb-8 flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400">Ethical AI Usage Policy</h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                The AI Advisor provides guidance based on standard HR practices. All generated notices are drafts and must be reviewed by the HR Administrator before being issued to ensure full compliance with the company handbook and due process.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                  <th className="pb-4 pl-4">Employee</th>
                  <th className="pb-4">Offense</th>
                  <th className="pb-4">Date Logged</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {records.length > 0 ? records.map(record => (
                  <tr 
                    key={record.id} 
                    onClick={() => handleOpenCaseModal(record)}
                    className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="py-4 pl-4 font-bold text-gray-900 dark:text-white flex items-center gap-2 group-hover:text-rose-500 transition-colors">
                      <UserX className="w-4 h-4 text-gray-400 group-hover:text-rose-400" /> {record.employeeName}
                    </td>
                    <td className="py-4 text-gray-700 dark:text-gray-300 font-medium">{record.offenseType}</td>
                    <td className="py-4 text-gray-500">{record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</td>
                    <td className="py-4">{getStatusBadge(record.status)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500 italic">No disciplinary records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {isModalOpen && (
             <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center md:justify-start md:pt-[90px] items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all overflow-y-auto">
              <div className="bg-white dark:bg-[#151515] w-full max-w-4xl h-full sm:h-auto max-h-[95dvh] sm:max-h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up md:my-0">
                
                <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 shrink-0 bg-white dark:bg-[#151515] z-[110] sticky top-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-rose-500" /> Log New Incident</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-rose-500 transition-colors rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10">
                    <XCircle className="w-7 h-7" />
                  </button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden">
                  
                  <div className="w-full lg:w-1/2 p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10 lg:overflow-y-auto custom-scrollbar shrink-0 sm:shrink">
                    <form onSubmit={handleGenerateAdvisor} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Select Employee</label>
                        <div className="relative">
                          <select 
                            required 
                            value={selectedEmp} 
                            onChange={(e) => setSelectedEmp(e.target.value)} 
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                          >
                            <option value="" className="text-gray-900">-- Choose Employee --</option>
                            {employees.map(emp => (<option key={emp.id} value={emp.id} className="text-gray-900 dark:text-white">{emp.fullName} ({emp.department || "No Dept"})</option>))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Offense Type</label>
                        <div className="relative">
                          <select 
                            required 
                            value={offenseType} 
                            onChange={(e) => setOffenseType(e.target.value)} 
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
                          >
                            <option value="" className="text-gray-900 dark:text-white">-- Select Offense Category --</option>
                            <option value="Chronic Tardiness" className="text-gray-900 dark:text-white">Chronic Tardiness</option>
                            <option value="Absenteeism / AWOL" className="text-gray-900 dark:text-white">Absenteeism / AWOL</option>
                            <option value="Insubordination" className="text-gray-900 dark:text-white">Insubordination</option>
                            <option value="Policy Violation" className="text-gray-900 dark:text-white">Policy Violation (Dress Code, IT, etc.)</option>
                            <option value="Misconduct" className="text-gray-900 dark:text-white">Professional Misconduct</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">Incident Details & Context</label>
                        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide specific dates, facts, and previous verbal warnings if applicable..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] resize-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-rose-500"></textarea>
                      </div>

                      <button type="submit" disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg flex justify-center items-center gap-2 disabled:opacity-50 mt-2">
                        {isGenerating ? "Consulting AI Advisor..." : <><Send className="w-4 h-4" /> Ask AI Advisor</>}
                      </button>
                    </form>
                  </div>

                  <div className="w-full lg:w-1/2 p-5 sm:p-6 flex flex-col bg-slate-50 dark:bg-black/10 lg:overflow-y-auto custom-scrollbar shrink-0 sm:shrink">
                    <div className="mb-4">
                      <h4 className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
                        <FileText className="w-4 h-4" /> AI Draft & Manual Entry
                      </h4>
                      <p className="text-xs text-gray-400 mt-1">Use the AI on the left, or manually type the formal notice below.</p>
                    </div>
                    <textarea
                      value={aiDraft}
                      onChange={(e) => setAiDraft(e.target.value)}
                      placeholder="Type the formal Notice to Explain here..."
                      className="flex-1 w-full min-h-[200px] bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 overflow-y-auto custom-scrollbar resize-none outline-none text-gray-900 focus:ring-2 focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-600"
                    />
                    <div className="mt-4 space-y-3">
                      <button 
                        onClick={handleSaveRecord} 
                        disabled={isSaving || !aiDraft.trim() || !selectedEmp || !offenseType} 
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save Official Record"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedCase && (
            <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center md:justify-start md:pt-[90px] items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all overflow-y-auto">
              <div className="bg-slate-50 dark:bg-[#121212] w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[95dvh] sm:max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200 md:my-0">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] shrink-0">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-rose-500" />
                      Case File: {selectedCase.employeeName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                      {selectedCase.offenseType} • Logged {selectedCase.createdAt ? new Date(selectedCase.createdAt.seconds * 1000).toLocaleDateString() : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(selectedCase.status)}
                    <button 
                      onClick={handleCloseCaseModal} 
                      className="text-gray-400 hover:text-rose-500 transition-colors bg-gray-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-full"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-rose-100 dark:border-rose-500/20 shadow-sm">
                    <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Original Notice to Explain
                    </h4>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {selectedCase.formalNotice.replace(/\*\*/g, '')}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-teal-100 dark:border-teal-500/20 shadow-sm">
                    <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <UserX className="w-4 h-4" /> Employee&rsquo;s Explanation
                    </h4>
                    {selectedCase.employeeExplanation ? (
                      <div>
                        <div className="text-sm text-gray-700 dark:text-white whitespace-pre-wrap leading-relaxed italic bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5 mb-2">
                          {selectedCase.employeeExplanation}
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          Submitted on: {selectedCase.explanationDate ? new Date(selectedCase.explanationDate.seconds * 1000).toLocaleString() : "Unknown"}
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 dark:text-gray-400 italic p-4 bg-gray-100 dark:bg-black/20 rounded-xl border border-dashed border-gray-300 dark:border-white/10 text-center">
                          The employee has not submitted their formal explanation yet.
                      </div>
                    )}
                  </div>

                  <div className={`rounded-2xl p-6 border shadow-sm ${selectedCase.status.includes("Resolved") ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" : "bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10"}`}>
                    <h4 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${selectedCase.status.includes("Resolved") ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                      <Gavel className="w-4 h-4" /> Final Resolution & Verdict
                    </h4>
                    
                    {selectedCase.status.includes("Resolved") ? (
                      <div>
                        <div className="mb-4">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Verdict Issued</span>
                          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">{selectedCase.verdict}</p>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-white whitespace-pre-wrap leading-relaxed bg-white dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                          {selectedCase.adminResolution}
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleResolveCase} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase">Final Verdict</label>
                          <div className="relative">
                            <select 
                              required 
                              value={verdict} 
                              onChange={(e) => setVerdict(e.target.value)} 
                              className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                            >
                              <option value="" className="text-gray-900 dark:text-white">-- Select Final Action --</option>
                              <option value="Cleared / Exonerated" className="text-gray-900 dark:text-white">Cleared / Exonerated</option>
                              <option value="Verbal Warning Documented" className="text-gray-900 dark:text-white">Verbal Warning Documented</option>
                              <option value="Written Warning" className="text-gray-900 dark:text-white">Written Warning</option>
                              <option value="Suspension" className="text-gray-900 dark:text-white">Suspension</option>
                              <option value="Termination" className="text-gray-900 dark:text-white">Termination</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase">Resolution Details & Justification</label>
                          <textarea 
                            required 
                            value={resolutionText} 
                            onChange={(e) => setResolutionText(e.target.value)} 
                            placeholder="Detail the reasoning behind the verdict based on the employee's explanation and company policy..." 
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[120px] resize-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
                          />
                        </div>

                        <button 
                          type="submit" 
                          disabled={isResolving || !verdict || !resolutionText.trim()} 
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2 mt-2"
                        >
                          {isResolving ? "Closing Case..." : <><CheckCircle className="w-4 h-4" /> Officially Resolve Case</>}
                        </button>
                      </form>
                    )}
                  </div>

                </div>

                <div className="p-4 bg-white dark:bg-[#151515] border-t border-gray-200 dark:border-white/10 shrink-0">
                  <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">
                    Confidential HR Operation • SimpliSync Compliance Engine
                  </p>
                </div>
                
              </div>
            </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}