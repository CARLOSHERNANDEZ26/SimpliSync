"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, ExternalLink, Info, MessageSquare, X, Printer, ArrowLeft, Edit2 } from "lucide-react";
import toast from "react-hot-toast";

interface LeaveRequest { 
  id: string;
  userId: string;
  userName: string;
  type: "vl" | "sl" | "sil" | "lwop";
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  status: "pending" | "approved" | "rejected";
  adminRemarks?: string; 
  statusDate?: string; 
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

  // 🔥 NEW: Editable Signatory States
  const [authorizedBy, setAuthorizedBy] = useState("Human Resources Dept.");
  const [isEditingAuth, setIsEditingAuth] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const baseQuery = isAdmin
      ? query(collection(db, "leaveRequests"))
      : query(collection(db, "leaveRequests"), where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const fetched = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
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

    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // DOLE 5-Day Continuous Maximum Ceiling Validation Block for Vacation Leaves
    if (type === "vl" && diffDays > 5) {
      return toast.error("Under DOLE standard company provisions, continuous Vacation Leave cannot exceed 5 continuous days.");
    }

    const hasOverlapCollision = requests.some(req => {
      if (req.userId !== user?.uid || req.status === "rejected") return false;
      
      const existingStart = new Date(req.startDate);
      const existingEnd = new Date(req.endDate);
      
      return start <= existingEnd && end >= existingStart;
    });

    if (hasOverlapCollision) {
      return toast.error("Schedule conflict! You have already submitted or have an approved leave request covering these exact dates.");
    }
    
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

  const getFullLeaveTypeName = (typeCode: string) => {
    switch(typeCode) {
      case 'vl': return "Vacation Leave (VL)";
      case 'sl': return "Sick Leave (SL)";
      case 'sil': return "Service Incentive Leave (SIL)";
      case 'lwop': return "Leave Without Pay (LWOP)";
      default: return "Official Leave";
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] print:bg-white print:pt-0">
        <div className="print:hidden"><Navbar /></div>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 print:p-0">
          
          <div className="mb-10 print:hidden">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarIcon className="w-10 h-10 text-teal-500" />
              Leave Management
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
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
                        <select value={type} onChange={(e) => setType(e.target.value as "vl" | "sl" | "sil" | "lwop")} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer">
                          <option value="vl">Vacation Leave (VL)</option>
                          <option value="sl">Sick Leave (SL)</option>
                          <option value="sil">Incentive Leave (SIL)</option>
                          <option value="lwop">Leave Without Pay (LWOP)</option>
                        </select>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <input type="date" required min={todayString} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer" />
                          <input type="date" required min={startDate || todayString} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer" />
                        </div>
                        <textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Detailed reason for leave..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
                        
                        <input 
                          type="url" 
                          value={attachmentUrl} 
                          onChange={(e) => setAttachmentUrl(e.target.value)} 
                          placeholder="Supporting Doc Link (G-Drive) - Optional" 
                          className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500" 
                        />

                        <button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-500 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-teal-500/20 active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2">
                          {isSubmitting ? "Submitting..." : "Submit Formal Request"}
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

            <div className="lg:col-span-2">
               <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-200 dark:border-white/5">
                      <th className="pb-4 pl-2">Employee</th>
                      <th className="pb-4">Type</th>
                      <th className="pb-4 hidden sm:table-cell">Dates</th>
                      <th className="pb-4">Status & Action Date</th>
                      <th className="pb-4 text-center">Form</th>
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
                          </div>
                        </td>
                        <td className="py-4 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => setInspectedRequest(req)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl text-gray-500 dark:text-gray-300 transition-colors inline-flex items-center"
                            title="Inspect & Print Official Form"
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

        {/* Printable Official DOLE-Compliant Leave Form Modal */}
        {inspectedRequest && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:overflow-visible">
            <div className="bg-white text-gray-900 rounded-3xl w-full max-w-2xl mt-10 p-8 shadow-2xl print:m-0 print:shadow-none print:max-w-none relative animate-zoom-in">
              
              <div className="flex justify-between items-center border-b pb-4 mb-6 print:hidden">
                <button onClick={() => setInspectedRequest(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Close
                </button>
                <button onClick={() => window.print()} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all">
                  <Printer className="w-4 h-4" /> Save as PDF
                </button>
              </div>

              <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
                <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900 print:text-black">SimplifV Business Consulting Corp.</h1>
                <p className="text-xs text-gray-600 font-medium mt-1">Subic City, Zambales • &quot;Let&apos;s SimplifV your Business&quot;</p>
                <h2 className="text-lg font-bold mt-5 uppercase tracking-widest bg-slate-100 print:bg-transparent py-1 rounded border print:border-none border-gray-200">Official Leave of Absence Form</h2>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm mb-6 border-b border-gray-200 pb-6">
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px] mb-1">Employee Name</span>
                  <span className="font-bold text-base border-b border-gray-300 w-full block pb-1">{inspectedRequest.userName}</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px] mb-1">Date Filed</span>
                  <span className="font-bold text-base border-b border-gray-300 w-full block pb-1">
                    {inspectedRequest.createdAt ? new Date(inspectedRequest.createdAt.seconds * 1000).toLocaleDateString() : "System Pending"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px] mb-1">Type of Leave Requested</span>
                  <span className="font-bold text-sm bg-gray-100 print:bg-transparent px-3 py-1 rounded block w-fit border border-gray-200 print:border-none">
                    {getFullLeaveTypeName(inspectedRequest.type)}
                  </span>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 bg-slate-50 print:bg-transparent p-3 rounded-lg border border-gray-200 print:border-none">
                  <div>
                    <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px]">Inclusive Dates</span>
                    <span className="font-bold text-sm">{inspectedRequest.startDate} <span className="text-gray-400 mx-2">to</span> {inspectedRequest.endDate}</span>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px]">Total Calendar Days</span>
                    <span className="font-bold text-sm">
                      {Math.ceil(Math.abs(new Date(inspectedRequest.endDate).getTime() - new Date(inspectedRequest.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Day(s)
                    </span>
                  </div>
                </div>

                <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px] mb-2">Detailed Reason for Absence</span>
                <div className="p-4 bg-white border border-gray-300 rounded-xl min-h-[100px] text-sm text-gray-800 leading-relaxed italic">
                  &quot;{inspectedRequest.reason}&quot;
                </div>
                {inspectedRequest.attachmentUrl && (
                  <div className="mt-2 print:hidden">
                    <a href={inspectedRequest.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> External Medical/Support Document Attached
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-900 pt-4 mt-6">
                <span className="text-gray-900 font-black uppercase tracking-widest block text-xs mb-4">Human Resources Disposition</span>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className={`px-4 py-1.5 border-2 font-bold uppercase tracking-widest text-xs rounded-sm transform -rotate-2 ${
                    inspectedRequest.status === "approved" ? "border-emerald-600 text-emerald-600" :
                    inspectedRequest.status === "rejected" ? "border-rose-600 text-rose-600" :
                    "border-amber-500 text-amber-500"
                  }`}>
                    {inspectedRequest.status}
                  </div>
                  {inspectedRequest.statusDate && (
                    <span className="text-xs text-gray-500 font-medium">Processed on: {inspectedRequest.statusDate}</span>
                  )}
                </div>

                {inspectedRequest.status !== "pending" && (
                  <div>
                    <span className="text-gray-500 font-bold uppercase tracking-wider block text-[10px] mb-1">HR Admin Remarks</span>
                    <div className="p-3 bg-gray-50 print:bg-transparent border border-gray-200 rounded text-sm text-gray-800">
                      {inspectedRequest.adminRemarks || "No additional remarks."}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end gap-8 pt-12 px-4 mt-8">
                <div className="text-center w-48 border-t border-gray-800 pt-1 font-semibold text-xs group relative">
                  <span className="text-gray-900">{inspectedRequest.userName}</span>
                  <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Employee Signature</div>
                </div>
                
                {/* 🔥 NEW: Editable Signatory for HR Admin */}
                <div className="text-center w-48 border-t border-gray-800 pt-1 font-semibold text-xs group relative">
                  {isEditingAuth ? (
                    <input 
                      type="text" 
                      value={authorizedBy} 
                      onChange={(e) => setAuthorizedBy(e.target.value)} 
                      onBlur={() => setIsEditingAuth(false)} 
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingAuth(false)} 
                      className="w-full text-center outline-none bg-slate-50 print:bg-transparent text-gray-900" 
                      autoFocus 
                    />
                  ) : (
                    <div className="flex justify-center items-center gap-1 text-gray-900">
                      <span>{authorizedBy}</span>
                      <button 
                        onClick={() => setIsEditingAuth(true)} 
                        className="opacity-0 group-hover:opacity-100 transition-opacity print:hidden text-gray-400 hover:text-indigo-600"
                        title="Edit Signatory"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-0.5">Authorized Signatory</div>
                </div>
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