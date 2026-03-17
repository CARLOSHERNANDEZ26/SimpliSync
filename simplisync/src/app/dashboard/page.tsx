"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <ProtectedRoute>
   
          <h1 className="text-3xl font-bold mb-4">HR Dashboard</h1>
          
          {/* This proves the global memory is working! */}
          <p className="mb-6 text-gray-600">
            Welcome back, <span className="font-semibold text-blue-600">{user?.email}</span>
          </p>

          <button 
            onClick={handleLogout}
          >
            Log Out
          </button>
        
    </ProtectedRoute>
  );
}