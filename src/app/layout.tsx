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
                className: '!bg-[#fff] dark:!bg-[#1c1c1e] !text-black dark:!text-white !rounded-[24px] !shadow-[0_8px_30px_rgb(0,0,0,0.12)] !font-semibold !px-6 !py-4 !border !border-gray-100 dark:!border-white/10 !backdrop-blur-none',
                style: {
                  background: 'transparent',
                  color: 'inherit',
                  boxShadow: 'none',
                }
              }}
            />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
