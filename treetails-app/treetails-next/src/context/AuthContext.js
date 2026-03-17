import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // 1. Initialize user state to null. The browser check is deferred to useEffect.
  const [user, setUser] = useState(null);
  
  // New state to track if the client-side localStorage check is done
  const [loading, setLoading] = useState(true); 

  // 2. Use useEffect to access localStorage only on the client
  useEffect(() => {
    // This code only runs in the browser, after the component has mounted
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    } finally {
      setLoading(false); // Mark loading as complete
    }
  }, []);

  const login = (username, password) => {
    const prototypePassword = "treetails123";

    if (password === prototypePassword) {
      const newUser = { name: username };
      setUser(newUser);
      // It is safe to use localStorage here because this function is called on the client
      localStorage.setItem("user", JSON.stringify(newUser)); 
      return true; // login success
    } else {
      return false; // invalid password
    }
  };

  const logout = () => {
    setUser(null);
    
    localStorage.removeItem("user");
  };

  
  if (loading) {
     
     return <div>Loading authentication...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);