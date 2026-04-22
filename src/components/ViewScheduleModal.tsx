  "use client";

import { useState, useEffect } from "react";
import { X, Calendar as CalendarIcon, Clock, Save, Edit3, CheckCircle2 } from "lucide-react";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

interface ScheduleHours {
  start: string;
  end: string;
}

interface Employee {
  id: string;
  fullName: string;
  name?: string;
  scheduleDays?: string[];
  scheduleHours?: ScheduleHours;
}

interface ViewScheduleModalProps {
  employee: Employee;
  onClose: () => void;
}

export default function ViewScheduleModal({ employee, onClose }: ViewScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<"calendar" | "settings">("calendar");

  // Local state for editing schedule
  const [scheduleDays, setScheduleDays] = useState<string[]>(employee.scheduleDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [scheduleHours, setScheduleHours] = useState<ScheduleHours>(employee.scheduleHours || { start: "09:00", end: "17:00" });
  const [isSaving, setIsSaving] = useState(false);

  // Calendar State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  
  // Attendance Logs State
  const [presentDays, setPresentDays] = useState<Set<number>>(new Set());
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoadingLogs(true);
      try {
        const logsRef = collection(db, "attendanceLogs");
        // Create range for current month
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999); 

        // Use optimized query relying on Firebase composite index
       const q = query(
          logsRef, 
          where("userId", "==", employee.id)
        );

        const snapshot = await getDocs(q);
        const present = new Set<number>();
        
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.timeIn) {
            const date = data.timeIn.toDate();
            if (date.getTime() >= startOfMonth.getTime() && date.getTime() <= endOfMonth.getTime()) {
              present.add(date.getDate());
            }
          }
        });
        setPresentDays(present);
      } catch (error: unknown) {
        console.error("Failed to fetch attendance for calendar", error);
      } finally {
        setIsLoadingLogs(false);
      }
    };

    fetchAttendance();
  }, [currentMonth, currentYear, employee.id]);

  const toggleDay = (day: string) => {
    setScheduleDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", employee.id), {
        scheduleDays,
        scheduleHours
      });
      toast.success("Schedule updated successfully!");
    } catch (error: unknown) {
      console.error("Failed to update schedule", error);
      toast.error("Failed to update schedule.");
    } finally {
      setIsSaving(false);
    }
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
  
  // Convert 0 (Sun) - 6 (Sat) to 0 (Mon) - 6 (Sun) for our calendar rendering
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const getDayNameFromIndex = (index: number) => {
    // index is 0 for Monday, 6 for Sunday
    return allDays[index];
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(cur => cur + 1);
    } else {
      setCurrentMonth(cur => cur + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(cur => cur - 1);
    } else {
      setCurrentMonth(cur => cur - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-white/10 relative max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 shrink-0">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-teal-500" />
              Schedule Tracker
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Managing schedule for <span className="font-semibold text-gray-700 dark:text-gray-300">{employee.fullName || employee.name}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-slate-50 dark:bg-white/5 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tabs */}
        <div className="flex p-4 gap-2 border-b border-gray-100 dark:border-white/10 shrink-0 bg-slate-50/50 dark:bg-black/10">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${
              activeTab === "calendar" 
                ? "bg-white dark:bg-white/10 text-teal-600 dark:text-teal-400 shadow-sm border border-gray-200 dark:border-white/10" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar View
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-2 ${
              activeTab === "settings" 
                ? "bg-white dark:bg-white/10 text-teal-600 dark:text-teal-400 shadow-sm border border-gray-200 dark:border-white/10" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Schedule Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {activeTab === "calendar" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                  {monthNames[currentMonth]} {currentYear}
                </h4>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors">
                    &larr; Prev
                  </button>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors">
                    Next &rarr;
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200 dark:bg-white/5 dark:border-white/10"></div>
                  <span>Not Scheduled</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-teal-50 border border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/20"></div>
                  <span>Scheduled Shift</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 dark:bg-emerald-400"></div>
                  <span className="text-emerald-700 dark:text-emerald-400">Attended</span>
                </div>
              </div>

              {/* Grid */}
              <div className="w-full relative">
                {isLoadingLogs && (
                  <div className="absolute inset-0 z-10 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-xl">
                    <span className="animate-pulse font-medium text-teal-600">Loading records...</span>
                  </div>
                )}
                
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest">{day}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {/* Blanks */}
                  {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                    <div key={`blank-${i}`} className="aspect-square opacity-0"></div>
                  ))}
                  
                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNumber = i + 1;
                    // Calculate which day of week this is (0 = Mon, 6 = Sun)
                    const dayOfWeekIndex = (adjustedFirstDay + i) % 7;
                    const dayName = getDayNameFromIndex(dayOfWeekIndex);

                    const isScheduled = scheduleDays.includes(dayName);
                    const isPresent = presentDays.has(dayNumber);
                    
                    const isToday = dayNumber === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                    return (
                      <div 
                        key={dayNumber} 
                        className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-center border transition-all relative ${
                          isPresent 
                            ? "bg-emerald-100 border-emerald-300 dark:bg-emerald-500/20 dark:border-emerald-500/40 shadow-inner" 
                            : isScheduled 
                              ? "bg-teal-50 border-teal-200 dark:bg-teal-500/10 dark:border-teal-500/30" 
                              : "bg-slate-50 border-gray-100 dark:bg-white/5 dark:border-white/5 opacity-60"
                        } ${isToday ? "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#1a1a1a]" : ""}`}
                      >
                        <span className={`text-sm font-bold ${
                          isPresent ? "text-emerald-700 dark:text-emerald-400" : isScheduled ? "text-teal-800 dark:text-teal-300" : "text-gray-400"
                        }`}>
                          {dayNumber}
                        </span>
                        
                        {isPresent && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute bottom-1 right-1" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="flex flex-col gap-6 animate-fade-in">
              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-teal-500" />
                  Working Days
                </h4>
                <div className="flex flex-wrap gap-2">
                  {allDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                        scheduleDays.includes(day) 
                          ? "bg-teal-500 text-white shadow-lg shadow-teal-500/30 ring-2 ring-teal-500 ring-offset-2 dark:ring-offset-[#252525]" 
                          : "bg-white dark:bg-black/20 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 hover:border-teal-300 dark:hover:border-teal-500/50"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-gray-100 dark:border-white/10">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-500" />
                  Scheduled Hours
                </h4>
                <div className="flex gap-6">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Start Time</label>
                    <input
                      type="time"
                      value={scheduleHours.start}
                     onClick={(e) => {
  const target = e.target as HTMLInputElement;
  if (typeof target.showPicker === 'function') {
    target.showPicker();
  }
}}
                      onChange={(e) => setScheduleHours(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-bold tracking-widest text-lg cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">End Time</label>
                    <input
                      type="time"
                      value={scheduleHours.end}
                     onClick={(e) => {
  const target = e.target as HTMLInputElement;
  if (typeof target.showPicker === 'function') {
    target.showPicker();
  }
}}
                      onChange={(e) => setScheduleHours(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all font-bold tracking-widest text-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="mt-2 w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center shadow-lg shadow-teal-500/30 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95 gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? "Saving Settings..." : "Save Schedule Settings"}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
