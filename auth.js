import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { buildCalendar, loadTodos, notes, currentYear, currentMonth } from "./index.js"; // import your calendar helpers

const email = document.getElementById("email");
const password = document.getElementById("password");
const status = document.getElementById("authStatus");
const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

loginBtn.onclick = () => signInWithEmailAndPassword(auth, email.value, password.value)
  .catch(err => status.textContent = err.message);

signupBtn.onclick = () => createUserWithEmailAndPassword(auth, email.value, password.value)
  .catch(err => status.textContent = err.message);

logoutBtn.onclick = () => signOut(auth);

// Load Firestore notes & todos
async function loadFromCloud(user) {
  const snap = await getDoc(doc(db, "users", user.uid));
  if (snap.exists()) {
    const data = snap.data();
    if (data.calendarNotes) {
      Object.assign(notes, data.calendarNotes); // update notes object
      localStorage.setItem("calendarNotes", JSON.stringify(notes));
    }
    if (data.todoList) {
      localStorage.setItem("todoList", JSON.stringify(data.todoList));
      loadTodos();
    }
  }
  buildCalendar(currentYear, currentMonth); // refresh calendar after notes loaded
}

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    status.textContent = `Logged in as ${user.email}`;
    logoutBtn.hidden = false;

    await loadFromCloud(user); // ensures calendar & todos show even after refresh
  } else {
    status.textContent = "Offline / not logged in";
    logoutBtn.hidden = true;

    // Clear notes & todos (optional: keep offline ones)
    for (const key in notes) delete notes[key];
    localStorage.removeItem("calendarNotes");
    localStorage.removeItem("todoList");

    buildCalendar(currentYear, currentMonth); // show blank calendar
    loadTodos();                               // show empty todo list
  }
});