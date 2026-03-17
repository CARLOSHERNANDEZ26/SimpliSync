import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50 text-black">
      <h1 className="text-4xl font-bold mb-4">Welcome to SimpliSync</h1>
      
      <Link 
        href="/login" 
        className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md"
      >
        Log In
      </Link>
    </main>
  );
}