"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, ExternalLink, Info, MessageSquare, X, Printer, ArrowLeft, Edit2, Eye, Download, Paperclip, Upload, FileText, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

interface LeaveRequest { 
  id: string;
  userId: string;
  userName: string;
  type: "vl" | "sl" | "sil" | "lwop";
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
  attachmentName?: string;
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
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentMode, setAttachmentMode] = useState<"file" | "link">("file");
  const [isUploading, setIsUploading] = useState(false);
  const [requestToDecline, setRequestToDecline] = useState<LeaveRequest | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [inspectedRequest, setInspectedRequest] = useState<LeaveRequest | null>(null);
  const todayString = new Date().toISOString().split("T")[0];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 850 * 1024) {
      toast.error("File size is too large (max 800KB). Please upload a smaller file or paste a G-Drive link.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAttachmentUrl(result);
      setAttachmentName(file.name);
      setIsUploading(false);
      toast.success(`Attached file: ${file.name}`);
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast.error("Failed to read file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setAttachmentUrl("");
    setAttachmentName("");
  };

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
        if (locked > 0) return toast.error(`Insufficient true balance. You have ${locked} day(s) currently locked in pending requests.`);
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
        attachmentUrl: attachmentUrl || null, 
        attachmentName: attachmentName || null,
        status: "pending",
        createdAt: serverTimestamp()
      });
      toast.success("Leave request submitted!");
      setStartDate(""); setEndDate(""); setReason(""); setAttachmentUrl(""); setAttachmentName(""); 
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

          if (currentCredits < diffDays) return toast.error("Insufficient user balance to approve.");

          await updateDoc(userRef, { [creditKey]: currentCredits - diffDays });
        }
      }

      const localizedActionDate = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

      await updateDoc(doc(db, "leaveRequests", id), { 
        status: newStatus,
        statusDate: localizedActionDate,
        adminRemarks: remarks || (newStatus === "approved" ? "Approved by HR Admin" : "Declined by HR Admin")
      });
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

  const handleDownloadPDF = () => {
    if (!inspectedRequest) return;
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const titleText = inspectedRequest.status === "pending" 
        ? "LEAVE APPLICATION (PENDING SLIP)" 
        : "OFFICIAL LEAVE OF ABSENCE FORM";
      const dateFiled = inspectedRequest.createdAt 
        ? new Date(inspectedRequest.createdAt.seconds * 1000).toLocaleDateString() 
        : "System Pending";
      
      const start = new Date(inspectedRequest.startDate);
      const end = new Date(inspectedRequest.endDate);
      const totalDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(15, 23, 42);
      doc.text("SIMPLIFV BUSINESS CONSULTING CORP.", 105, 20, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text("Subic City, Zambales - \"Let's SimplifV your Business\"", 105, 26, { align: "center" });

      // Divider line
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.8);
      doc.line(15, 32, 195, 32);

      // Form Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(titleText, 105, 41, { align: "center" });

      // Field Sections
      let y = 54;
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("EMPLOYEE NAME", 15, y);
      doc.text("DATE FILED", 115, y);

      y += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(inspectedRequest.userName, 15, y);
      doc.text(dateFiled, 115, y);

      y += 2;
      doc.setLineWidth(0.2);
      doc.setDrawColor(200);
      doc.line(15, y, 95, y);
      doc.line(115, y, 195, y);

      y += 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text("TYPE OF LEAVE REQUESTED", 15, y);

      y += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(getFullLeaveTypeName(inspectedRequest.type), 15, y);

      y += 2;
      doc.line(15, y, 195, y);

      y += 10;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text("INCLUSIVE DATES", 15, y);
      doc.text("TOTAL CALENDAR DAYS", 115, y);

      y += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${inspectedRequest.startDate} to ${inspectedRequest.endDate}`, 15, y);
      doc.text(`${totalDays} Day(s)`, 115, y);

      y += 2;
      doc.line(15, y, 95, y);
      doc.line(115, y, 195, y);

      y += 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100);
      doc.text("DETAILED REASON FOR ABSENCE", 15, y);

      y += 4;
      doc.setDrawColor(220);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(15, y, 180, 25, 2, 2, "FD");

      doc.setFont("helvetica", "italic");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      const splitReason = doc.splitTextToSize(`"${inspectedRequest.reason}"`, 172);
      doc.text(splitReason, 19, y + 7);

      y += 33;
      // HR Disposition section line
      doc.setLineWidth(0.6);
      doc.setDrawColor(30, 41, 59);
      doc.line(15, y, 195, y);

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("HUMAN RESOURCES DISPOSITION", 15, y);

      y += 8;
      // Status Badge box
      const statusStr = inspectedRequest.status === "pending" ? "[ FOR HR REVIEW ]" : inspectedRequest.status.toUpperCase();
      doc.setFontSize(9);
      if (inspectedRequest.status === "approved") {
        doc.setDrawColor(16, 185, 129);
        doc.setFillColor(236, 253, 245);
        doc.setTextColor(5, 150, 105);
      } else if (inspectedRequest.status === "rejected") {
        doc.setDrawColor(244, 63, 94);
        doc.setFillColor(254, 242, 242);
        doc.setTextColor(225, 29, 72);
      } else {
        doc.setDrawColor(156, 163, 175);
        doc.setFillColor(249, 250, 251);
        doc.setTextColor(107, 114, 128);
      }
      doc.roundedRect(15, y - 4, 45, 8, 1, 1, "FD");
      doc.text(statusStr, 37.5, y + 1.5, { align: "center" });

      if (inspectedRequest.statusDate) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(100);
        doc.text(`Processed on: ${inspectedRequest.statusDate}`, 66, y + 1.5);
      }

      if (inspectedRequest.status !== "pending") {
        y += 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("HR ADMIN REMARKS", 15, y);

        y += 4;
        doc.setDrawColor(220);
        doc.setFillColor(250, 250, 250);
        doc.roundedRect(15, y, 180, 18, 2, 2, "FD");

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        const splitRemarks = doc.splitTextToSize(inspectedRequest.adminRemarks || "No additional remarks.", 172);
        doc.text(splitRemarks, 19, y + 6);
        y += 22;
      } else {
        y += 15;
      }

      // Signatures
      y += 22;
      doc.setLineWidth(0.4);
      doc.setDrawColor(50);
      doc.line(20, y, 80, y);
      doc.line(130, y, 190, y);

      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(inspectedRequest.userName, 50, y, { align: "center" });
      doc.text(authorizedBy, 160, y, { align: "center" });

      y += 4;
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text("EMPLOYEE SIGNATURE", 50, y, { align: "center" });
      doc.text("AUTHORIZED SIGNATURE", 160, y, { align: "center" });

      const safeName = inspectedRequest.userName.replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`Leave_Form_${safeName}_${inspectedRequest.startDate}.pdf`);
      toast.success("Leave form PDF downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF download.");
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[57px] lg:pt-0 lg:pl-[260px] bg-slate-50 dark:bg-[#0a0a0a] print:bg-white print:p-0">
        <div className="print:hidden"><Navbar /></div>
        
        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-10 py-6 sm:py-10 print:p-0">
          
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
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                            <span>Supporting Document <span className="font-normal text-gray-400 lowercase">(optional)</span></span>
                            <div className="flex gap-1 bg-slate-100 dark:bg-black/40 p-0.5 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setAttachmentMode("file")}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                                  attachmentMode === "file" 
                                    ? "bg-teal-600 text-white shadow-sm" 
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                }`}
                              >
                                Upload File
                              </button>
                              <button
                                type="button"
                                onClick={() => setAttachmentMode("link")}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                                  attachmentMode === "link" 
                                    ? "bg-teal-600 text-white shadow-sm" 
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                }`}
                              >
                                Paste Link
                              </button>
                            </div>
                          </div>

                          {attachmentMode === "file" ? (
                            <div>
                              {attachmentUrl ? (
                                <div className="flex items-center justify-between p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs">
                                  <div className="flex items-center gap-2 truncate pr-2">
                                    <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                                      {attachmentName || "Attached File"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-1 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 rounded-lg transition-colors shrink-0"
                                    title="Remove File"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <label className="flex flex-col items-center justify-center p-3.5 bg-slate-50 dark:bg-black/20 border-2 border-dashed border-gray-300 dark:border-white/10 hover:border-teal-500 dark:hover:border-teal-400 rounded-xl cursor-pointer transition-colors text-center">
                                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {isUploading ? "Processing file..." : "Choose Medical Cert / Supporting File"}
                                  </span>
                                  <span className="text-[10px] text-gray-400 mt-0.5">Images, PDFs or docs (up to 800KB)</span>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf,.doc,.docx,.txt"
                                    onChange={handleFileChange}
                                    className="hidden"
                                  />
                                </label>
                              )}
                            </div>
                          ) : (
                            <input 
                              type="url" 
                              value={attachmentUrl} 
                              onChange={(e) => {
                                setAttachmentUrl(e.target.value);
                                setAttachmentName(e.target.value ? "External Link Document" : "");
                              }} 
                              placeholder="Supporting Doc Link (G-Drive) - Optional" 
                              className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500" 
                            />
                          )}
                        </div>

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
                              <div className="mt-2">
                                <a 
                                  href={req.attachmentUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  download={req.attachmentName || "attached_document"} 
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20 w-fit transition-colors shadow-sm"
                                >
                                  <Paperclip className="w-3.5 h-3.5" /> 
                                  <span>{req.attachmentName ? `Attached: ${req.attachmentName}` : "View Attached Document"}</span>
                                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Added a "View Form" button */}
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => setInspectedRequest(req)} className="flex-[0.5] py-2 bg-slate-200 hover:bg-slate-300 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1">
                              <Eye className="w-4 h-4" /> 
                            </button>
                            <button onClick={() => handleUpdateStatus(req.id, "approved", req)} className="flex-1 py-2 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold active:scale-95 transition-all">
                              Approve
                            </button>
                            <button onClick={() => setRequestToDecline(req)} className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold active:scale-95 transition-all">
                              Decline
                            </button>
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

        {/* Printable Leave Form Modal */}
        {inspectedRequest && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:bg-white print:overflow-visible">
            <div className="bg-white text-gray-900 rounded-3xl w-full max-w-2xl mt-10 p-8 shadow-2xl print:m-0 print:shadow-none print:max-w-none relative animate-zoom-in">
              
              <div className="flex justify-between items-center border-b pb-4 mb-6 print:hidden">
                <button onClick={() => setInspectedRequest(null)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" /> Close
                </button>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleDownloadPDF} 
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                  <button 
                    onClick={() => window.print()} 
                    className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-slate-800/20 transition-all"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                </div>
              </div>

              <div className="text-center border-b-2 border-gray-900 pb-4 mb-6">
                <h1 className="text-2xl font-black uppercase tracking-widest text-gray-900 print:text-black">SimplifV Business Consulting Corp.</h1>
                <p className="text-xs text-gray-600 font-medium mt-1">Subic City, Zambales • &quot;Let&apos;s SimplifV your Business&quot;</p>
                
                <h2 className="text-lg font-bold mt-5 uppercase tracking-widest bg-slate-100 print:bg-transparent py-1 rounded border print:border-none border-gray-200">
                  {inspectedRequest.status === "pending" ? "Leave Application (Pending Slip)" : "Official Leave of Absence Form"}
                </h2>
                
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
                  <div className="mt-3 p-3.5 bg-slate-50 border border-indigo-200 rounded-xl print:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <Paperclip className="w-4 h-4 text-indigo-600" />
                        Supporting / Medical Document Attached:
                      </span>
                      <a 
                        href={inspectedRequest.attachmentUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        download={inspectedRequest.attachmentName || "attached_document"}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download / Open Attachment
                      </a>
                    </div>
                    
                    <div className="text-xs font-semibold text-gray-700 bg-white p-2 rounded-lg border border-gray-200 truncate flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{inspectedRequest.attachmentName || "Attached Document File / Link"}</span>
                    </div>

                    {inspectedRequest.attachmentUrl.startsWith("data:image/") && (
                      <div className="mt-2 max-h-48 overflow-hidden rounded-lg border border-gray-200 bg-white p-1">
                        <img 
                          src={inspectedRequest.attachmentUrl} 
                          alt="Attached Supporting Document" 
                          className="max-h-44 w-auto object-contain mx-auto rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-900 pt-4 mt-6">
                <span className="text-gray-900 font-black uppercase tracking-widest block text-xs mb-4">Human Resources Disposition</span>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className={`px-4 py-1.5 border-2 font-bold uppercase tracking-widest text-xs rounded-sm transform -rotate-2 ${
                    inspectedRequest.status === "pending" ? "border-gray-400 text-gray-500 border-dashed bg-gray-50 print:bg-transparent" :
                    inspectedRequest.status === "approved" ? "border-emerald-600 text-emerald-600" :
                    inspectedRequest.status === "rejected" ? "border-rose-600 text-rose-600" :
                    "border-amber-500 text-amber-500"
                  }`}>
                    {inspectedRequest.status === "pending" ? "[ FOR HR REVIEW ]" : inspectedRequest.status}
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
                  
                  {inspectedRequest.status === "pending" && (
                    <div className="text-[8px] text-gray-400 italic mt-1 normal-case leading-tight">
                      (Valid for pending requests only;<br/>not an authorization of absence)
                    </div>
                  )}
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