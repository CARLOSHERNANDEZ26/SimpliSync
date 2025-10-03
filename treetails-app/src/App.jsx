import React from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import Header from "./components/Header";
import MyPlants from "./pages/MyPlants";
import CommunityPosts from "./pages/CommunityPosts";
import FeedingSpots from "./pages/FeedingSpots";
import "./App.css";

const Home = () => (
  <div className="home-page">
    <h2>Welcome to TreeTails</h2>
    <p>Help us grow a greener community by planting and sharing!</p>
  </div>
);

const MapPage = () => (
  <div>
    <h2>Map Page</h2>
    <p>This is where the planting locations will appear later.</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        {/* NEW: Wrapper for all content that should be max-width/centered */}
        <div className="content-area"> 
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/my-plants" element={<MyPlants />} />
              <Route path="/community" element={<CommunityPosts />} />
              <Route path="/feeding-spots" element={<FeedingSpots />} />
            </Routes>
        </div>
    
      <nav className="bottom-nav"> 
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active-nav-link' : '')}>🏠<br></br> <span>Home</span></NavLink>
          <NavLink to="/map" className={({isActive}) =>(isActive ? 'active-nav-link' : '')}>🗺️<br></br> <span>Map</span></NavLink>
          <NavLink to="/my-plants" className={({isActive}) => (isActive ? 'active-nav-link' : '')}>🌱<br></br> <span>Plant</span></NavLink>
          <NavLink 
            to="/community" 
            className={({ isActive }) => (isActive ? 'active-nav-link' : '')}
          >👥 <br></br><span>Community</span></NavLink>
          <NavLink 
            to="/feeding-spots" 
            className={({ isActive }) => (isActive ? 'active-nav-link' : '')}> 🐾<br /><span>Feeding</span></NavLink>
        </nav>
      </div>


    </Router>
  );
}

export default App;
