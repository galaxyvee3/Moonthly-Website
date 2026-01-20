import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const status = document.getElementById("authStatus");
const logoutBtn = document.getElementById("logoutBtn");

loginBtn.onclick = () =>
  signInWithEmailAndPassword(auth, email.value, password.value);

signupBtn.onclick = () =>
  createUserWithEmailAndPassword(auth, email.value, password.value);

logoutBtn.onclick = () => signOut(auth);

// expose auth state globally
window.onAuthStateChanged = onAuthStateChanged;
window.authStatus = status;
window.logoutBtn = logoutBtn;