import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// You can add getFirestore later when we do the attendance logs!

export const firebaseConfig = {
  apiKey: "AIzaSyDaALq9GGgLHiNBiuIQeohIKw_YQ0qzdJs",
  authDomain: "simplisync-2925f.firebaseapp.com",
  projectId: "simplisync-2925f",
  storageBucket: "simplisync-2925f.firebasestorage.app",
  messagingSenderId: "612112669566",
  appId: "1:612112669566:web:4d5a90de52b51958d3712f",
  measurementId: "G-EPWRYFM66S"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);

export { app, auth };
export const db = getFirestore(app);