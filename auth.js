// auth.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { notes, buildCalendar, currentYear, currentMonth, loadTodos } from "./index.js";

// --- Elements ---
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const status = document.getElementById("authStatus");

// --- Login ---
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    console.error(err);
    status.textContent = "Login failed: " + err.message;
  }
});

// --- Signup ---
signupBtn.addEventListener("click", async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    // Create empty Firestore document for new user
    await setDoc(doc(db, "users", userCredential.user.uid), {
      calendarNotes: {},
      todoList: [],
      updatedAt: Date.now()
    });
  } catch (err) {
    console.error(err);
    status.textContent = "Sign up failed: " + err.message;
  }
});

// --- Logout ---
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    status.textContent = "Logged out";
  } catch (err) {
    console.error(err);
  }
});

// --- Auth state change ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    status.textContent = "Logged in as " + user.email;
    logoutBtn.hidden = false;
    // Load user's notes & todos from Firestore
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.calendarNotes) {
          Object.assign(notes, data.calendarNotes); // update the exported notes object
          localStorage.setItem("calendarNotes", JSON.stringify(notes));
        }
        if (data.todoList) {
          localStorage.setItem("todoList", JSON.stringify(data.todoList));
          loadTodos();
        }
      }
    } catch (err) {
      console.error("Error loading user data:", err);
    }
    // Refresh calendar with notes
    buildCalendar(currentYear, currentMonth);
  } else {
    // Not logged in
    status.textContent = "Offline";
    logoutBtn.hidden = true;
    // Optionally clear notes/todos from calendar view
    buildCalendar(currentYear, currentMonth);
    loadTodos();
  }
});