import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Calendar, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Holiday {
  id: string;
  holidayName: string;
  date: string;
  type: string;
}

export default function HolidaySettings() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayName, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("Company-Wide");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "holidays"), orderBy("date", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHolidays(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Holiday)));
    });
    return () => unsubscribe();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayName || !date) return;
    
    setIsAdding(true);
    try {
      await addDoc(collection(db, "holidays"), { holidayName, date, type });
      toast.success("Holiday added!");
      setName("");
      setDate("");
    } catch (error) {
      toast.error("Failed to add holiday.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "holidays", id));
      toast.success("Holiday removed.");
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error("Failed to remove.");
    }
  };

  return (
    <div className="bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl transition-all duration-300 flex flex-col h-full animate-fade-in-up" style={{animationDelay: '0.2s'}}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-teal-100 dark:bg-teal-500/20 rounded-2xl text-teal-600 dark:text-teal-400">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Holiday Calendar</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure company holidays.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Holiday Name"
            value={holidayName}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white text-sm"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white text-sm"
            required
          />
        </div>
        <div className="flex gap-4">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all dark:text-white text-sm font-medium"
          >
            <option value="Company-Wide">Company-Wide</option>
            <option value="Regional">Regional</option>
            <option value="Optional">Optional / Floating</option>
          </select>
          <button
            type="submit"
            disabled={isAdding}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-500/30 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </form>

      <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar flex-1">
        {holidays.length > 0 ? (
          holidays.map(holiday => (
            <div key={holiday.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">{holiday.holidayName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(holiday.date).toLocaleDateString()} • {holiday.type}</div>
              </div>
              <button
                onClick={() => handleDelete(holiday.id)}
                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                title="Remove Holiday"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 italic">
            No holidays scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
