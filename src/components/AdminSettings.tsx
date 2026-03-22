"use client";

import { useState, useEffect, use} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function AdminSettings() {
  const [shiftStartTime, setShiftStartTime] = useState("08:00");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "company"); 
        const docSnap = await getDoc(docRef); 

        if (docSnap.exists() && docSnap.data().shiftStartTime) {
          setShiftStartTime(docSnap.data().shiftStartTime);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load company settings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);


  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "settings", "company");
      await setDoc(docRef, { shiftStartTime }, { merge: true });
      toast.success("Shift start time updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Loading company settings...</div>;
  }

  return (
    <div className="w-full max-w-2xl mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 p-6">
      <div className="mb-6 border-b border-gray-200 dark:border-white/10 pb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Company Settings</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage global rules for the SimpliSync platform.</p>
      </div>

      <div className="space-y-6">
        {/* Tardiness Threshold Setting */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-200 dark:border-white/5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Shift Start Time</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Employees clocking in after this time will be marked as <span className="text-rose-500 font-medium">Late</span>.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-lg font-medium rounded-lg focus:ring-teal-500 focus:border-teal-500 block px-4 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}