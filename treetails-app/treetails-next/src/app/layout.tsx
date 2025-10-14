
"use client";

import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext"; 
import Link from "next/link"; 
import Header from "@/components/Header.jsx";
import { MapProvider } from "@/context/MapContext";
import "@/app/styles/App.css";


function BottomNav() {
    const { user } = useAuth();
    const [hideNav, setHideNav] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

   
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 80) {
                setHideNav(true);
            } else {
                setHideNav(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);
    
    // Only show the navigation if the user is logged in
    if (!user) return null;

    return (
        // The nav structure from your old App.jsx
        <nav className={`bottom-nav ${hideNav ? "hidden" : ""}`}>
            {/* The NavLink logic is replaced by Next.js <Link> and a custom active check */}
            <Link href="/my-plants" className="nav-link">
                🌱<br /><span>Plant</span>
            </Link>
            <Link href="/green-map" className="nav-link">
                🗺️<br /><span>Map</span>
            </Link>
            <Link href="/feeding-spots" className="nav-link">
                🐾<br /><span>Feeding</span>
            </Link>
            <Link href="/community-posts" className="nav-link">
                👥<br /><span>Community</span>
            </Link>
        </nav>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <MapProvider>
            {/* Header is already here */}
            <Header /> 
            
            <main className="content-area">{children}</main>
            
            {/* 💡 RENDER THE NEW BOTTOM NAV HERE */}
            <BottomNav />
            
          </MapProvider>
        </AuthProvider>
      </body>
    </html>
  );
}