import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Profile from "./components/Profile";
import MyPlants from "./pages/MyPlants";
import CommunityPosts from "./pages/CommunityPosts";
import FeedingSpots from "./pages/FeedingSpots";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LogInPage";
import LogoutConfirmModal from "./components/LogoutConfirmModal";  // ✅ import
import "./App.css";
import GreenMap from "./pages/GreenMap";
import { MapProvider } from "./context/MapContext";

function AppContent() {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="App">
      <Header />
      <div className="content-area">
        <Routes>
          <Route path="/" element={<h2>Welcome to TreeTails</h2>} />
          <Route path="/map" element={<GreenMap/>} />
          <Route path="/my-plants" element={<MyPlants />} />
          <Route path="/community" element={<CommunityPosts />} />
          <Route path="/feeding-spots" element={<FeedingSpots />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>

      {/* Bot Navvv */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => (isActive ? "active-nav-link" : "")}>🏠<br /><span>Home</span></NavLink>
        <NavLink to="/map" className={({ isActive }) => (isActive ? "active-nav-link" : "")}>🗺️<br /><span>Map</span></NavLink>
        <NavLink to="/my-plants" className={({ isActive }) => (isActive ? "active-nav-link" : "")}>🌱<br /><span>Plant</span></NavLink>
        <NavLink to="/community" className={({ isActive }) => (isActive ? "active-nav-link" : "")}>👥<br /><span>Community</span></NavLink>
  <NavLink to="/feeding-spots" className={({ isActive }) => (isActive ? "active-nav-link" : "")}>🐾<br /><span>Feeding</span></NavLink>
  <NavLink to="/profile" className={({ isActive }) => (isActive ? "active-nav-link" : "")}>👤<br /><span>Profile</span></NavLink>

        {/* Logout triggers modal */}
        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>
          🚪<br /> <span>Logout</span>
        </button>
      </nav>

      {/* Custom Logout Modal */}
      {showLogoutModal && (
        <LogoutConfirmModal
          onConfirm={() => {
            logout();
            setShowLogoutModal(false);
          }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MapProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Router>
      </MapProvider>    
    </AuthProvider>
  );
}

export default App;
