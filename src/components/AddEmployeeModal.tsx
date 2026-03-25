"use client";

import { useState } from "react";
import { addEmployee } from "@/services/auth";
import toast from "react-hot-toast";
import { X, ShieldAlert } from "lucide-react";

export default function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const [fullname, setName] = useState("");
  const [position, setPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [joinDate, setJoinDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [password, setPassword] = useState("");
  
  // 🔥 NEW: State for the System Role
  const [role, setRole] = useState("employee"); 
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 🔥 NEW: Pass the 'role' state into the function
      await addEmployee(fullname, position, department, joinDate, birthDate, password, role);
      toast.success(`${fullname} has been added as ${role === 'admin' ? 'an Admin' : 'an Employee'}!`);
      onClose();
    } catch (err) {
      toast.error("Failed to create user.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-white/10 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add New User</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Create credentials and assign system access levels.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
            <input
              type="text"
              placeholder="Juan Dela Cruz"
              value={fullname}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Position / Job Title</label>
              <input
                type="text"
                placeholder="e.g. Developer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Department</label>
              <input
                type="text"
                placeholder="e.g. IT"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Join Date</label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                required
              />
            </div>
            
            <div className="flex flex-col gap-1.5 w-1/2">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Birth Date</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* 🔥 NEW: System Role Dropdown */}
          <div className="flex flex-col gap-1.5 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl mt-2">
            <label className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              System Access Level
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-white dark:bg-black/40 border border-amber-200 dark:border-amber-500/30 text-gray-900 dark:text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium appearance-none cursor-pointer"
            >
              <option value="employee">Standard Employee</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Initial Password</label>
            <input
              type="text"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-medium tracking-widest"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-4 w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center shadow-lg shadow-teal-500/30 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
          >
            {isLoading ? "Creating..." : "Create User"}
          </button>
        </form>
      </div>
    </div>
  );
}