// auth.js
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { notes, buildCalendar, currentYear, currentMonth, loadTodos } from "./index.js";

const email = document.getElementById("email");
const password = document.getElementById("password");
const status = document.getElementById("authStatus");
const logoutBtn = document.getElementById("logoutBtn");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");

loginBtn.onclick = () => signInWithEmailAndPassword(auth,email.value,password.value)
  .catch(err=>status.textContent=err.message);
signupBtn.onclick = () => createUserWithEmailAndPassword(auth,email.value,password.value)
  .catch(err=>status.textContent=err.message);
logoutBtn.onclick = () => signOut(auth);

// Load Firestore notes/todos
async function loadFromCloud(user){
  const snap = await getDoc(doc(db,"users",user.uid));
  if(snap.exists()){
    const data = snap.data();
    if(data.calendarNotes){ Object.assign(notes,data.calendarNotes); localStorage.setItem("calendarNotes",JSON.stringify(notes)); }
    if(data.todoList){ localStorage.setItem("todoList",JSON.stringify(data.todoList)); loadTodos(); }
  }
  buildCalendar(currentYear,currentMonth);
}

// Listen for login state
onAuthStateChanged(auth, async (user)=>{
  if(user){
    status.textContent=`Logged in as ${user.email}`;
    logoutBtn.hidden=false;
    await loadFromCloud(user);
  } else {
    status.textContent="Offline / not logged in";
    logoutBtn.hidden=true;
    for(const k in notes) delete notes[k];
    localStorage.removeItem("calendarNotes");
    localStorage.removeItem("todoList");
    buildCalendar(currentYear,currentMonth);
    loadTodos();
  }
});