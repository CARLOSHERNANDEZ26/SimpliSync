  "use client";

  import ProtectedRoute from "@/components/ProtectedRoute";
  import { useAuth } from "@/hooks/useAuth";
  import { auth } from "@/lib/firebase";
  import { signOut } from "firebase/auth";
  import { useRouter } from "next/navigation";
  import ClockInButton from "@/components/ClockInButton";
  import ClockOutButton from "@/components/ClockOutButton";
  import AdminLogsTable from "@/components/AdminLogsTable";
  import EmployeeHistoryTable from "@/components/EmployeeHistoryTable";
  import toast from "react-hot-toast";
  import ProfileSettings from "@/components/ProfileSettings";

  export default function DashboardPage() {
    // 1. We don't need 'loading' here anymore! ProtectedRoute handles it.
    const { user } = useAuth();
    const router = useRouter();

    const isAdmin = user?.email === "admin@simplisync.local";

    const handleLogout = async () => {
      await signOut(auth);
      toast.success("Successfully logged out.");
      router.push("/login");
    };

    // NOTICE: I deleted the useEffect, the if(loading) screen, and the if(!user) block!

    return (
      // 2. ProtectedRoute does all the heavy lifting for us right here.
      <ProtectedRoute>
        <main className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-500 pt-[73px]">
          {/* Dynamic Background Glows */}
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

          {/* Navigation Bar */}
          <nav className="fixed top-0 left-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-md px-6 py-4 flex justify-between items-center transition-colors duration-500">
            <div className="flex items-center gap-3">
              {/* Small Logo */}
              <div className="w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25 65C15 65 10 55 15 45C18 38 25 35 30 35C35 20 55 15 65 25C75 20 85 25 90 35C95 45 90 60 75 60"
                    stroke="#0f766e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="42" y="30" width="15" height="40" fill="#ffffff" />
                  <polygon points="42,30 49.5,20 57,30" fill="#ffffff" />
                  <path d="M20 55 C 30 75, 55 75, 65 55 L 75 55 L 60 35 L 55 50" fill="#14b8a6" />
                </svg>
              </div>
              <h1 className="text-xl font-light tracking-wider hidden sm:block text-gray-900 dark:text-gray-100 transition-colors">
                Simpli<span className="font-semibold text-teal-600 dark:text-teal-400">Sync</span>
              </h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold transition-colors">Logged in as</span>
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors">{user?.email}</span>
              </div>

              <button
                onClick={handleLogout}
                className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Logout</span>
                <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </nav>

          {/* Main Content Area */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              
            {/* Left Column: Greeting & Actions */}
            <div className="w-full lg:w-1/3 flex flex-col space-y-8 animate-fade-in-up">
              <div className="space-y-4">
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 transition-colors">
                  Welcome back, <br className="hidden sm:block lg:hidden" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400 dark:from-teal-400 dark:to-emerald-300">
                    {user?.email?.split('@')[0]}
                  </span>
                </h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 transition-colors">
                  Your HR Dashboard is ready for your shift.
                </p>
              </div>

              {/* Time Tracking Card */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xl shadow-teal-500/5 dark:shadow-black/20">
                <div className="flex flex-col gap-6 items-center w-full">
                  <div className="w-full flex justify-center">
                    <ClockInButton />
                  </div>
                  {/* Restored the 1-pixel divider line properly! */}
                  <div className="w-full h-px bg-gray-200 dark:bg-white/10"></div> 
                  <div className="w-full flex justify-center">
                    <ClockOutButton />
                  </div>
                </div>
              </div>

              {/* Profile Settings Card - Placed safely below the clock buttons! */}
              <ProfileSettings />

            </div>

              {/* Right Column: Logs / History */}
              <div className="w-full lg:w-2/3 flex flex-col space-y-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                {isAdmin && (
                  <div className="mb-2">
                    <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                      Admin View Only
                    </span>
                  </div>
                )}
                
                {/* Tables */}
                <div className="w-full">
                  {isAdmin ? <AdminLogsTable /> : <EmployeeHistoryTable />}
                </div>
              </div>

            </div>
          </div>
        </main>
      </ProtectedRoute>
    );
  }