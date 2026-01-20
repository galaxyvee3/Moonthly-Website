import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaYm2yrrxROKVpiOGnHDkegKu9H_28Jys",
  authDomain: "moonthly-6bd9b.firebaseapp.com",
  projectId: "moonthly-6bd9b",
  storageBucket: "moonthly-6bd9b.firebasestorage.app",
  messagingSenderId: "784910931143",
  appId: "1:784910931143:web:f68e5d6bb88545bd901ae2"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);