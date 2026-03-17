
"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation"; 
import "@/app/styles/login.css"; 

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { user, login } = useAuth();
  
  const router = useRouter(); 

  useEffect(() => {
    if (user) {
    
      router.replace("/my-plants"); 
    }
   
  }, [user, router]); 

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (username.trim() && password.trim()) {
    const success = login(username, password);
    if (success) {
      router.push("/my-plants");
    } else {
      setError("Invalid password. Try again.");
    }
  } else {
    setError("Please enter both username and password.");
  }
};

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <p className="login-footer">🌱 Grow with us at TreeTails</p>
      </div>
    </div>
  );
};

export default LoginPage;