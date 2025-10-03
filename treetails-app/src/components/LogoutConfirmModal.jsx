import React, { useState } from "react";
import "./LogoutConfirmModal.css";

const LogoutConfirmModal = ({ onConfirm, onCancel }) => {
  const [closing, setClosing] = useState(false);

  const handleCancel = () => {
    setClosing(true);
    setTimeout(onCancel, 300); // wait for fade-out
  };

  return (
    <div className={`logout-modal-overlay ${closing ? "fade-out" : ""}`}>
      <div className="logout-modal">
        <h3>Confirm Logout</h3>
        <p>Are you sure you want to log out?</p>
        <div className="logout-modal-actions">
          <button className="confirm-btn" onClick={onConfirm}>
            Yes, Logout
          </button>
          <button className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
