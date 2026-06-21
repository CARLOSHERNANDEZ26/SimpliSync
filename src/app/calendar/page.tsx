"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Calendar as CalendarIcon, Plus, Trash2, ChevronLeft, ChevronRight, Tag, HelpCircle, Info, X } from "lucide-react";
import toast from "react-hot-toast";

interface Holiday {
  id: string;
  holidayName: string;
  date: string; 
  type: string;  
  description?: string; 
}

export default function CompanyCalendarPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayName, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("Company-Wide");
  const [description, setDescription] = useState(""); 
  const [isAdding, setIsAdding] = useState(false);
  const [activeInspectionHoliday, setActiveInspectionHoliday] = useState<Holiday | null>(null);
  const [currentNavDate, setCurrentNavDate] = useState(new Date());
  
  const navYear = currentNavDate.getFullYear();
  const navMonth = currentNavDate.getMonth(); 

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    // 🔥 We listen to all events ordered by date. This allows multiple docs to share the same date string safely.
    const q = query(collection(db, "holidays"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday)));
    });
    return () => unsubscribe();
  }, []);

  const firstDayIndex = new Date(navYear, navMonth, 1).getDay();
  const totalDaysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const blankCells = Array(firstDayIndex).fill(null);
  const monthDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);

  const handlePrevMonth = () => {
    setCurrentNavDate(new Date(navYear, navMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentNavDate(new Date(navYear, navMonth + 1, 1));
  };

  const handleDayClick = (day: number) => {
    if (!isAdmin) return; 
    const paddedMonth = String(navMonth + 1).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");
    setDate(`${navYear}-${paddedMonth}-${paddedDay}`);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin || !holidayName || !date) return;
    
    setIsAdding(true);
    try {
      // 🔥 Multiple addDoc executions for the exact same date string are natively supported and encouraged
      await addDoc(collection(db, "holidays"), { holidayName, date, type, description });
      toast.success("Event locked into organizational schedule!");
      setName(""); setDate(""); setDescription(""); 
    } catch (error) {
      console.error(error);
      toast.error("Failed to append event allocation.");
    } finally {
      setIsAdding(false);
    }
  };

  const executeDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "holidays", id));
      toast.success("Event de-allocated successfully.");
      setActiveInspectionHoliday(null);
    } catch (error) {
      console.error(error);
      toast.error("Deletion constraint error.");
    }
  };

  const getTypeStyle = (holidayType: string) => {
    switch (holidayType) {
      case "Company-Wide": return "bg-emerald-500 text-white shadow-emerald-500/20";
      case "Regional": return "bg-indigo-500 text-white shadow-indigo-500/20";
      default: return "bg-amber-500 text-white shadow-amber-500/20";
    }
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-y-auto pt-[73px] bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
        <Navbar />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-teal-500" />
              Company Scheduler Center
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure workspace cycles, leaves, and calendar adjustments.</p>
          </div>

          <div className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-3" : "max-w-4xl mx-auto"} gap-8 items-start`}>
            
            <div className={`${isAdmin ? "lg:col-span-2" : "w-full"} bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-md flex flex-col`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold tracking-tight font-mono text-gray-800 dark:text-gray-200">
                  {monthNames[navMonth]} {navYear}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevMonth} className="p-2 border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-gray-600 dark:text-gray-400"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={handleNextMonth} className="p-2 border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all text-gray-600 dark:text-gray-400"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 text-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-2">{day}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {blankCells.map((_, i) => (
                  <div key={`blank-${i}`} className="aspect-square bg-slate-100/40 dark:bg-white/[0.01] rounded-xl border border-dashed border-gray-200/50 dark:border-white/[0.02]"></div>
                ))}
                
                {monthDays.map((day) => {
                  const paddedMonth = String(navMonth + 1).padStart(2, "0");
                  const paddedDay = String(day).padStart(2, "0");
                  const matchingIsoString = `${navYear}-${paddedMonth}-${paddedDay}`;
                  
                  // 🔥 MULTI-MATCH: Filters ALL events for this day instead of breaking after finding one
                  const dayHolidays = holidays.filter(h => h.date === matchingIsoString);

                  return (
                    <div 
                      key={`day-${day}`}
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square p-2 bg-slate-50 dark:bg-black/10 border border-gray-200/60 dark:border-white/5 rounded-2xl flex flex-col items-start transition-all select-none relative overflow-y-auto custom-scrollbar ${
                        isAdmin ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        date === matchingIsoString && isAdmin 
                          ? 'ring-2 ring-teal-500 bg-teal-50/20 dark:bg-teal-500/10' 
                          : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className={`text-xs font-bold font-mono ${date === matchingIsoString && isAdmin ? 'text-teal-500' : 'text-gray-700 dark:text-gray-400'} mb-1`}>
                        {day}
                      </span>

                      {/* 🔥 STACK CONTAINER: Holds an unlimited number of event block tags */}
                      <div className="w-full flex flex-col gap-1 z-10 overflow-y-auto">
                        {dayHolidays.map(h => (
                          <div 
                            key={h.id}
                            onClick={(e) => { e.stopPropagation(); setActiveInspectionHoliday(h); }}
                            className={`w-full text-left text-[9px] font-bold px-1.5 py-0.5 rounded cursor-pointer border border-transparent transition-all uppercase tracking-wider flex items-center justify-between ${getTypeStyle(h.type)}`}
                            title={`Inspect details for ${h.holidayName}`}
                          >
                            <span className="truncate w-full block">{h.holidayName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {isAdmin && (
              <div className="bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-xl flex flex-col sticky top-[90px]">
                <div className="mb-4 pb-3 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-teal-500" /> Allocation Control
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Assign an event block or click empty cells inside the month canvas to auto-populate target parameters. You can add multiple events to the same day.</p>
                </div>

                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Event Name & Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 9:00AM Sync Meeting"
                      value={holidayName}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Assigned Target Calendar Slot</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white text-sm font-mono font-bold"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Short Description Rule</label>
                    <textarea
                      placeholder="e.g. Mandatory attendance for all department heads."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white text-sm resize-none h-16 leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Allocation Scope Classification</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white text-sm font-medium cursor-pointer"
                    >
                      <option value="Company-Wide">Company-Wide (Regular)</option>
                      <option value="Regional">Regional (Special Non-Working)</option>
                      <option value="Optional">Optional / Floating Allocation</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={isAdding || !holidayName || !date}
                    className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl font-bold py-3.5 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    {isAdding ? "Allocating..." : "Lock Event to Schedule"}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><HelpCircle className="w-3 h-3" /> Calendar Class Key</div>
                  <div className="flex flex-wrap gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Regular</div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><span className="w-2.5 h-2.5 rounded bg-indigo-500"></span> Regional</div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Floating</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {activeInspectionHoliday && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#151515] w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-teal-500" /> Holiday Details
                </h3>
                <button 
                  onClick={() => setActiveInspectionHoliday(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                    {activeInspectionHoliday.holidayName}
                  </h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      activeInspectionHoliday.type === 'Company-Wide' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                      activeInspectionHoliday.type === 'Regional' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    }`}>
                      {activeInspectionHoliday.type}
                    </span>
                    <span className="text-xs text-gray-400 font-mono font-bold">
                      {new Date(activeInspectionHoliday.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed italic">
                  &ldquo;{activeInspectionHoliday.description || "No description provided for this calendar entry."}&rdquo;
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => executeDelete(activeInspectionHoliday.id)}
                    className="w-full mt-2 py-2.5 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-600 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-400 hover:text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-500/20 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove from Schedule
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}