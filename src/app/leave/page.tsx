"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: "vl" | "sl" | "sil";
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export default function LeavePage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balances, setBalances] = useState({ vl: 0, sl: 0, sil: 0 });
  const [type, setType] = useState<"vl" | "sl" | "sil">("vl");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState(""); 

  useEffect(() => {
    if (!user?.uid) return;

    const baseQuery = isAdmin
      ? query(collection(db, "leaveRequests"))
      : query(collection(db, "leaveRequests"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as LeaveRequest));

      fetched.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRequests(fetched);
    }, (error) => {
      if (error.code !== "permission-denied") console.error("Sync error:", error);
    });

    return () => unsubscribe();
  }, [user?.uid, isAdmin]);

  useEffect(() => {
    if (!user?.uid || isAdmin) return;
    
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBalances({
          vl: data.vlCredits || 0,
          sl: data.slCredits || 0,
          sil: data.silCredits || 0
        });
      }
    });

    return () => unsubscribeUser();
  }, [user?.uid, isAdmin]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return toast.error("Fill all fields.");
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return toast.error("Check your dates.");

    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const currentBalance = balances[type];

    if (currentBalance < diffDays) {
      return toast.error(`Insufficient balance. You only have ${currentBalance} days.`);
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "leaveRequests"), {
        userId: user!.uid,
        userName: user?.displayName || user?.email?.split('@')[0] || "Unknown Employee",
        type,
        startDate,
        endDate,
        reason,
        attachmentUrl, 
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      toast.success("Leave request submitted!");
      setStartDate(""); setEndDate(""); setReason(""); setAttachmentUrl(""); 
    } catch (error: unknown) {
      console.error("Submission error:", error);
      toast.error("Failed to submit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected", request: LeaveRequest) => {
    try {
      if (newStatus === "approved") {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const userRef = doc(db, "users", request.userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          const creditKey = `${request.type}Credits`; 
          const currentCredits = userData[creditKey] || 0;

          if (currentCredits < diffDays) {
            return toast.error("Insufficient user balance to approve.");
          }

          await updateDoc(userRef, { [creditKey]: currentCredits - diffDays });
        }
      }

      await updateDoc(doc(db, "leaveRequests", id), { status: newStatus });
      toast.success(`Request ${newStatus}!`);
    } catch (error: unknown) {
      console.error("Status update error:", error);
      toast.error("Failed to process status update.");
    }
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const pastRequests = requests.filter(r => r.status !== "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg text-xs font-semibold"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case "approved": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-xs font-semibold"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
      case "rejected": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-lg text-xs font-semibold"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default: return null;
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          {/* 1. Page Header Section */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarIcon className="w-10 h-10 text-teal-500" />
              Leave Management
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              
              {/* 2. Employee Personal Controls (Balances & Form) */}
              {!isAdmin && (
                <div className="flex flex-col gap-6">
                  {/* Leave Balances Visualization */}
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">My Balances</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 text-center bg-teal-50 dark:bg-teal-500/10 rounded-xl border border-teal-100 dark:border-teal-500/20">
                        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{balances.vl}</div>
                        <div className="text-[9px] font-bold text-teal-500 dark:text-teal-300 uppercase">VL</div>
                      </div>
                      <div className="p-3 text-center bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20">
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{balances.sl}</div>
                        <div className="text-[9px] font-bold text-rose-500 dark:text-rose-300 uppercase">SL</div>
                      </div>
                      <div className="p-3 text-center bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
                        <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{balances.sil}</div>
                        <div className="text-[9px] font-bold text-indigo-500 dark:text-indigo-300 uppercase">SIL</div>
                      </div>
                    </div>
                  </div>

                  {/* Leave Request Submission Form */}
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <select value={type} onChange={(e) => setType(e.target.value as "vl" | "sl" | "sil")} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                          <option value="vl">Vacation Leave (VL)</option>
                          <option value="sl">Sick Leave (SL)</option>
                          <option value="sil">Incentive Leave (SIL)</option>
                        </select>
                        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        <textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leave..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
                        
                        <input 
                          type="url" 
                          value={attachmentUrl} 
                          onChange={(e) => setAttachmentUrl(e.target.value)} 
                          placeholder="Doc Link (G-Drive, Dropbox) - Optional" 
                          className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500" 
                        />

                        <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-500 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-teal-500/20 active:scale-95">Submit Request</button>
                    </form>
                  </div>
                </div>
              )}

              {/* 3. Administrator Approval Queue Section */}
              {isAdmin && (
                 <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Pending Approval</h3>
                    <div className="space-y-4">
                      {pendingRequests.map(req => (
                        <div key={req.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 space-y-3">
                          <div className="font-bold text-gray-900 dark:text-white">{req.userName}</div>
                          <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase">{req.type}</div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">&quot;{req.reason}&quot;</p>
                          
                          {req.attachmentUrl && (
                            <a href={req.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg w-fit transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" /> View Attached Document
                            </a>
                          )}

                          <div className="flex gap-2 pt-2">
                            <button onClick={() => handleUpdateStatus(req.id, "approved", req)} className="flex-1 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold active:scale-95 transition-transform">Approve</button>
                            <button onClick={() => handleUpdateStatus(req.id, "rejected", req)} className="flex-1 py-2 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold active:scale-95 transition-transform">Reject</button>
                          </div>
                        </div>
                      ))}
                      {pendingRequests.length === 0 && (
                        <div className="text-center py-6 text-sm text-gray-500 italic">No pending requests found.</div>
                      )}
                    </div>
                 </div>
              )}
            </div>

            {/* 4. Leave History & Status Table Section */}
            <div className="lg:col-span-2">
               <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                      <th className="pb-4 pl-2">Employee</th>
                      <th className="pb-4">Type</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {(isAdmin ? pastRequests : requests).map(req => (
                      <tr key={req.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 pl-2 text-gray-900 dark:text-white font-medium">
                          {req.userName}
                          {req.attachmentUrl && (
                            <a href={req.attachmentUrl} target="_blank" rel="noopener noreferrer" title="View Document" className="ml-2 text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 inline-block align-middle">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </td>
                        <td className="py-4 text-teal-600 dark:text-teal-400 font-bold uppercase text-xs">{req.type}</td>
                        <td className="py-4">{getStatusBadge(req.status)}</td>
                      </tr>
                    ))}
                    {(isAdmin ? pastRequests : requests).length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-gray-500 italic">No leave history available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
               </div>
            </div>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}