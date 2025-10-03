import React, { useState, useEffect } from 'react';
// Import necessary Firebase functions for app initialization, authentication, and database access.
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy, setLogLevel } from 'firebase/firestore';

// Environment variables provided by the platform for Firebase configuration and app identification.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Define a simple enum for the tabs to prevent magic strings and improve readability.
const Tab = {
  HOME: 'home',
  MAP: 'map',
  PLANT: 'plant',
  COMMUNITY: 'community',
};

// Main App component
const App = () => {
  // State variables to manage the UI and data.
  const [activeTab, setActiveTab] = useState(Tab.HOME);
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [plants, setPlants] = useState([]);
  const [newPlantName, setNewPlantName] = useState('');
  
  // State variables for Firebase services and user authentication status.
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState('');
  const [isAuthReady, setIsAuthReady] = useState(false);

  // This useEffect hook runs once on component mount to initialize Firebase and handle user authentication.
  useEffect(() => {
    try {
      // Check if Firebase config is available before proceeding.
      if (Object.keys(firebaseConfig).length > 0) {
        setLogLevel('debug');
        // Initialize the Firebase app instance.
        const app = initializeApp(firebaseConfig);
        // Get the Firestore database and Auth service instances.
        const firestore = getFirestore(app);
        const authService = getAuth(app);
        
        // Store the initialized services in state for later use.
        setDb(firestore);
        setAuth(authService);
        
        // Use onAuthStateChanged to listen for authentication state changes.
        // This handles both initial sign-in and subsequent log-in/log-out events.
        const unsubscribe = onAuthStateChanged(authService, async (user) => {
          if (user) {
            // If a user is found, set the userId.
            setUserId(user.uid);
          } else {
            // If no user, attempt to sign in using the provided custom token.
            if (typeof __initial_auth_token !== 'undefined') {
              try {
                const userCredential = await signInWithCustomToken(authService, __initial_auth_token);
                setUserId(userCredential.user.uid);
              } catch (error) {
                console.error("Custom token sign-in failed. Signing in anonymously.", error);
                // Fallback to anonymous sign-in if the custom token fails.
                const anonymousUser = await signInAnonymously(authService);
                setUserId(anonymousUser.user.uid);
              }
            } else {
              // Sign in anonymously if no custom token is available.
              const anonymousUser = await signInAnonymously(authService);
              setUserId(anonymousUser.user.uid);
            }
          }
          // Mark authentication as ready once the initial check is complete.
          setIsAuthReady(true);
        });
        
        // Cleanup function to detach the listener when the component unmounts.
        return () => unsubscribe();
      }
    } catch (error) {
      console.error("Failed to initialize Firebase:", error);
    }
  }, []);

  // This useEffect hook listens for real-time updates to community posts.
  // It only runs once Firebase is initialized and authentication is ready.
  useEffect(() => {
    if (db && isAuthReady) {
      // Create a query to fetch documents from the public 'posts' collection, ordered by timestamp.
      const q = query(
        collection(db, `/artifacts/${appId}/public/data/posts`),
        orderBy('timestamp', 'desc')
      );
      
      // onSnapshot sets up a real-time listener that automatically
      // updates the 'posts' state whenever a change occurs in the database.
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const postsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(postsData);
      }, (error) => {
        console.error("Error fetching posts:", error);
      });
      
      // Cleanup function to stop listening when the component unmounts.
      return () => unsubscribe();
    }
  }, [db, isAuthReady]);

  // This useEffect hook listens for real-time updates to the user's private plant data.
  // It runs once Firebase is initialized and a userId is available.
  useEffect(() => {
    if (db && userId) {
      // Define the collection path for the current user's plants.
      const plantsRef = collection(db, `/artifacts/${appId}/users/${userId}/plants`);
      const q = query(plantsRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const plantsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPlants(plantsData);
      }, (error) => {
        console.error("Error fetching plants:", error);
      });
      return () => unsubscribe();
    }
  }, [db, userId]);

  // Function to handle adding a new community post to Firestore.
  const handlePostSubmit = async (e) => {
    e.preventDefault(); // Prevents the default form submission behavior (page reload).
    if (!newPostContent.trim() || !db) return; // Basic validation.

    try {
      // addDoc creates a new document with an automatically generated ID.
      await addDoc(collection(db, `/artifacts/${appId}/public/data/posts`), {
        content: newPostContent,
        authorId: userId,
        // serverTimestamp() adds a server-generated timestamp to ensure accurate timing.
        timestamp: serverTimestamp(),
      });
      setNewPostContent(''); // Clear the input field after successful post.
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  // Function to handle adding a new plant to the user's private collection.
  const handlePlantSubmit = async (e) => {
    e.preventDefault();
    if (!newPlantName.trim() || !db || !userId) return;

    try {
      await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/plants`), {
        name: newPlantName,
        stage: 1, // Stage 1: Seedling
        timestamp: serverTimestamp(),
      });
      setNewPlantName('');
    } catch (error) {
      console.error("Error adding plant: ", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.HOME:
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center h-full">
            <h1 className="text-4xl font-bold text-green-700 mb-4 font-inter">TreeTails</h1>
            <p className="text-gray-700 mb-6 font-inter">Join us in creating a greener and more compassionate Olongapo.</p>
            <div className="bg-white p-4 rounded-xl shadow-md font-inter max-w-sm w-full">
              <h2 className="text-2xl font-semibold mb-2 text-green-600">Our Mission</h2>
              <p className="text-gray-600 mb-4">
                This project combines tree planting with stray animal care to improve our city's environment and animal welfare.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-3xl mb-1">🌳</span>
                  <p className="text-sm font-medium text-green-800">Planting</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg flex flex-col items-center">
                  <span className="text-3xl mb-1">🐾</span>
                  <p className="text-sm font-medium text-orange-800">Stray Care</p>
                </div>
              </div>
            </div>
          </div>
        );
      case Tab.MAP:
        return (
          <div className="p-4 h-full flex flex-col font-inter">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Interactive Green Map</h2>
            <div className="flex-1 bg-gray-200 rounded-xl overflow-hidden shadow-md mb-4">
              <iframe
                title="Olongapo Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15416.326269382195!2d120.27964147424614!3d14.821941655611108!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x339660c1d686f0ff%3A0x673c6838a1656f7e!2sOlongapo%20City%2C%20Zambales!5e0!3m2!1sen!2sph!4v1701546252981!5m2!1sen!2sph"
                width="100%"
                height="100%"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="flex justify-between gap-2">
              <button className="flex-1 bg-green-500 text-white font-semibold py-3 px-4 rounded-full shadow-lg hover:bg-green-600 transition-colors">
                📍 Planting Spots
              </button>
              <button className="flex-1 bg-orange-500 text-white font-semibold py-3 px-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors">
                🐾 Feeding Spots
              </button>
            </div>
          </div>
        );
      case Tab.PLANT:
        return (
          <div className="p-4 h-full flex flex-col font-inter">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Plant Growth Tracker</h2>
            <form onSubmit={handlePlantSubmit} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="Enter plant name (e.g., 'Mango Tree')"
                className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button type="submit" className="bg-green-500 text-white font-semibold px-4 rounded-full shadow-lg hover:bg-green-600 transition-colors">
                Add
              </button>
            </form>
            <div className="flex-1 overflow-y-auto">
              {plants.length > 0 ? (
                plants.map((plant) => (
                  <div key={plant.id} className="bg-white p-4 rounded-xl shadow-sm mb-3 font-inter flex items-center gap-4">
                    <span className="text-4xl">
                      {plant.stage === 1 ? '🌱' : plant.stage === 2 ? '🌿' : '🌳'}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-green-800">{plant.name}</p>
                      <p className="text-sm text-gray-500">Stage: {plant.stage === 1 ? 'Seedling' : plant.stage === 2 ? 'Sapling' : 'Tree'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 mt-8">No plants added yet. Start planting!</p>
              )}
            </div>
          </div>
        );
      case Tab.COMMUNITY:
        return (
          <div className="p-4 h-full flex flex-col font-inter">
            <h2 className="text-2xl font-bold text-green-700 mb-4">Community Collaboration</h2>
            <form onSubmit={handlePostSubmit} className="flex gap-2 mb-4">
              <input
                type="text"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your experience..."
                className="flex-1 p-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <button type="submit" className="bg-green-500 text-white font-semibold px-4 rounded-full shadow-lg hover:bg-green-600 transition-colors">
                Post
              </button>
            </form>
            <div className="flex-1 overflow-y-auto space-y-3">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm font-inter">
                    <p className="text-gray-700 mb-2">{post.content}</p>
                    <div className="text-xs text-gray-400">
                      <p>
                        <span className="font-semibold">User:</span> {post.authorId}
                      </p>
                      <p>
                        <span className="font-semibold">Date:</span> {post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 mt-8">No community posts yet. Be the first to share!</p>
              )}
            </div>
            {userId && (
              <p className="text-xs text-center text-gray-400 mt-4">
                Your User ID: <span className="font-mono text-gray-600 break-all">{userId}</span>
              </p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-green-100 p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm h-[80vh] flex flex-col overflow-hidden border-4 border-gray-200">
        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
        <nav className="flex justify-around bg-green-800 p-3 rounded-b-3xl shadow-inner">
          <button
            onClick={() => setActiveTab(Tab.HOME)}
            className={`flex-1 flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === Tab.HOME ? 'text-white' : 'text-green-300 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs font-medium mt-1">Home</span>
          </button>
          <button
            onClick={() => setActiveTab(Tab.MAP)}
            className={`flex-1 flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === Tab.MAP ? 'text-white' : 'text-green-300 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium mt-1">Map</span>
          </button>
          <button
            onClick={() => setActiveTab(Tab.PLANT)}
            className={`flex-1 flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === Tab.PLANT ? 'text-white' : 'text-green-300 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13a6 6 0 00-6 6v3.586a1 1 0 01-.293.707l-4.243 4.243A1 1 0 002.586 21H21.414a1 1 0 00.707-1.707l-4.243-4.243a1 1 0 01-.293-.707V14a6 6 0 00-6-6z" />
            </svg>
            <span className="text-xs font-medium mt-1">Plant</span>
          </button>
          <button
            onClick={() => setActiveTab(Tab.COMMUNITY)}
            className={`flex-1 flex flex-col items-center p-2 rounded-lg transition-colors ${
              activeTab === Tab.COMMUNITY ? 'text-white' : 'text-green-300 hover:text-white'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h-3V10h3l1-4H12L11 4h2a2 2 0 002-2h-4a2 2 0 00-2 2H3a2 2 0 002 2h3a2 2 0 002-2h2.5L12 10v10h-2m-8 0h14" />
            </svg>
            <span className="text-xs font-medium mt-1">Community</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default App;
