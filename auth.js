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
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

// Login button
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    status.textContent = "Logged in!";
  } catch (err) {
    status.textContent = err.message;
    console.error(err);
  }
};

// Signup button
signupBtn.onclick = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    status.textContent = "Account created!";
  } catch (err) {
    status.textContent = err.message;
    console.error(err);
  }
};

// Logout button
logoutBtn.onclick = async () => {
  try {
    await signOut(auth);
    status.textContent = "Logged out!";
  } catch (err) {
    status.textContent = err.message;
    console.error(err);
  }
};

// Show login state
onAuthStateChanged(auth, (user) => {
  if (user) {
    status.textContent = `Logged in as ${user.email}`;
    logoutBtn.hidden = false;
  } else {
    status.textContent = "Offline / not logged in";
    logoutBtn.hidden = true;
  }
});