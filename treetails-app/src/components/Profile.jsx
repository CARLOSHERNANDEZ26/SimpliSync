import React, { useState } from "react";
import "./Profile.css";

const Profile = () => {
  // Local state for editable fields
  const [name, setName] = useState("Tree Enthusiast");
  const [bio, setBio] = useState("Lover of all things green and leafy!");
  const [editing, setEditing] = useState(false);

  // Static prototype data
  const avatarUrl = "/logo192.png";
  const favoritePlant = "Monstera Deliciosa";
  const plantCount = 7;
  const postsCount = 12;
  const badges = ["Sprout", "Community Helper", "Plant Parent"];

  const handleSave = () => {
    setEditing(false);
  };

  return (
    <div className="profile-prototype">
      <img src={avatarUrl} alt="Avatar" className="profile-avatar" />
      {editing ? (
        <>
          <input value={name} onChange={e => setName(e.target.value)} />
          <textarea value={bio} onChange={e => setBio(e.target.value)} />
          <button onClick={handleSave}>Save</button>
        </>
      ) : (
        <>
          <h2>{name}</h2>
          <p>{bio}</p>
          <button onClick={() => setEditing(true)}>Edit</button>
        </>
      )}
      <div className="profile-stats">
        <div><strong>Favorite Plant:</strong> {favoritePlant}</div>
        <div><strong>My Plants:</strong> {plantCount}</div>
        <div><strong>Community Posts:</strong> {postsCount}</div>
      </div>
      <div className="profile-badges">
        <strong>Badges:</strong>
        {badges.map(badge => (
          <span key={badge} className="profile-badge">{badge}</span>
        ))}
      </div>
    </div>
  );
};

export default Profile;
