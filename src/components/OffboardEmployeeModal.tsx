"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { X, UserMinus, AlertTriangle } from "lucide-react";

interface Employee {
  id: string;
  fullName: string;
  name: string;
}

interface OffboardModalProps {
  employee: Employee;
  onClose: () => void;
}

export default function OffboardEmployeeModal({ employee, onClose }: OffboardModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [offboardType, setOffboardType] = useState("Resigned");
  const [offboardDate, setOffboardDate] = useState("");

  const handleOffboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offboardDate) {
      toast.error("Please provide the effective date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", employee.id);
      
      // We update their status and permanently save the offboarding details
      await updateDoc(userRef, {
        status: offboardType, // Overwrites "active" with "Resigned", etc.
        offboardDate: offboardDate,
        workStatus: "Offline", // Ensures they can't be stuck "Working"
        offboardedAt: serverTimestamp()
      });

      toast.success(`${employee.fullName || employee.name} has been successfully offboarded.`);
      onClose();
    } catch (error) {
      console.error("Offboarding Error:", error);
      toast.error("Failed to offboard employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-white/10 overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 bg-rose-50 dark:bg-rose-500/10">
          <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <UserMinus className="w-5 h-5" /> Offboard Employee
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl border border-amber-200 dark:border-amber-500/20 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              You are about to offboard <strong className="font-bold">{employee.fullName || employee.name}</strong>. This will revoke their access to active systems while preserving their historical logs for DOLE audits and Final Pay calculations.
            </p>
          </div>

          <form onSubmit={handleOffboard} className="space-y-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reason for Separation</label>
              <select 
                value={offboardType}
                onChange={(e) => setOffboardType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              >
                <option value="Resigned">Voluntary Resignation</option>
                <option value="Terminated">Termination (Just/Authorized Cause)</option>
                <option value="End of Contract">End of Contract</option>
                <option value="AWOL">AWOL (Abandonment)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Effective Date</label>
              <input 
                type="date" 
                value={offboardDate}
                onChange={(e) => setOffboardDate(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full mt-4 bg-rose-600 hover:bg-rose-500 py-3.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Processing Offboarding..." : "Confirm Offboarding"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}