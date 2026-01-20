// index.js
import { auth, db } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Global state
export let notes = {}; // empty before login
export let currentYear = new Date().getFullYear();
export let currentMonth = new Date().getMonth();
let selectedDate = null;

// Elements
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

// To-do elements
const toggleButton = document.getElementById('todo-toggle');
const todoContainer = document.getElementById('todo-container');
const addButton = document.getElementById('add-todo');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');

// Month names
const monthNames = [ "January","February","March","April","May","June","July","August","September","October","November","December"];
monthNames.forEach((m, i) => {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = m;
  monthSelect.appendChild(opt);
});

// Build calendar
export function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  calendar.innerHTML = "";
  monthLabel.textContent = `${monthNames[month]} ${year}`;
  monthSelect.value = month;
  yearInput.value = year;
  for (let i = 0; i < firstDay; i++) calendar.appendChild(document.createElement('div'));
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.classList.add('day');
    const dayNum = document.createElement('div'); dayNum.textContent = d; dayNum.style.fontWeight="bold";
    const notePreview = document.createElement('div');
    const dateKey = `${year}-${month+1}-${d}`;
    if (
      typeof notes[dateKey] === "string" &&
      notes[dateKey].trim().length > 0
    ) {
      const ul = document.createElement("ul");
      ul.classList.add("note-preview");
      notes[dateKey]
        .split("\n")
        .filter(line => line.trim() !== "")
        .forEach(line => {
          const li = document.createElement("li");
          li.textContent = line;
          ul.appendChild(li);
        });
      notePreview.appendChild(ul);
    }
    cell.appendChild(dayNum);
    cell.appendChild(notePreview);
    cell.addEventListener('click', () => {
      selectedDate = dateKey;
      modalDate.innerText = `Notes for ${selectedDate}`;
      noteText.value = notes[selectedDate] || "";
      modal.style.display = 'block';
    });
    calendar.appendChild(cell);
  }
}

// Save and delete notes
document.getElementById('saveNote').addEventListener('click', async () => {
  if (!selectedDate) return;
  const text = noteText.value.trim();
  if (text === "") {
    delete notes[selectedDate];
  } else {
    notes[selectedDate] = text;
  }
  localStorage.setItem('calendarNotes', JSON.stringify(notes));
  buildCalendar(currentYear, currentMonth);
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { calendarNotes: notes }, { merge: true });
    } catch (err) {
      console.error("Error syncing notes to Firestore:", err);
    }
  }
  modal.style.display = 'none';
});

document.getElementById('deleteNote').addEventListener('click', async () => {
  if (!selectedDate) return;
  delete notes[selectedDate];
  localStorage.setItem('calendarNotes', JSON.stringify(notes));
  buildCalendar(currentYear, currentMonth);
  if (auth.currentUser) {
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), { calendarNotes: notes }, { merge: true });
    } catch (err) {
      console.error("Error syncing note deletion:", err);
    }
  }
  modal.style.display = 'none';
});

document.getElementById('closeModal').addEventListener('click', ()=>{ modal.style.display='none'; });

// Calendar navigation
prevMonthBtn.addEventListener('click', () => {
  currentMonth--; if(currentMonth<0){currentMonth=11; currentYear--;}
  buildCalendar(currentYear,currentMonth);
});
nextMonthBtn.addEventListener('click', () => {
  currentMonth++; if(currentMonth>11){currentMonth=0; currentYear++;}
  buildCalendar(currentYear,currentMonth);
});
goToDateBtn.addEventListener('click', () => {
  const m=parseInt(monthSelect.value), y=parseInt(yearInput.value);
  if(!isNaN(m) && !isNaN(y)){ currentMonth=m; currentYear=y; buildCalendar(currentYear,currentMonth);}
});

// To-do functions
function addTask(text, done=false){
  const li = document.createElement('li');
  const cb = document.createElement('input'); cb.type="checkbox"; cb.checked=done;
  const txt = document.createTextNode(" "+text);
  cb.addEventListener('change', ()=>saveTodos());
  li.appendChild(cb); li.appendChild(txt);
  list.appendChild(li);
}

addButton.addEventListener('click', ()=>{ if(input.value.trim()!==""){ addTask(input.value); input.value=""; }});
input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') addButton.click(); });
toggleButton.addEventListener('click', ()=>{ todoContainer.style.display = todoContainer.style.display==='flex'?'none':'flex'; });

// Save and load todos
export function saveTodos(){
  const todos = Array.from(list.querySelectorAll('li')).map(li=>{
    return {text: li.childNodes[1].textContent.trim(), done: li.childNodes[0].checked};
  });
  localStorage.setItem('todoList', JSON.stringify(todos));
  if(auth.currentUser){
    setDoc(doc(db,"users",auth.currentUser.uid), {todoList: todos}, {merge:true});
  }
}

export function loadTodos(){
  const saved = localStorage.getItem('todoList'); if(!saved) return;
  const todos = JSON.parse(saved);
  list.innerHTML=""; todos.forEach(t=>addTask(t.text,t.done));
}

// Animated image
const img = document.getElementById("animated");
const images = ["assets/Moon1.png","assets/Moon2.png","assets/Moon5.png","assets/Moon6.png",
"assets/Moon9.png","assets/Moon10.png","assets/Moon5.png","assets/Moon6.png","assets/Moon3.png",
"assets/Moon4.png","assets/Moon7.png","assets/Moon8.png","assets/Moon11.png","assets/Moon12.png",
"assets/Moon7.png","assets/Moon8.png"];
let index=0; setInterval(()=>{ index=(index+1)%images.length; img.src=images[index]; },500);

// Load initial state
notes = JSON.parse(localStorage.getItem('calendarNotes')) || {};
buildCalendar(currentYear,currentMonth);
loadTodos();