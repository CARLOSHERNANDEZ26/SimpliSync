// Header.jsx

import React from "react";
import "./Header.css";

const Header = () => {
  return (
    <header>
      {/* NEW: Add a wrapper for the content and give it a class for styling */}
      <div className="main-header">
        {/* PUT THE CONTENT HERE: */}
        <h1>TreeTails</h1>
        <p>Join us in creating a greener and kinder Olongapo!</p>
        {/* END OF CONTENT */}
      </div>
    </header>
  );
};

export default Header;