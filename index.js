import { auth, db } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// Save new user notes to cloud
async function syncNotesToCloud() {
  if (!auth.currentUser) return;
  await setDoc(doc(db, "users", auth.currentUser.uid), {
    calendarNotes: notes,
    todoList: JSON.parse(localStorage.getItem("todoList")) || {},
    updatedAt: Date.now()
  });
}
// Load user notes from cloud
async function loadFromCloud() {
  if (!auth.currentUser) return;
  const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
  if (!snap.exists()) return;
  const data = snap.data();
  if (data.calendarNotes) {
    notes = data.calendarNotes;
    localStorage.setItem("calendarNotes", JSON.stringify(notes));
  }
  if (data.todoList) {
    localStorage.setItem("todoList", JSON.stringify(data.todoList));
    loadTodos();
  }
  buildCalendar(currentYear, currentMonth);
}
// User logged into their account
onAuthStateChanged(auth, async (user) => {
  if (user) {
    authStatus.textContent = "Logged in";
    logoutBtn.hidden = false;
    await syncNotesToCloud();
    await loadFromCloud();
  } else {
    authStatus.textContent = "Offline / not logged in";
    logoutBtn.hidden = true;
  }
});

const calendar = document.getElementById('calendar');
const modal = document.getElementById('noteModal');
const modalDate = document.getElementById('modalDate');
const noteText = document.getElementById('noteText');
const monthLabel = document.getElementById('monthLabel');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const monthSelect = document.getElementById('monthSelect');
const yearInput = document.getElementById('yearInput');
const goToDateBtn = document.getElementById('goToDate');
let selectedDate = null;
// Initial notes are empty
let notes = {};
// Track current view
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
// Month names
const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
// Populate the month dropdown once
monthNames.forEach((m, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = m;
  monthSelect.appendChild(opt);
});
function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  calendar.innerHTML = "";
  // Update month label
  monthLabel.textContent = `${monthNames[month]} ${year}`;
  // Keep jump-to controls in sync
  monthSelect.value = month;
  yearInput.value = year;
  // Blank spaces before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    calendar.appendChild(empty);
  }
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.classList.add('day');
    // Top: the day number
    const dayNum = document.createElement('div');
    dayNum.textContent = d;
    dayNum.style.fontWeight = "bold";
    // Bottom: note preview (if exists)
    const notePreview = document.createElement('div');
    const dateKey = `${year}-${month + 1}-${d}`;
    if (notes[dateKey]) {
      const lines = notes[dateKey].split("\n").filter(line => line.trim() !== "");
      const ul = document.createElement("ul");
      ul.classList.add("note-preview");
      lines.forEach(line => {
        const li = document.createElement("li");
        li.textContent = line;
        ul.appendChild(li);
      });
      notePreview.appendChild(ul);
    }
    cell.appendChild(dayNum);
    cell.appendChild(notePreview);
    // Open modal on click
    cell.addEventListener('click', () => {
      selectedDate = dateKey;
      modalDate.innerText = `Notes for ${selectedDate}`;
      noteText.value = notes[selectedDate] || "";
      modal.style.display = 'block';
    });
    calendar.appendChild(cell);
  }
}
// Save note
document.getElementById('saveNote').addEventListener('click', async () => {
  // Dont save if user is not logged in 
  if (!auth.currentUser) {
    alert("Please log in to save notes.");
    modal.style.display = 'none';
    return;
  }
  if (selectedDate) {
    notes[selectedDate] = noteText.value;
    localStorage.setItem('calendarNotes', JSON.stringify(notes));
    await setDoc(doc(db, "users", auth.currentUser.uid), { calendarNotes: notes }, { merge: true });
    buildCalendar(currentYear, currentMonth);
  }
  modal.style.display = 'none';
});
// Delete note
document.getElementById('deleteNote').addEventListener('click', async () => {
  // Dont delete if user is not logged in 
  if (!auth.currentUser) {
    alert("Login to delete notes");
    modal.style.display = 'none';
    return;
  }
  if (selectedDate) {
    delete notes[selectedDate];
    localStorage.setItem('calendarNotes', JSON.stringify(notes));
    await setDoc(doc(db, "users", auth.currentUser.uid), { calendarNotes: notes }, { merge: true });
    buildCalendar(currentYear, currentMonth);
  }
  modal.style.display = 'none';
});
// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
  modal.style.display = 'none';
});
// Navigation
prevMonthBtn.addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  buildCalendar(currentYear, currentMonth);
});
nextMonthBtn.addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  buildCalendar(currentYear, currentMonth);
});
// Jump-to event
goToDateBtn.addEventListener('click', () => {
  const selectedMonth = parseInt(monthSelect.value);
  const selectedYear = parseInt(yearInput.value);
  if (!isNaN(selectedMonth) && !isNaN(selectedYear)) {
    currentMonth = selectedMonth;
    currentYear = selectedYear;
    buildCalendar(currentYear, currentMonth);
  }
});
// Build initial calendar
buildCalendar(currentYear, currentMonth);
// To-do list
const toggleButton = document.getElementById('todo-toggle');
const todoContainer = document.getElementById('todo-container');
const addButton = document.getElementById('add-todo');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
// Toggle the to-do panel
toggleButton.addEventListener('click', () => {
  todoContainer.style.display = todoContainer.style.display === 'flex' ? 'none' : 'flex';
});
// Add new task function
function addTask(taskText, done = false) {
  const li = document.createElement('li');
  const checkbox = document.createElement('input');
  checkbox.type = "checkbox";
  checkbox.checked = done;
  const textNode = document.createTextNode(" " + taskText);
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'delete-btn';
  deleteBtn.textContent = "✕";
  checkbox.addEventListener('change', () => {
    li.classList.toggle('completed', checkbox.checked);
    saveTodos();
  });
  deleteBtn.addEventListener('click', () => {
    li.remove();
    saveTodos();
  });
  li.appendChild(checkbox);
  li.appendChild(textNode);
  li.appendChild(deleteBtn);
  if (done) li.classList.add('completed');
  list.appendChild(li);
  saveTodos();
}
// Add new task on button click
addButton.addEventListener('click', () => {
  if(input.value.trim() !== "") {
    addTask(input.value);
    input.value = "";
  }
});
// Add task on Enter key
input.addEventListener('keydown', (e) => {
  if(e.key === 'Enter') addButton.click();
});
// Add delete functionality to existing tasks
document.querySelectorAll('.delete-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.remove();
  });
});
// --- To-Do List Persistence ---
// Save all tasks to localStorage
function saveTodos() {
  const todos = [];
  list.querySelectorAll('li').forEach(li => {
    const checkbox = li.querySelector('input[type="checkbox"]');
    const text = li.childNodes[1].textContent.trim(); // task text
    todos.push({
      text: text,
      done: checkbox.checked
    });
  });
  localStorage.setItem('todoList', JSON.stringify(todos));
  syncNotesToCloud();
}
// Load tasks from localStorage
function loadTodos() {
  const saved = localStorage.getItem('todoList');
  if (!saved) return;
  const todos = JSON.parse(saved);
  list.innerHTML = ""; // clear existing
  todos.forEach(todo => addTask(todo.text, todo.done));
}
// Load saved to-dos on startup
window.addEventListener('DOMContentLoaded', loadTodos);
// animate image
const img = document.getElementById("animated");
const images = [ "assets/Moon1.png", "assets/Moon2.png", "assets/Moon5.png", "assets/Moon6.png", "assets/Moon9.png", "assets/Moon10.png", "assets/Moon5.png", "assets/Moon6.png", "assets/Moon3.png", "assets/Moon4.png", "assets/Moon7.png", "assets/Moon8.png", "assets/Moon11.png", "assets/Moon12.png", "assets/Moon7.png", "assets/Moon8.png" ]; // images to switch
let index = 0;
setInterval(() => { // switch to next image
  index = (index + 1) % images.length;
  img.src = images[index];
}, 500); // switch image every 500ms

// Export everything needed for auth.js
export { buildCalendar, loadTodos, notes, currentYear, currentMonth };