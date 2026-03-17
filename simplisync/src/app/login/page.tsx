"use client";

import { useState } from "react";
import { loginEmployee } from "@/services/auth"; // Your custom backend tool!
import { useRouter } from "next/navigation"; // We need this to teleport the user

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setErrorMsg(""); 

    try {
    
      await loginEmployee(email, password);
     
      router.push("/dashboard");

    } catch (error) {
      const authError = error as Error;
      setErrorMsg(authError.message);
    }
  };

  return (
    <main className="">
      <div className="">
        <h1 className="">SimpliSync Login</h1>
        
        {/* Your backend error messages will appear here in red */}
        {errorMsg && <p className="text-red-500 text-sm mb-4 text-center font-semibold">{errorMsg}</p>}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email (e.g. admin@simplisync.local)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded focus:outline-blue-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded focus:outline-blue-500"
            required
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold transition">
            Sign In
          </button>
        </form>
      </div>
    </main>
  );
}