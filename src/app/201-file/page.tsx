"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FolderOpen, Star, User, Calendar, Award, ShieldCheck, AlertTriangle, XCircle } from "lucide-react";

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
  createdAt: { seconds: number } | null;
}

export default function Employee201FilePage() {
  const { user } = useAuth();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryRecord[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<DisciplinaryRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          createdAt: data.createdAt 
        };
      }));
    });
    
    return () => unsubscribe();
  }, [user?.uid]);
  
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "evaluations"),
      where("employeeId", "==", user.uid),
      orderBy("year", "desc"),
      orderBy("quarter", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setEvaluations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Evaluation)));
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
    if (score >= 3.0) return "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30";
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          {/* Header */}
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
            
            {/* Left Column: Profile Card */}
            <div className="lg:col-span-1 space-y-6">
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
            </div>

            {/* Right Column: Performance Evaluations */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl min-h-[500px]">
                
                {/* Section 1: Appraisals */}
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
                
                {/* Section 2: Official HR Notices (Card View) */}
                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    Official HR Notices
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {disciplinaryActions.length > 0 ? (
                      disciplinaryActions.map((record) => (
                        <div 
                          key={record.id} 
                          onClick={() => setSelectedNotice(record)}
                          className="group cursor-pointer p-5 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all duration-300 flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest px-2 py-0.5 rounded-md bg-white dark:bg-black/20 border border-rose-100 dark:border-rose-500/10">
                                {record.offenseType}
                              </span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">
                                {record.createdAt ? new Date(record.createdAt.seconds * 1000).toLocaleDateString() : "Pending"}
                              </span>
                            </div>
                            
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                              Notice to Explain
                            </h4>
                            
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {record.formalNotice}
                            </p>
                          </div>
                          
                          <div className="mt-4 flex items-center text-[10px] font-bold text-rose-500/70 group-hover:text-rose-500 transition-colors">
                            Click to review formal document &rarr;
                          </div>
                        </div>
                      ))
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
        </div>

        {/* The Notice Reading Modal */}
        {selectedNotice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#121212] w-full max-w-2xl rounded-3xl shadow-2xl border border-rose-200 dark:border-rose-500/20 flex flex-col max-h-[85vh]">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-rose-100 dark:border-rose-500/10 sticky top-0 bg-white dark:bg-[#121212] z-10 rounded-t-3xl">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" />
                    {selectedNotice.offenseType}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">
                    Official Notice issued on {selectedNotice.createdAt ? new Date(selectedNotice.createdAt.seconds * 1000).toLocaleDateString() : ""}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedNotice(null)} 
                  className="text-gray-400 hover:text-rose-500 transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-full"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {selectedNotice.formalNotice.replace(/\*\*/g, '')}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-slate-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 rounded-b-3xl">
                <p className="text-[10px] text-gray-500 text-center uppercase font-bold tracking-widest">
                  Confidential HR Document • SimpliSync Compliance Engine
                </p>
              </div>
              
            </div>
          </div>
        )}

      </main>
    </ProtectedRoute>
  );
}