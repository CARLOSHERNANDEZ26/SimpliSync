"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Bot, FileText, Send, Sparkles, Trash2, List, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logAdminAction } from "@/lib/audit";

interface Announcement {
  id: string;
  content: string;
  author: string;
  createdAt: { seconds: number } | null;
}

export default function MemoGeneratorPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generatedMemo, setGeneratedMemo] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"draft" | "live">("draft");
  const [publishedMemos, setPublishedMemos] = useState<Announcement[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPublishedMemos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });
    return () => unsubscribe();
  }, [isAdmin]);

 const executeDeletePolicy = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("Policy permanently removed.");
    } catch (error: unknown) {
      console.error("Delete Error:", error);
      toast.error("Failed to delete policy.");
    }
  };

  const handleDeletePolicy = (id: string) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-300 max-w-md w-full bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border border-gray-200 dark:border-white/10`}>
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-bold">Delete Live Policy?</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          This will remove the policy from the employee dashboard immediately. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-4 py-2.5 text-sm font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { executeDeletePolicy(id); toast.dismiss(t.id); }} 
            className="flex-1 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20 transition-colors"
          >
            Delete Policy
          </button>
        </div>
      </div>
    ), { id: `confirm-policy-${id}`, duration: 5000 });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return toast.error("Please enter a prompt first.");

    setIsGenerating(true);
    setGeneratedMemo(""); 
    setActiveTab("draft"); 
    
    try {
      const response = await fetch("/api/generate-memo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json() as { memo?: string; error?: string };

      if (!response.ok || data.error) throw new Error(data.error || "Failed to generate memo");

      setGeneratedMemo(data.memo || "");
      toast.success("Memo generated successfully!");
      
    } catch (error: unknown) {
        console.error("Generation Error:", error);
      toast.error("Failed to connect to the AI. Please try again.");
    } finally {
      setIsGenerating(false);
      setIsCopied(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedMemo) return;
    try {
      await navigator.clipboard.writeText(generatedMemo);
      setIsCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error: unknown) {
      console.error("Copy Error:", error);
      toast.error("Failed to copy text.");
    }
  };

  const handlePublish = async () => {
    if (!generatedMemo.trim()) return;

    setIsPublishing(true);

    try {
      await addDoc(collection(db, "announcements"), {
        content: generatedMemo,
        author: user?.displayName || "HR Administration",
        createdAt: serverTimestamp(),
      });
      toast.success("Memo published to the company dashboard!");

      if (user?.email) {
        await logAdminAction(
          user.email, 
          "Published Company Memorandum", 
          "Target: All Employees"
        );
      }
      setGeneratedMemo(""); 
      setActiveTab("live"); 

    } catch (error: unknown) {
      console.error("Publish Error:", error);
      toast.error("Failed to publish announcement.");
    } finally {
      setIsPublishing(false);
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
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-indigo-400/20 dark:bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bot className="w-10 h-10 text-indigo-500" />
              Automated Policy Generator
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Input */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl h-fit">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Instructions
              </h3>
              <form onSubmit={handleGenerate} className="space-y-4">
                <textarea 
                  required value={prompt} onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="e.g., Draft a memo reminding employees to submit their holiday VL requests..." 
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white h-40 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
                <button type="submit" disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
                  {isGenerating ? "Generating Draft..." : <><Send className="w-4 h-4" /> Generate with AI</>}
                </button>
              </form>
            </div>

            {/* Right Column: Dual-Tabs (Draft vs Live) */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col min-h-[500px]">
              
              {/* Tab Navigation */}
              <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-white/10 pb-2">
                <button 
                  onClick={() => setActiveTab("draft")}
                  className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold transition-colors ${activeTab === "draft" ? "text-indigo-500 border-b-2 border-indigo-500" : "text-gray-500 hover:text-gray-300"}`}
                >
                  <FileText className="w-4 h-4" /> Current Draft
                </button>
                <button 
                  onClick={() => setActiveTab("live")}
                  className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold transition-colors ${activeTab === "live" ? "text-teal-500 border-b-2 border-teal-500" : "text-gray-500 hover:text-gray-300"}`}
                >
                  <List className="w-4 h-4" /> Live Dashboard Policies ({publishedMemos.length})
                </button>
              </div>

              {/* Tab Content: DRAFT */}
              {activeTab === "draft" && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-500">Draft your memo manually, or use AI above</span>
                    <div className="flex gap-2">
                      {generatedMemo && (
                        <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-bold bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-colors">
                          {isCopied ? "Copied!" : "Copy"}
                        </button>
                      )}
                      <button onClick={handlePublish} disabled={isPublishing || !generatedMemo.trim()} className="flex items-center gap-1 text-xs font-bold bg-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors">
                        {isPublishing ? "Publishing..." : "Publish to Dashboard"}
                      </button>
                    </div>
                  </div>
                  
                  {/* The Textarea is now ALWAYS visible so the Admin can manually type */}
                  <textarea
                    value={generatedMemo}
                    onChange={(e) => setGeneratedMemo(e.target.value)}
                    placeholder="Type your official announcement here, or use the AI Generator on the left to instantly draft a DOLE-compliant memo..."
                    className="flex-1 w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-sm text-gray-700 dark:text-gray-300 resize-none outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
                  />
                </>
              )}

              {/* Tab Content: LIVE POLICIES */}
              {activeTab === "live" && (
                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {publishedMemos.length > 0 ? (
                    publishedMemos.map(memo => (
                      <div key={memo.id} className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDeletePolicy(memo.id)} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500 hover:text-rose-600 dark:hover:text-white rounded-lg transition-colors" title="Delete Policy">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] font-bold text-teal-600 dark:text-teal-500 uppercase mb-2">
                          Published: {memo.createdAt ? new Date(memo.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                        </p>
                        <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{memo.content}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-600 italic mt-20">No active policies on the dashboard.</div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}