"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  fullName: string;
  date: string;
  type: string;
}

export default function CalendarPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

useEffect(() => {
    const q = query(collection(db, "holidays"), orderBy("date", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday)));
    }, (error) => {

      if (error.code !== "permission-denied") {
        console.error("Calendar sync error:", error);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate calendar grid
  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-16 sm:h-24 md:h-32 border border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 opacity-50"></div>);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const currentIterDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
    // Format to YYYY-MM-DD local time strings to match HTML5 input type="date" which is how we saved holidays
    const dateString = `${currentIterDate.getFullYear()}-${String(currentIterDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    // Find holiday events
    const dayHolidays = holidays.filter(h => h.date === dateString);

    const isToday = new Date().toDateString() === currentIterDate.toDateString();

    days.push(
      <div key={d} className={`h-16 sm:h-24 md:h-32 border border-gray-100 dark:border-white/5 p-1 sm:p-2 flex flex-col transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${isToday ? 'bg-teal-50/30 dark:bg-teal-900/10' : 'bg-white dark:bg-black/20'}`}>
        <div className="flex justify-between items-center mb-0.5 sm:mb-1">
          <span className={`text-[10px] sm:text-sm font-medium ${isToday ? 'w-4 h-4 sm:w-6 sm:h-6 rounded-full bg-teal-500 text-white flex items-center justify-center' : 'text-gray-700 dark:text-gray-300'}`}>
            {d}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 sm:space-y-1 custom-scrollbar pr-0 sm:pr-1">
          {dayHolidays.map(hol => (
            <div key={hol.id} className="text-[8px] sm:text-xs font-semibold px-1 sm:px-2 py-0.5 sm:py-1 rounded-sm sm:rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 line-clamp-1 group-hover:line-clamp-none group-active:line-clamp-none text-balance transition-all cursor-pointer" title={hol.fullName || hol.name}>
              <span className="hidden sm:inline">🎊 </span>{hol.fullName || hol.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <CalendarDays className="w-10 h-10 text-teal-500" />
                Company Calendar
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                View upcoming holidays and important company-wide dates.
              </p>
            </div>

            <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-4 w-full md:w-auto bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-2 shadow-sm">
              <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-95 text-gray-600 dark:text-gray-400">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-full md:w-32 text-center font-bold text-gray-900 dark:text-white text-sm sm:text-base">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-95 text-gray-600 dark:text-gray-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
            {/* Calendar Header */}
            <div className="grid grid-cols-7 bg-slate-50 dark:bg-black/40 border-b border-gray-200 dark:border-white/10">
              {weekDays.map(day => (
                <div key={day} className="py-2 sm:py-3 md:py-4 text-center text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 bg-gray-200 dark:bg-white/10 gap-px">
              {days}
            </div>
          </div>

        </div>
      </main>
    </ProtectedRoute>
  );
}
