
"use client";

import React, { useState } from "react";
import Link from "next/link"; 
import { useRouter } from "next/navigation"; 
import { useAuth } from "@/context/AuthContext";
import "@/app/styles/Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  
  const router = useRouter(); 

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/"); 
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <h1>TreeTails</h1>
        <p>Plant. Share. Grow.</p>
      </div>

      {/* Static burger button on main header */}
      <div
        className="burger"
        onClick={() => setMenuOpen(true)}
      >
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>

      {/* Sidebar overlay */}
      <div
        className={`sidebar-overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
      ></div>

      {/* Sidebar menu (slides in from LEFT) */}
      <aside className={`sidebar left ${menuOpen ? "open" : ""}`}>
        {/* Animated burger/X inside sidebar */}
        <div
          className={`sidebar-burger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(false)}
        >
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>

        {/* 👤 User Section */}
        <div className="sidebar-user">
          <img
            src="/images/logo192.png"
            alt="User Avatar"
            className="sidebar-avatar"
          />
          <p className="sidebar-username">
            👋 Hi, {user?.name || "Tree Enthusiast"}
          </p>
        </div>

        <hr className="sidebar-divider" />

        {/* Links */}
        <nav className="sidebar-links">
          {/* 💡 Replace NavLink with Next.js Link. Use 'href' instead of 'to'. */}
          <Link
  href="/profile"
  onClick={() => setMenuOpen(false)}
  passHref
>
  👤 Profile
</Link>

          <button onClick={handleLogout}>🚪<b>Logout</b> </button>
        </nav>
      </aside>
    </header>
  );
};

export default Header;