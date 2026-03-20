"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { updateUserProfile, getUserProfile } from "@/services/user";
import toast from "react-hot-toast"; // Using Ace's new toast notifications!

export default function ProfileSettings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Load their existing data when the component mounts
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.uid) {
        const data = await getUserProfile(user.uid);
        if (data) {
          setFullName(data.fullName || "");
          setRole(data.role || "");
        }
      }
      setIsFetching(false);
    };
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    try {
      await updateUserProfile(user.uid, fullName, role);
      toast.success("Profile updated successfully!"); // Trigger the satisfying popup
    } catch (error) {
      toast.error("Failed to update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="animate-pulse h-32 bg-gray-100 dark:bg-white/5 rounded-2xl w-full max-w-md mx-auto mt-6"></div>;

  return (
    <div className="w-full max-w-md mx-auto mt-6 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl p-6 relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="text-xl font-light text-gray-900 dark:text-white tracking-wide mb-1">My Profile</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Update your details for the HR dashboard.</p>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold tracking-wide text-gray-500 uppercase mb-1">Position / Role</label>
            <input 
              type="text" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Frontend Developer"
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold py-3 px-4 rounded-xl transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2 mt-2"
          >
            {isLoading ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}