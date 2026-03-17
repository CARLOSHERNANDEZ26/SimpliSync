    "use client";

    import { useEffect } from "react";
    import { useRouter } from "next/navigation"; 
    import { useAuth } from "@/hooks/useAuth"; // Your global memory!

    export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
        router.push("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-gray-600">Checking credentials...</p>
      </div>
    }

    if (!user) {
        return null; 
    }


    return <>{children}</>;
    }