import React from "react";
import "./ConfirmModal.css";

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirm-overlay">
      <div className="confirm-box">
        <h3>Confirm Action</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn" onClick={onConfirm}>Yes</button>
          <button className="cancel-btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
