"use client";

import { useEffect, useState } from "react";
import { loginEmployee } from "@/services/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const loginIdentifier = email.includes("@") ? email : `${email.replace(/\s+/g, '').toLowerCase()}@simplisync.local`;
      await loginEmployee(loginIdentifier, password);
      toast.success("Logged in successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      const isAuthError = 
        error.code === "auth/invalid-credential" || 
        error.code === "auth/user-not-found" || 
        error.code === "auth/wrong-password" ||
        error.message?.includes("Invalido");

      const errorText = isAuthError
        ? "Invalid email or password. Please try again."
        : "An unexpected error occurred. Please try again.";

      setErrorMsg(errorText);
      toast.error(errorText);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center relative overflow-hidden font-sans transition-colors duration-500">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/30 dark:bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[28rem] h-[28rem] bg-emerald-400/20 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 bg-white/70 dark:bg-[#131a2e]/60 backdrop-blur-2xl border border-gray-200 dark:border-teal-500/10 rounded-3xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] transition-all duration-500">

        {/* Logo Section */}
        <div className="flex flex-col items-center justify-center mb-10">
          <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
            <Image 
              src="/simplifvlogo.png" 
              alt="SimplifV Logo" 
              fill 
              priority 
              className="object-contain" 
              sizes="96px" 
            />
          </div>
          <h1 className="text-3xl font-light tracking-widest text-gray-900 dark:text-slate-100 mt-2 transition-colors">
            Simpli<span className="font-semibold text-teal-600 dark:text-teal-400">Sync</span>
          </h1>
          <p className="text-gray-600 dark:text-slate-400 text-sm mt-2 tracking-wide transition-colors">Enterprise Synchronization</p>
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium text-center animate-pulse transition-colors">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider ml-1 transition-colors">Name or Email Address</label>
            <div className="relative group">
              <input
                type="text"
                placeholder="juandelacruz or name@simplisync.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white dark:bg-[#0b0f19]/40 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 shadow-sm dark:shadow-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider transition-colors">Password</label>
            </div>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white dark:bg-[#0b0f19]/40 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-600 rounded-xl px-4 py-3.5 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500/30 dark:focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-300 shadow-sm dark:shadow-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-md focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 w-full bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-semibold py-3.5 rounded-xl shadow-[0_4px_14px_0_rgba(20,184,166,0.39)] hover:shadow-[0_6px_20px_rgba(20,184,166,0.23)] dark:shadow-[0_0_20px_rgba(20,184,166,0.3)] dark:hover:shadow-[0_0_30px_rgba(20,184,166,0.5)] transform hover:-translate-y-0.5 transition-all duration-300 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-slate-500 transition-colors">
            Secure login provided by <span className="text-gray-700 dark:text-slate-400 font-medium">SimpliSync Auth</span>
          </p>
        </div>
      </div>
    </main>
  );
}