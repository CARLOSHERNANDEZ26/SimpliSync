import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "react-hot-toast";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: 'SimpliSync | %s',
    default: 'SimpliSync',
  },
  description: "SimpliSync HRMS Application",
};

import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({
  children,
}:
{
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased tracking-tight`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Toaster 
  position="top-center" 
  reverseOrder={false}
  toastOptions={{

    duration: 4000,
    
    className: "bg-white text-gray-900 dark:bg-[#151515] dark:text-white border border-gray-100 dark:border-white/10 shadow-2xl rounded-2xl font-semibold px-5 py-3.5 tracking-wide",
    
    success: {
      iconTheme: {
        primary: '#10b981', 
        secondary: '#ffffff',
      },
    },
    
    error: {
      iconTheme: {
        primary: '#f43f5e', 
        secondary: '#ffffff',
      },
    },
  }} 
/>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
