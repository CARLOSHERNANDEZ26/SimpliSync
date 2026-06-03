"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FolderOpen, Star, User, Calendar, Award, ShieldCheck, AlertTriangle, XCircle, Send, Clock, CheckCircle, Gift } from "lucide-react";
import toast from "react-hot-toast";

interface Evaluation {
  id: string;
  quarter: string;
  year: number;
  evaluator: string;
  averageScore: number;
  feedback: string;
  metrics: {
    quality: number;
    punctuality: number;
    teamwork: number;
  };
}

interface DisciplinaryRecord {
  id: string;
  employeeId: string;
  offenseType: string;
  formalNotice: string; 
  status: string;
  employeeExplanation?: string;
  adminResolution?: string;
  verdict?: string;
  createdAt: { seconds: number } | null;
}

interface Bonus { 
  id: string; 
  type: string; 
  year: number; 
  amount: number; 
  distributedAt: { seconds: number } | null; 
}

export default function Employee201FilePage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryRecord[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<DisciplinaryRecord | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [explanationText, setExplanationText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Disciplinary Records
  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(
      collection(db, "disciplinaryRecords"), 
      where("employeeId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snap) => {
      setDisciplinaryActions(snap.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          employeeId: data.employeeId,
          offenseType: data.offenseType,
          formalNotice: data.formalNotice || data.aiDraft || data.content || "Formal notice content unavailable.",
          status: data.status || "Issued", 
          employeeExplanation: data.employeeExplanation || "",
          adminResolution: data.adminResolution || "",
          verdict: data.verdict || "",
          createdAt: data.createdAt 
        };
      }));
    });
    
    return () => unsubscribe();
  }, [user?.uid]);
  
  // Fetch Evaluations
  useEffect(() => {  
    if (!user?.uid) return;
    const q = query(collection(db, "evaluations"), where("employeeId", "==", user.uid), orderBy("year", "desc"), orderBy("quarter", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setEvaluations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluation)));
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) return; 
    const currentYear = new Date().getFullYear();
    const q = query(
      collection(db, "benefitDistributions"), 
      where("userId", "==", user.uid), 
      where("year", "==", currentYear), 
      orderBy("distributedAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setBonuses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bonus)));
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    if (score >= 3.0) return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
  };

  const handleSubmitExplanation = async () => {
    if (!selectedNotice || !explanationText.trim()) return;
    setIsSubmitting(true);
    
    try {
      const recordRef = doc(db, "disciplinaryRecords", selectedNotice.id);
      
      await updateDoc(recordRef, {
        employeeExplanation: explanationText,
        status: "Explanation Submitted",
        explanationDate: serverTimestamp()
      });

      toast.success("Official explanation submitted to HR.");

      setSelectedNotice({
        ...selectedNotice,
        status: "Explanation Submitted",
        employeeExplanation: explanationText
      });
      setExplanationText("");

    } catch (error) {
      console.error("Submit Error:", error);
      toast.error("Failed to submit explanation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedNotice(null);
    setExplanationText("");
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">

          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FolderOpen className="w-10 h-10 text-teal-500" />
              My 201 File
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Your official employee records, performance reviews, and HR profile.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* LEFT COLUMN: User Profile & Bonuses */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl text-center">
                <div className="w-24 h-24 bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-200 dark:border-teal-500/30">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user?.displayName || "Employee"}</h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-xs font-bold text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5" /> Official Record
                </span>

                <div className="mt-6 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Email ID</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Status</span>
                    <span className="text-sm font-bold text-emerald-500">Active</span>
                  </div>
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> System ID</span>
                    <span className="text-xs font-mono text-gray-500 truncate max-w-[100px]" title={user?.uid}>{user?.uid}</span>
                  </div>
                </div>
              </div>

              {/* Migrated Bonus & Benefits Card */}
              <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-200 dark:border-teal-500/20 rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-teal-900 dark:text-teal-400 mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5" /> Compensation & Bonuses
                </h3>
                {bonuses.length > 0 ? (
                  <div className="space-y-3">
                    {bonuses.map(bonus => (
                      <div key={bonus.id} className="bg-white dark:bg-black/40 p-4 rounded-2xl border border-teal-100 dark:border-teal-500/10 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{bonus.type}</div>
                          <div className="text-[10px] text-gray-500 uppercase tracking-wider">{bonus.year} • Distributed</div>
                        </div>
                        <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          +₱{bonus.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-white/50 dark:bg-black/20 rounded-2xl border border-dashed border-teal-200/50 dark:border-white/5">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">No additional compensation logged.</p>
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: Evaluations & Notices */}
            <div className="lg:col-span-2 space-y-8">
              
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-500" />
                  Quarterly Appraisals
                </h3>

                {isLoading ? (
                  <div className="flex justify-center items-center h-40 text-gray-500">Loading records...</div>
                ) : evaluations.length > 0 ? (
                  <div className="space-y-4 pr-2 overflow-y-auto custom-scrollbar max-h-[600px]">
                    {evaluations.map((evalRecord) => (
                      <div key={evalRecord.id} className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-white/5">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{evalRecord.quarter} {evalRecord.year} Review</h4>
                            <p className="text-xs text-gray-500 font-medium uppercase mt-1">Evaluator: {evalRecord.evaluator}</p>
                          </div>
                          <span className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border font-bold text-lg shadow-sm ${getScoreColor(evalRecord.averageScore)}`}>
                            <Star className="w-5 h-5 fill-current" /> {evalRecord.averageScore.toFixed(1)} / 5.0
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Quality</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{evalRecord.metrics?.quality || 0}/5</span>
                          </div>
                          <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Punctuality</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{evalRecord.metrics?.punctuality || 0}/5</span>
                          </div>
                          <div className="bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                            <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Teamwork</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{evalRecord.metrics?.teamwork || 0}/5</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase block mb-2">Manager&apos;s Feedback</span>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-black/40 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                            {evalRecord.feedback}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 italic py-20 bg-slate-50 dark:bg-black/10 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    No official performance evaluations on record yet.
                  </div>
                )}
              </div>
                
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                  Official HR Notices
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {disciplinaryActions.length > 0 ? (
                    disciplinaryActions.map((record) => {
                      const isPendingAction = record.status.includes("Drafted") || record.status === "Issued";
                      const isResolved = record.status.includes("Resolved");
                      
                      return (
                      <div 
                        key={record.id} 
                        onClick={() => setSelectedNotice(record)}
                        className={`group cursor-pointer p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                          isPendingAction 
                            ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 hover:border-rose-500" 
                            : isResolved
                            ? "bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-400"
                            : "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 hover:border-amber-500" // Under review
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white dark:bg-black/20 border ${
                              isPendingAction ? "text-rose-600 border-rose-100" : isResolved ? "text-gray-500 border-gray-200" : "text-amber-600 border-amber-100"
                            }`}>
                              {record.offenseType}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              {record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : "Pending"}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                            Notice to Explain
                          </h4>
                          
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {record.formalNotice.replace(/\*\*/g, '')}
                          </p>
                        </div>

                        <div className={`mt-4 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                          isPendingAction ? "text-rose-600 dark:text-rose-400" : isResolved ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                        }`}>
                          {isPendingAction && <><AlertTriangle className="w-3.5 h-3.5" /> Action Required (Reply Needed)</>}
                          {!isPendingAction && !isResolved && <><Clock className="w-3.5 h-3.5" /> Under HR Review</>}
                          {isResolved && <><CheckCircle className="w-3.5 h-3.5" /> Case Resolved</>}
                        </div>
                      </div>
                    )})
                  ) : (
                    <div className="col-span-full text-center text-gray-500 italic py-12 bg-slate-50 dark:bg-black/10 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                      No disciplinary records on file. Excellent work!
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
        
        {/* The Interactive Notice & Resolution Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-50 dark:bg-[#121212] w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    {selectedNotice.offenseType} Case File
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                    Official Notice issued on {selectedNotice.createdAt ? new Date(selectedNotice.createdAt.seconds * 1000).toLocaleDateString() : ""}
                  </p>
                </div>
                <button 
                  onClick={handleCloseModal} 
                  className="text-gray-400 hover:text-rose-500 transition-colors bg-gray-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-500/10 p-2 rounded-full"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-rose-100 dark:border-rose-500/20 shadow-sm">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Official Notice to Explain
                  </h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {selectedNotice.formalNotice.replace(/\*\*/g, '')}
                  </div>
                </div>

                {selectedNotice.employeeExplanation ? (
                  <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-teal-100 dark:border-teal-500/20 shadow-sm">
                    <h4 className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" /> Your Submitted Explanation
                    </h4>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed italic bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                      &quot;{selectedNotice.employeeExplanation}&quot;
                    </div>
                  </div>
                ) : (

                  <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 border border-amber-200 dark:border-amber-500/30 shadow-sm">
                    <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">
                      Action Required: Submit Your Explanation
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      As per DOLE due process guidelines, you have the right to be heard. Please provide your written explanation regarding the incidents detailed above.
                    </p>
                    <textarea
                      value={explanationText}
                     onChange={(e) => setExplanationText(e.target.value)}
                     placeholder="Type your formal explanation and defense here..."
                     className="w-full min-h-[150px] p-4 bg-slate-50 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:ring-2 focus:ring-teal-500 outline-none mb-4 custom-scrollbar"
                     />
                    <button
                      onClick={handleSubmitExplanation}
                      disabled={isSubmitting || !explanationText.trim()}
                      className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                      {isSubmitting ? "Submitting to HR..." : <><Send className="w-4 h-4" /> Submit Official Explanation</>}
                    </button>
                  </div>
                )}

                {selectedNotice.status.includes("Resolved") && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> HR Resolution: {selectedNotice.verdict}
                    </h4>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {selectedNotice.adminResolution || "Case closed by HR Administration."}
                    </div>
                  </div>
                )}

              </div>

              <div className="p-4 bg-white dark:bg-[#151515] border-t border-gray-200 dark:border-white/10 shrink-0">
                <p className="text-[10px] text-gray-400 text-center uppercase font-bold tracking-widest">
                  Confidential Document • SimpliSync Compliance Engine
                </p>
              </div>
              
            </div>
          </div>
        )}

      </main>
    </ProtectedRoute>
  );
}