"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, ExternalLink, Info, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

interface LeaveRequest { id: string;
  userId: string;
  userName: string;
  type: "vl" | "sl" | "sil" | "lwop";
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminRemarks?: string; 
  statusDate?: string; // Tracks the formal final resolution date marker
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export default function LeavePage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balances, setBalances] = useState({ vl: 0, sl: 0, sil: 0 });
  const [type, setType] = useState<"vl" | "sl" | "sil" | "lwop">("vl");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState(""); 
  const [requestToDecline, setRequestToDecline] = useState<LeaveRequest | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [inspectedRequest, setInspectedRequest] = useState<LeaveRequest | null>(null);
  const todayString = new Date().toISOString().split("T")[0];

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

  const getTrueBalance = (leaveType: "vl" | "sl" | "sil") => {
    const rawBalance = balances[leaveType];
    const pendingReqs = requests.filter(r => r.userId === user?.uid && r.type === leaveType && r.status === "pending");
    
    const lockedDays = pendingReqs.reduce((total, req) => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const days = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);

    return {
      raw: rawBalance,
      locked: lockedDays,
      available: rawBalance - lockedDays
    };
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return toast.error("Fill all fields.");
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return toast.error("Check your dates.");

    const hasOverlapCollision = requests.some(req => {
      if (req.userId !== user?.uid || req.status === "rejected") return false;
      
      const existingStart = new Date(req.startDate);
      const existingEnd = new Date(req.endDate);
      
      return start <= existingEnd && end >= existingStart;
    });

    if (hasOverlapCollision) {
      return toast.error("Schedule conflict! You have already submitted or have an approved leave request covering these exact dates.");
    }

    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    if (type !== "lwop") {
      const { available, locked } = getTrueBalance(type);

      if (available < diffDays) {
        if (locked > 0) {
          return toast.error(`Insufficient true balance. You have ${locked} day(s) currently locked in pending requests.`);
        }
        return toast.error(`Insufficient balance. You only have ${available} days available.`);
      }
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

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected", request: LeaveRequest, remarks?: string) => {
    try {
      if (newStatus === "approved") {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const userRef = doc(db, "users", request.userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists() && request.type !== "lwop") {
          const userData = userSnap.data();
          const creditKey = `${request.type}Credits`; 
          const currentCredits = userData[creditKey] || 0;

          if (currentCredits < diffDays) {
            return toast.error("Insufficient user balance to approve.");
          }

          await updateDoc(userRef, { [creditKey]: currentCredits - diffDays });
        }
      }

      // Generate localized date timestamp string for administrative logging 
      const localizedActionDate = new Date().toLocaleDateString(undefined, { 
        month: 'short', day: 'numeric', year: 'numeric' 
      });

      const updatePayload: Partial<LeaveRequest> = { 
        status: newStatus,
        statusDate: localizedActionDate,
        adminRemarks: remarks || (newStatus === "approved" ? "Approved by HR Admin" : "Declined by HR Admin")
      };

      await updateDoc(doc(db, "leaveRequests", id), updatePayload);
      toast.success(`Request ${newStatus}!`);
    } catch (error: unknown) {
      console.error("Status update error:", error);
      toast.error("Failed to process status update.");
    }
  };

  const submitDecline = async () => {
    if (!requestToDecline) return;
    if (!declineReason.trim()) return toast.error("Please provide a reason for declining.");
    
    await handleUpdateStatus(requestToDecline.id, "rejected", requestToDecline, declineReason);
    
    setRequestToDecline(null);
    setDeclineReason("");
  };

  const pendingRequests = requests.filter(r => r.status === "pending");
  const pastRequests = requests.filter(r => r.status !== "pending");

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 rounded-lg text-xs font-semibold w-fit"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case "approved": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg text-xs font-semibold w-fit"><CheckCircle className="w-3.5 h-3.5" /> Approved</span>;
      case "rejected": return <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 rounded-lg text-xs font-semibold w-fit"><XCircle className="w-3.5 h-3.5" /> Declined</span>;
      default: return null;
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarIcon className="w-10 h-10 text-teal-500" />
              Leave Management
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              
              {!isAdmin && (
                <div className="flex flex-col gap-6">
                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center flex justify-center items-center gap-1.5">
                      Available Paid Leave
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {(["vl", "sl", "sil"] as const).map((lType) => {
                        const { available, locked } = getTrueBalance(lType);
                        return (
                          <div key={lType} className="p-3 text-center bg-slate-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 relative">
                            {locked > 0 && (
                              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm" title={`${locked} days pending approval`}>
                                -{locked}
                              </div>
                            )}
                            <div className={`text-2xl font-bold ${available > 0 ? "text-teal-600 dark:text-teal-400" : "text-gray-400"}`}>
                              {available}
                            </div>
                            <div className="text-[9px] font-bold text-gray-500 uppercase">{lType}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <select value={type} onChange={(e) => setType(e.target.value as "vl" | "sl" | "sil" | "lwop")} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500">
                          <option value="vl">Vacation Leave (VL)</option>
                          <option value="sl">Sick Leave (SL)</option>
                          <option value="sil">Incentive Leave (SIL)</option>
                          <option value="lwop">Leave Without Pay (LWOP)</option>
                        </select>
                        
                        {/* min input threshold constraints restricting choices from passing dates back into the timeline */}
                        <div className="grid grid-cols-2 gap-3">
                          <input type="date" required min={todayString} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <input type="date" required min={startDate || todayString} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                        <textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for leave..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
                        
                        <input 
                          type="url" 
                          value={attachmentUrl} 
                          onChange={(e) => setAttachmentUrl(e.target.value)} 
                          placeholder="Doc Link (G-Drive, Dropbox) - Optional" 
                          className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500" 
                        />

                        <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-500 py-3 rounded-xl font-bold text-white transition-all shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2">
                          {isSubmitting ? "Submitting..." : "Submit Request"}
                        </button>
                    </form>
                  </div>
                </div>
              )}

              {isAdmin && (
                 <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Pending Approval</h3>
                    <div className="space-y-4">
                      {pendingRequests.map(req => (
                        <div key={req.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                          <div className="pl-2">
                            <div className="font-bold text-gray-900 dark:text-white">{req.userName}</div>
                            <div className={`text-[10px] font-bold uppercase ${req.type === 'lwop' ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`}>
                              {req.type} • {req.startDate} to {req.endDate}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">&quot;{req.reason}&quot;</p>
                            
                            {req.attachmentUrl && (
                              <a href={req.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg w-fit mt-2 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" /> View Document
                              </a>
                            )}
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button onClick={() => handleUpdateStatus(req.id, "approved", req)} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold active:scale-95 transition-all">Approve</button>
                            <button onClick={() => setRequestToDecline(req)} className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold active:scale-95 transition-all">Decline</button>
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

            {/*  History Table */}
            <div className="lg:col-span-2">
               <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                      <th className="pb-4 pl-2">Employee</th>
                      <th className="pb-4">Type</th>
                      <th className="pb-4 hidden sm:table-cell">Dates</th>
                      <th className="pb-4">Status & Action Date</th>
                      <th className="pb-4 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {(isAdmin ? pastRequests : requests).map(req => (
                      <tr key={req.id} className="text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 pl-2 text-gray-900 dark:text-white font-medium align-middle">
                          {req.userName}
                        </td>
                        <td className={`py-4 font-bold uppercase text-xs align-middle ${req.type === 'lwop' ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'}`}>
                          {req.type}
                        </td>
                        <td className="py-4 hidden sm:table-cell text-xs text-gray-500 align-middle whitespace-nowrap">{req.startDate} to {req.endDate}</td>
                        <td className="py-4 align-middle">
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(req.status)}
                            {req.statusDate && (
                              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                                Processed: {req.statusDate}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => setInspectedRequest(req)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-gray-500 dark:text-gray-300 transition-colors inline-flex items-center"
                            title="Inspect Remarks & Input Reasons"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(isAdmin ? pastRequests : requests).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-500 italic">No leave history available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
               </div>
            </div>

          </div>
        </div>

        {/*  NEW: Continuous Interactive Inspection Popover Modal Viewport */}
        {inspectedRequest && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#151515] w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-teal-500" /> Leave Record Details
                </h3>
                <button 
                  onClick={() => setInspectedRequest(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4 text-sm">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Employee Input Reason</label>
                  <div className="p-3.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 text-gray-700 dark:text-gray-300 italic">
                    &quot;{inspectedRequest.reason}&quot;
                  </div>
                </div>

                {inspectedRequest.status !== "pending" && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      HR Management Remarks ({inspectedRequest.status === "approved" ? "Approval" : "Decline"} Reason)
                    </label>
                    <div className={`p-3.5 rounded-xl border font-medium ${
                      inspectedRequest.status === "approved" 
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20 text-rose-800 dark:text-rose-400"
                    }`}>
                      &quot;{inspectedRequest.adminRemarks || "No remarks provided."}&quot;
                    </div>
                  </div>
                )}
                
                {inspectedRequest.attachmentUrl && (
                  <a 
                    href={inspectedRequest.attachmentUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 py-3 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" /> View Associated Verification Doc
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Admin Decline Reason Modal */}
        {requestToDecline && (
          <div className="fixed inset-0 z-[100] flex flex-col justify-end sm:justify-center items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all">
            <div className="bg-white dark:bg-[#151515] w-full max-w-lg flex flex-col max-h-[90dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 bg-rose-50 dark:bg-rose-500/5">
                <div className="flex items-center gap-2">
                  <XCircle className="w-6 h-6 text-rose-500" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Decline Leave Request</h3>
                </div>
                <button onClick={() => { setRequestToDecline(null); setDeclineReason(""); }} className="text-gray-400 hover:text-rose-500 transition-colors p-1">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  You are declining the <strong className="uppercase">{requestToDecline.type}</strong> request from <strong>{requestToDecline.userName}</strong>.
                </p>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase">Reason for Denial <span className="text-rose-500">*</span></label>
                  <textarea 
                    value={declineReason} 
                    onChange={e => setDeclineReason(e.target.value)} 
                    placeholder="e.g., Insufficient staffing for this date, missing medical certificate..." 
                    className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white resize-none h-32 focus:ring-2 focus:ring-rose-500 outline-none custom-scrollbar"
                  ></textarea>
                </div>
                
                <button 
                  onClick={submitDecline} 
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2"
                >
                  Confirm & Decline Request
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </ProtectedRoute>
  );
}