"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import toast from "react-hot-toast";

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  type: "pto" | "sick";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
}

export default function LeavePage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Request Form
  const [type, setType] = useState<"pto" | "sick">("pto");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

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
      
      // Sort client-side to avoid Firebase composite index requirements
      fetched.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      
      setRequests(fetched);
    });

    return () => unsubscribe();
  }, [user?.uid, isAdmin]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error("Please fill all required fields.");
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast.error("End date must be after start date.");
      return;
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
        status: "pending",
        createdAt: serverTimestamp()
      });
      
      toast.success("Leave request submitted!");
      setStartDate("");
      setEndDate("");
      setReason("");
      setType("pto");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    try {
      await updateDoc(doc(db, "leaveRequests", id), { status: newStatus });
      toast.success(`Request ${newStatus}!`);
    } catch (error) {
      toast.error("Failed to update status.");
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
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <CalendarIcon className="w-10 h-10 text-teal-500" />
              Leave Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
              {isAdmin ? "Review and manage employee time-off requests." : "Request time off and monitor your leave history."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Col: Request Form / Pending Requests */}
            <div className="lg:col-span-1 space-y-8">
              
              {!isAdmin && (
                <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Request Time Off</h3>
                  <form onSubmit={handleSubmitRequest} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Type</label>
                      <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white">
                        <option value="pto">Paid Time Off (PTO)</option>
                        <option value="sick">Sick Leave</option>
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Date</label>
                        <input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 sm:px-4 py-3 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Date</label>
                        <input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 sm:px-4 py-3 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason / Note</label>
                      <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Briefly explain your reason..." className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white resize-none"></textarea>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl py-3 font-semibold transition-all shadow-lg shadow-teal-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? "Submitting..." : <><Send className="w-4 h-4" /> Submit Request</>}
                    </button>
                  </form>
                </div>
              )}

              {isAdmin && (
                 <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                      Action Required
                      <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-sm px-3 py-1 rounded-full">{pendingRequests.length} pending</span>
                    </h3>
                    
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {pendingRequests.length > 0 ? (
                        pendingRequests.map(req => (
                          <div key={req.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{req.userName}</div>
                                <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">{req.type === 'pto' ? 'Paid Time Off' : 'Sick Leave'}</div>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{req.reason}"</p>
                            <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-white/10">
                              <button onClick={() => handleUpdateStatus(req.id, "approved")} className="flex-1 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 dark:text-emerald-400 rounded-lg text-sm font-semibold transition-colors active:scale-95">
                                Approve
                              </button>
                              <button onClick={() => handleUpdateStatus(req.id, "rejected")} className="flex-1 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-400 rounded-lg text-sm font-semibold transition-colors active:scale-95">
                                Reject
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                          No pending requests! You're all caught up.
                        </div>
                      )}
                    </div>
                 </div>
              )}
            </div>

            {/* Right Col: History Table */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl h-full">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {isAdmin ? "Recent Leave History" : "My Leave History"}
                </h3>
                
                <div className="w-full">
                  <table className="w-full text-left border-collapse block xl:table">
                    <thead className="hidden xl:table-header-group">
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        {isAdmin && <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee</th>}
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Dates</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="block xl:table-row-group divide-y xl:divide-y dark:divide-white/5 divide-transparent xl:divide-gray-100">
                      {(isAdmin ? pastRequests : requests).length > 0 ? (
                        (isAdmin ? pastRequests : requests).map(req => (
                          <tr key={req.id} className="block xl:table-row group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors mb-4 xl:mb-0 bg-slate-50 dark:bg-white/5 xl:bg-transparent rounded-2xl xl:rounded-none p-4 xl:p-0 border border-gray-100 dark:border-white/5 xl:border-none shadow-sm xl:shadow-none">
                            {isAdmin && (
                              <td className="flex justify-between items-center xl:table-cell py-2 xl:py-4 xl:pr-4 border-b border-gray-100 dark:border-white/5 xl:border-none">
                                <span className="xl:hidden text-xs text-gray-500 uppercase font-semibold">Employee</span>
                                <div className="font-medium text-gray-900 dark:text-white">{req.userName}</div>
                              </td>
                            )}
                            <td className="flex justify-between items-center xl:table-cell py-2 xl:py-4 xl:pr-4 border-b border-gray-100 dark:border-white/5 xl:border-none">
                               <span className="xl:hidden text-xs text-gray-500 uppercase font-semibold">Type</span>
                              <span className="font-semibold text-teal-600 dark:text-teal-400 uppercase text-xs tracking-wider">
                                {req.type}
                              </span>
                            </td>
                            <td className="flex justify-between items-center xl:table-cell py-2 xl:py-4 xl:pr-4 border-b border-gray-100 dark:border-white/5 xl:border-none">
                              <span className="xl:hidden text-xs text-gray-500 uppercase font-semibold">Dates</span>
                              <div className="text-sm text-gray-900 dark:text-white text-right xl:text-left">
                                {new Date(req.startDate).toLocaleDateString()} - <br className="hidden xl:block"/>{new Date(req.endDate).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="flex flex-col xl:table-cell py-2 xl:py-4 xl:pr-4 border-b border-gray-100 dark:border-white/5 xl:border-none">
                              <span className="xl:hidden text-xs text-gray-500 uppercase font-semibold mb-1">Reason</span>
                              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 xl:line-clamp-2 xl:max-w-[200px]" title={req.reason}>
                                {req.reason}
                              </p>
                            </td>
                            <td className="flex justify-between items-center xl:table-cell py-3 xl:py-4">
                              <span className="xl:hidden text-xs text-gray-500 uppercase font-semibold">Status</span>
                              {getStatusBadge(req.status)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="block xl:table-row">
                          <td colSpan={5} className="block xl:table-cell py-8 text-center text-gray-500 dark:text-gray-400 italic">
                            No leave history found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
