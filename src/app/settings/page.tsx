"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import PreferencesSettings from "@/components/PreferencesSettings";
import AdminSettings from "@/components/AdminSettings";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import Image from "next/image";
import { MapPin, Crosshair, Save, Target, Lightbulb, Briefcase, Receipt, Banknote, Phone, Mail, Globe } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [officeLat, setOfficeLat] = useState<number | "">("");
  const [officeLng, setOfficeLng] = useState<number | "">("");
  const [radius, setRadius] = useState<number | "">(50);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
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
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />

        <div className="relative z-10 w-full max-w-[95%] 2xl:max-w-[100rem] mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="flex flex-col space-y-8 animate-fade-in-up">
            
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors">
                Settings
              </h2>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 transition-colors">
                Manage your application preferences and view company details.
              </p>
            </div>

            <div className={`grid grid-cols-1 ${isAdmin ? "md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto" : "max-w-md mx-auto"} gap-6 items-start w-full`}>
               <div className="w-full">
                 <PreferencesSettings />
               </div>
               
              {isAdmin && (
                <>
                  <div className="w-full">
                    <AdminSettings />
                  </div>
                  
                  <div className="w-full md:col-span-2 lg:col-span-1">
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

            {/* SimplifV Company Profile Section */}
            <div className="max-w-5xl mx-auto w-full mt-10">
              <div className="bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl">
                
                <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-8 sm:p-10 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="w-20 h-20 bg-[#0d1117] rounded-full relative shadow-lg overflow-hidden shrink-0 border border-white/10">
                      <Image 
                        src="/simplifvlogo.png" 
                        alt="SimplifV Logo" 
                        fill
                        priority
                        className="object-contain p-1.5" 
                        sizes="80px"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">SimplifV Business Consulting Corp.</h3>
                      <p className="text-teal-100 font-medium text-lg">&quot;Let&apos;s SimplifV your Business&quot;</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-white/10 bg-slate-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10">
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg">
                        <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Mission</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                      To help our clients upscale by simplifying their processes and other corporate activities so they can focus on their core businesses.
                    </p>
                  </div>
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                        <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Vision</h4>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                      To be the leading outsourced services provider in Accounting, Taxation and Payroll Management.
                    </p>
                  </div>
                </div>

                <div className="p-8 sm:p-10">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8 text-center">Our Core Services</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-6 h-6 text-teal-500" />
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white">Accounting</h5>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Running a business without an accountant? We got that covered! With our full suite of accounting services, you can have peace of mind while growing your business.
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></div> Business Registration</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></div> Business Renewal and Closure</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></div> Bookkeeping</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0"></div> Business Management Advisory</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-6 h-6 text-indigo-500" />
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white">Taxation</h5>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        BIR Compliance? Not knowing what, where and when to file and pay your taxes can bankrupt your business. Save money with SimplifV!
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div> Tax Registration</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div> Monthly, Quarterly & Annual Filings</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div> Tax Assessments</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div> Clearing of Open Cases</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Banknote className="w-6 h-6 text-emerald-500" />
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white">Payroll</h5>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        Growing number of employees? Let us manage your payroll so you can focus on Growing your Business! Compliant with all labor laws and requirements.
                      </p>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div> Full Payroll Management</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div> SSS Compliance</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div> Philhealth & HDMF Compliance</li>
                        <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div> BIR Compliance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-100 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 p-6 sm:p-8 flex flex-col md:flex-row justify-center gap-6 md:gap-10 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> 0917 130 0418
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> consult@simplifv.com
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" /> simplifv.com
                  </div>
                  <div className="flex items-center justify-center gap-2 text-center">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" /> 0146 National Road, Baraca-Camachile (Pob.), Subic, Zambales 2209
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}