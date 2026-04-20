"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import PreferencesSettings from "@/components/PreferencesSettings";
import AdminSettings from "@/components/AdminSettings";
import HolidaySettings from "@/components/HolidaySettings";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore"; // 🔥 Added getDoc
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { MapPin, Crosshair, Save } from "lucide-react"; // 🔥 Added icons for UI

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  
  // 🔥 Geofence States
  const [officeLat, setOfficeLat] = useState<number | "">("");
  const [officeLng, setOfficeLng] = useState<number | "">("");
  const [radius, setRadius] = useState<number | "">(50);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 🔥 Fixed: Added getDoc to actually fetch the snapshot
        const settingsSnap = await getDoc(doc(db, "settings", "company"));
        if (settingsSnap.exists()) {
          const data = settingsSnap.data();
          setOfficeLat(data.officeLat || 14.942155);
          setOfficeLng(data.officeLng || 120.217151);
          setRadius(data.allowedRadius || 50);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  // 🔥 The Save Handler (Moved outside useEffect)
  const handleSaveGeofence = async () => {
    if (officeLat === "" || officeLng === "" || radius === "") {
      toast.error("Please fill in all geofence fields.");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "settings", "company"), {
        officeLat: Number(officeLat),
        officeLng: Number(officeLng),
        allowedRadius: Number(radius),
      });
      toast.success("Geofence location updated globally!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to update geofence.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    const toastId = toast.loading("Acquiring GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOfficeLat(position.coords.latitude);
        setOfficeLng(position.coords.longitude);
        toast.success("Coordinates acquired! Click save to apply.", { id: toastId });
      },
      (error) => {
        toast.error("Failed to get location. Check browser permissions.", { id: toastId });
        console.error(error);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans relative overflow-y-auto overflow-x-hidden transition-colors duration-500 pt-[73px] pb-20">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />

        <div className="relative z-10 w-full max-w-[95%] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="flex flex-col space-y-8 animate-fade-in-up">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 transition-colors">
                Settings
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 transition-colors">
                Manage your profile and application preferences.
              </p>
            </div>

            <div className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-2 lg:max-w-5xl xl:max-w-none xl:grid-cols-4 mx-auto" : "max-w-md mx-auto"} gap-6 items-start w-full`}>
               <div className="w-full flex h-full order-1 lg:order-last">
                 <PreferencesSettings />
               </div>
               
              {isAdmin && (
                <>
                  <div className="w-full flex h-full">
                    <HolidaySettings />
                  </div>
                  <div className="w-full flex h-full">
                    <AdminSettings />
                  </div>
                  <div className="w-full flex flex-col h-full">
                    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-teal-100 dark:bg-teal-500/20 rounded-xl">
                          <MapPin className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Office Location</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Set the central hub for employee clock-ins.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                            Latitude
                          </label>
                          <input
                            type="number"
                            value={officeLat}
                            onChange={(e) => setOfficeLat(parseFloat(e.target.value) || "")}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
                            placeholder="e.g. 14.942155"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                            Longitude
                          </label>
                          <input
                            type="number"
                            value={officeLng}
                            onChange={(e) => setOfficeLng(parseFloat(e.target.value) || "")}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
                            placeholder="e.g. 120.217151"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                            Allowed Radius (Meters)
                          </label>
                          <input
                            type="number"
                            value={radius}
                            onChange={(e) => setRadius(parseFloat(e.target.value) || "")}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all dark:text-white"
                            placeholder="e.g. 50"
                          />
                        </div>

                        <div className="pt-4 flex flex-col gap-3">
                          <button
                            onClick={handleGetCurrentLocation}
                            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl transition-all text-sm"
                          >
                            <Crosshair className="w-4 h-4" />
                            Get My Location
                          </button>
                          
                          <button
                            onClick={handleSaveGeofence}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                            <Save className="w-4 h-4" />
                            {isSaving ? "Saving..." : "Save Settings"}
                          </button>
                        </div>
                      </div>

                      
                    </div>
                    
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}