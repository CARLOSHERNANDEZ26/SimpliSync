"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Bot, FileText, Send, Sparkles, Trash2, List, AlertTriangle, Search, Eye, X, Database, Tag, Edit, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, limit, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logAdminAction } from "@/lib/audit";

interface Announcement {
  id: string;
  title: string;
  category: string;
  content: string;
  author: string;
  createdAt: { seconds: number } | null;
}

const POLICY_CATEGORIES = [
  "Attendance & Timekeeping",
  "Leaves & Absences",
  "Payroll & Compensation",
  "Code of Conduct & Security"
] as const;

type PolicyCategory = typeof POLICY_CATEGORIES[number];

const ITEMS_PER_PAGE = 5;

export default function MemoGeneratorPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  
  const [isPublishing, setIsPublishing] = useState(false);
  const [prompt, setPrompt] = useState("");
  
  // Draft / Edit States
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState<PolicyCategory | "">("");
  const [generatedMemo, setGeneratedMemo] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"draft" | "live">("draft");
  const [publishedMemos, setPublishedMemos] = useState<Announcement[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  
  // Live Tab & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<PolicyCategory | "All">("All");
  const [selectedMemo, setSelectedMemo] = useState<Announcement | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch Policies
  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"), limit(100));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPublishedMemos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement)));
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilterCategory]);

  const executeDeletePolicy = async (id: string) => {
    try {
      await deleteDoc(doc(db, "announcements", id));
      toast.success("Policy permanently removed.");
      if (selectedMemo?.id === id) setSelectedMemo(null); 
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
    
    if (!editingMemoId) {
      setDraftTitle("AI Generated Policy Draft");
    }
    
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

  const handleEditClick = (memo: Announcement) => {
    setEditingMemoId(memo.id);
    setDraftTitle(memo.title);
    setDraftCategory(memo.category as PolicyCategory);
    setGeneratedMemo(memo.content);
    setActiveTab("draft");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingMemoId(null);
    setDraftTitle("");
    setDraftCategory("");
    setGeneratedMemo("");
    setActiveTab("live");
  };

  const handlePublish = async () => {
    if (!generatedMemo.trim() || !draftTitle.trim() || !draftCategory) {
      return toast.error("Title, Category, and Content are required to save.");
    }

    setIsPublishing(true);

    try {
      if (editingMemoId) {
        // Update existing policy
        await updateDoc(doc(db, "announcements", editingMemoId), {
          title: draftTitle,
          category: draftCategory,
          content: generatedMemo,
        });
        toast.success("Policy updated successfully!");
        if (user?.email) await logAdminAction(user.email, `Updated Policy: ${draftTitle}`, `Category: ${draftCategory}`);
      } else {
        // Create new policy
        await addDoc(collection(db, "announcements"), {
          title: draftTitle,
          category: draftCategory,
          content: generatedMemo,
          author: user?.displayName || "HR Administration",
          createdAt: serverTimestamp(),
        });
        toast.success("Policy published to the company dashboard!");
        if (user?.email) await logAdminAction(user.email, `Published Policy: ${draftTitle}`, `Category: ${draftCategory}`);
      }
      
      setEditingMemoId(null);
      setGeneratedMemo(""); 
      setDraftTitle("");
      setDraftCategory("");
      setActiveTab("live"); 

    } catch (error: unknown) {
      console.error("Publish Error:", error);
      toast.error("Failed to save policy.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      const collectionRef = collection(db, "announcements");

      const seedData = [
        {
          title: "Standard Shift and 15-Minute Lateness Ceiling",
          category: "Attendance & Timekeeping",
          content: "To ensure operational efficiency, the standard company shift is strictly 8:00 AM to 5:00 PM, Monday to Friday. Employees are expected to clock in before 8:00 AM. \n\nWe employ a 15-Minute Ceiling Penalty rule: Every 1-15 minute block of lateness will automatically result in a 30-minute pay deduction. For example, clocking in at 8:05 AM incurs a 30-minute penalty, and clocking in at 8:16 AM incurs a 60-minute penalty. Excused lateness requires HR approval prior to payroll generation."
        },
        {
          title: "Resolution of Dangling Shifts",
          category: "Attendance & Timekeeping",
          content: "A 'Dangling Shift' occurs when an employee successfully clocks in but fails to clock out by midnight. The system will automatically lock the employee out of future clock-ins until the anomaly is resolved.\n\nEmployees must submit an Exception Request detailing the exact time they logged off and the reason for missing the clock-out (e.g., power outage, emergency). HR will review and manually adjust the log. Failure to resolve a dangling shift before the payroll cutoff will result in the entire shift being marked as Unpaid."
        },
        {
          title: "Leave Allocation and Leave Without Pay (LWOP)",
          category: "Leaves & Absences",
          content: "Regular employees are entitled to standard DOLE leave credits: 15 Vacation Leaves (VL), 15 Sick Leaves (SL), and 5 Service Incentive Leaves (SIL) per year. \n\nIf an employee exhausts their paid leave balances, they may still request time off using the 'Leave Without Pay (LWOP)' category. LWOP requests are subject to approval. Approved LWOP will not result in AWOL disciplinary action, but the corresponding daily rate will be directly deducted from the active payroll cutoff."
        },
        {
          title: "Semi-Monthly Payroll and Government Deductions",
          category: "Payroll & Compensation",
          content: "SimpliSync processes payroll semi-monthly, cutting off on the 15th and the final day of the month. \n\nStatutory Government Deductions are split to ease the financial burden on employees. SSS and Pag-IBIG contributions are deducted during the 1st Cutoff (1st-15th). PhilHealth contributions are deducted during the 2nd Cutoff (16th-End). The SSS deduction is based on the DOLE-mandated Monthly Salary Credit (MSC) bracket corresponding to the employee's base contract, regardless of absences during the period."
        },
        {
          title: "Overtime (OTS) Policy and 25% Premium",
          category: "Payroll & Compensation",
          content: "Overtime is strictly monitored. For standard 8:00 AM to 5:00 PM shifts, a one-hour grace period is observed. Official Overtime calculations begin precisely at 6:00 PM (18:00).\n\nIn compliance with DOLE regulations, all authorized overtime hours worked on a regular workday are compensated with an additional 25% premium on top of the employee's standard hourly rate."
        },
        {
          title: "13th-Month Pay Computation Protocol",
          category: "Payroll & Compensation",
          content: "The 13th-month pay is a mandatory benefit distributed annually. In SimpliSync, this is calculated as exactly 1/12 of the total basic salary ACTUALLY EARNED during the calendar year.\n\nUnpaid absences, tardiness penalties, undertime, and Leave Without Pay (LWOP) reduce the total earned basic salary. Consequently, these deductions will proportionately reduce the final 13th-month pay amount. The system automatically scans the yearly ledger to prevent duplicate distributions."
        },
        {
          title: "Employee Offboarding and Data Retention",
          category: "Code of Conduct & Security",
          content: "Upon resignation, termination, or contract completion, employees must be officially offboarded via the HR Dashboard. \n\nOffboarding instantly revokes the employee's access to the system. However, in strict compliance with DOLE auditing standards, the employee's historical attendance, payroll logs, and signed documents will be securely retained in the system's ledger. This ensures accurate final pay computations and protects the company during compliance reviews."
        },
        {
          title: "System Audit Trail Protocol",
          category: "Code of Conduct & Security",
          content: "All administrative actions—including salary adjustments, policy deletions, leave approvals, and offboarding events—are permanently recorded in the immutable System Audit Trail. \n\nThis ensures complete accountability. The ledger records the Administrator's email, the exact timestamp, the action type, and the target entity. Unauthorized tampering with the system parameters will be instantly flagged by the security logs."
        }
      ];

      for (const data of seedData) {
        const docRef = doc(collectionRef);
        batch.set(docRef, { ...data, author: "System Architect", createdAt: serverTimestamp() });
      }

      await batch.commit();
      toast.success("Database seeded with 8 DOLE-compliant policies!");
      if (user?.email) logAdminAction(user.email, "Executed Database Seed", "Target: Announcements");
      setActiveTab("live");
    } catch (error) {
      console.error("Seed error:", error);
      toast.error("Failed to seed database.");
    } finally {
      setIsSeeding(false);
    }
  };

  // Filter Logic
  const filteredMemos = publishedMemos.filter(memo => {
    const matchesSearch = memo.title?.toLowerCase().includes(searchTerm.toLowerCase()) || memo.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedFilterCategory === "All" || memo.category === selectedFilterCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMemos.length / ITEMS_PER_PAGE);
  const currentMemos = filteredMemos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getCategoryBadgeColor = (category: string) => {
    switch(category) {
      case "Attendance & Timekeeping": return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30";
      case "Leaves & Absences": return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/30";
      case "Payroll & Compensation": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30";
      case "Code of Conduct & Security": return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/30";
      default: return "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400 border-gray-200 dark:border-white/20";
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
          
          <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Bot className="w-10 h-10 text-indigo-500" />
                Automated Policy Creator
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Manage and categorize DOLE-compliant company guidelines.</p>
            </div>

            {/*}
           <button 
              onClick={handleSeedDatabase} disabled={isSeeding}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 text-sm"
            >
              <Database className="w-4 h-4" />
              {isSeeding ? "Seeding..." : "Dev: Seed Policies"}
            </button>
            */}
          </div>
          

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl h-fit">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                AI Generation
              </h3>
              <form onSubmit={handleGenerate} className="space-y-4">
                <textarea 
                  required value={prompt} onChange={(e) => setPrompt(e.target.value)} 
                  placeholder="e.g., Draft a memo reminding employees about the 15-minute lateness penalty..." 
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white h-40 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
                <button type="submit" disabled={isGenerating} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2 text-sm">
                  {isGenerating ? "Generating Draft..." : <><Send className="w-4 h-4" /> Generate with AI</>}
                </button>
              </form>
            </div>

            <div className="lg:col-span-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col min-h-[600px] relative">
              
              <div className="flex flex-wrap items-center gap-4 mb-6 border-b border-gray-200 dark:border-white/10 pb-2">
                <button 
                  onClick={() => setActiveTab("draft")}
                  className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold transition-colors ${activeTab === "draft" ? "text-indigo-500 border-b-2 border-indigo-500" : "text-gray-500 hover:text-gray-300"}`}
                >
                  <FileText className="w-4 h-4" /> {editingMemoId ? "Editing Policy" : "Current Draft"}
                </button>
                <button 
                  onClick={() => setActiveTab("live")}
                  className={`flex items-center gap-2 pb-2 px-2 text-sm font-bold transition-colors ${activeTab === "live" ? "text-teal-500 border-b-2 border-teal-500" : "text-gray-500 hover:text-gray-300"}`}
                >
                  <List className="w-4 h-4" /> Live Dashboard Policies ({filteredMemos.length})
                </button>
              </div>

              {activeTab === "draft" && (
                <div className="flex flex-col h-full gap-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} 
                      placeholder="Policy Title..." 
                      className="flex-1 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select 
                      value={draftCategory} onChange={(e) => setDraftCategory(e.target.value as PolicyCategory)}
                      className="flex-1 bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="" disabled>Select Category...</option>
                      {POLICY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  
                  <textarea
                    value={generatedMemo} onChange={(e) => setGeneratedMemo(e.target.value)}
                    placeholder="Type your official announcement here, or use the AI Generator to instantly draft a DOLE-compliant memo..."
                    className="flex-1 min-h-[350px] w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-sm text-gray-700 dark:text-gray-300 resize-none outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar leading-relaxed"
                  />
                  
                  <div className="flex justify-between items-center mt-2">
                    <div>
                      {editingMemoId && (
                        <button onClick={handleCancelEdit} className="text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                          Cancel Edit
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {generatedMemo && (
                        <button onClick={handleCopy} className="px-5 py-2.5 text-sm font-bold bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-colors">
                          {isCopied ? "Copied!" : "Copy Text"}
                        </button>
                      )}
                      <button onClick={handlePublish} disabled={isPublishing || !generatedMemo.trim() || !draftTitle.trim() || !draftCategory} className="px-6 py-2.5 text-sm font-bold bg-indigo-600 rounded-xl hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors shadow-md">
                        {isPublishing ? "Saving..." : editingMemoId ? "Update Policy" : "Publish to Dashboard"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "live" && (
                <div className="flex flex-col h-full">
                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" placeholder="Search live policies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <select 
                      value={selectedFilterCategory} onChange={(e) => setSelectedFilterCategory(e.target.value as PolicyCategory | "All")}
                      className="sm:w-64 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                    >
                      <option value="All">All Categories</option>
                      {POLICY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar min-h-[350px]">
                    {currentMemos.length > 0 ? (
                      currentMemos.map(memo => (
                        <div key={memo.id} className="p-5 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 relative group flex flex-col gap-3 transition-colors hover:border-teal-500/30">
                          
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-base">{memo.title || "Untitled Policy"}</h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeColor(memo.category)}`}>
                                  <Tag className="w-3 h-3" /> {memo.category || "Uncategorized"}
                                </span>
                                <span className="text-[10px] text-gray-500 font-semibold uppercase">
                                  {memo.createdAt ? new Date(memo.createdAt.seconds * 1000).toLocaleDateString() : "Just now"}
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setSelectedMemo(memo)} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors shadow-sm" title="Read Full Memo">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditClick(memo)} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors shadow-sm" title="Edit Policy">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeletePolicy(memo.id)} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors shadow-sm" title="Delete Policy">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {memo.content}
                          </div>
                          
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-500 dark:text-gray-400 italic mt-16 flex flex-col items-center justify-center">
                        <Database className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-sm">{searchTerm || selectedFilterCategory !== "All" ? "No policies match your filters." : "No active policies found."}</span>
                      </div>
                    )}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                      <span className="text-xs text-gray-500 font-medium">
                        Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredMemos.length)} of {filteredMemos.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-xs font-bold text-gray-700 dark:text-white px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>

        {selectedMemo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#151515] w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-gray-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] rounded-t-3xl">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-4">{selectedMemo.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getCategoryBadgeColor(selectedMemo.category)}`}>
                      {selectedMemo.category || "Uncategorized"}
                    </span>
                    <p className="text-xs text-gray-500 font-semibold">
                      Published {selectedMemo.createdAt ? new Date(selectedMemo.createdAt.seconds * 1000).toLocaleDateString() : "Just now"} by {selectedMemo.author}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedMemo(null)} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors shrink-0 shadow-sm">
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </button>
              </div>
              <div className="p-8 overflow-y-auto custom-scrollbar whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-loose">
                {selectedMemo.content}
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}