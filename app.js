// Simple Workout Tracker - vanilla JS, localStorage persistence

// Data Model
// program: { id, name, workouts: [workoutId, ...] }
// workout: { id, name, label?, exercises: [exercise], sessions: [session] }
// exercise: { id, name, sets, targetReps: { min, max }, notes }
// session: { id, dateISO, results: { exerciseId: [{ weight, reps }] } }

const STORAGE_KEY = "swt:data:v1";
const state = {
  data: null, // { programs: [], workouts: { [id]: workout } }
  selectedProgramId: null,
  selectedWorkoutId: null,
};

// Utils
const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const byId = (id) => document.getElementById(id);

function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const seeded = seedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
}

function seedData() {
  const p1 = { id: uid(), name: "Base Strength", workouts: [] };
  const w1 = {
    id: uid(),
    name: "Day 1",
    label: "Push A",
    exercises: [
      {
        id: uid(),
        name: "Bench Press",
        sets: 3,
        targetReps: { min: 5, max: 8 },
        notes: "",
      },
      {
        id: uid(),
        name: "Overhead Press",
        sets: 3,
        targetReps: { min: 6, max: 10 },
        notes: "",
      },
      {
        id: uid(),
        name: "Triceps Pushdown",
        sets: 3,
        targetReps: { min: 10, max: 15 },
        notes: "",
      },
    ],
    sessions: [],
  };
  const w2 = {
    id: uid(),
    name: "Day 2",
    label: "Pull A",
    exercises: [
      {
        id: uid(),
        name: "Deadlift",
        sets: 3,
        targetReps: { min: 3, max: 5 },
        notes: "",
      },
      {
        id: uid(),
        name: "Barbell Row",
        sets: 3,
        targetReps: { min: 6, max: 10 },
        notes: "",
      },
      {
        id: uid(),
        name: "Lat Pulldown",
        sets: 3,
        targetReps: { min: 8, max: 12 },
        notes: "",
      },
    ],
    sessions: [],
  };
  p1.workouts.push(w1.id, w2.id);
  return { programs: [p1], workouts: { [w1.id]: w1, [w2.id]: w2 } };
}

function init() {
  state.data = loadData();
  renderSidebar();
  bindHeaderActions();
}

function bindHeaderActions() {
  byId("exportBtn").addEventListener("click", onExport);
  byId("importInput").addEventListener("change", onImport);
  byId("addProgramBtn").addEventListener("click", () => {
    const name = prompt("Program name?");
    if (!name) return;
    const prog = { id: uid(), name: name.trim(), workouts: [] };
    state.data.programs.push(prog);
    state.selectedProgramId = prog.id;
    state.selectedWorkoutId = null;
    saveData();
    renderSidebar();
    renderContentEmpty();
  });
  byId("addWorkoutBtn").addEventListener("click", () => {
    const prog = getSelectedProgram();
    if (!prog) return;
    const name = prompt("Workout name?");
    if (!name) return;
    const label = prompt("Optional label (e.g., Push A)?") || "";
    const w = {
      id: uid(),
      name: name.trim(),
      label: label.trim(),
      exercises: [],
      sessions: [],
    };
    state.data.workouts[w.id] = w;
    prog.workouts.push(w.id);
    state.selectedWorkoutId = w.id;
    saveData();
    renderSidebar();
    renderWorkout(w);
  });
}

function getSelectedProgram() {
  return (
    state.data.programs.find((p) => p.id === state.selectedProgramId) || null
  );
}
function getSelectedWorkout() {
  return state.data.workouts[state.selectedWorkoutId] || null;
}

function renderSidebar() {
  const programList = byId("programList");
  programList.innerHTML = "";
  state.data.programs.forEach((p) => {
    const li = document.createElement("li");
    if (p.id === state.selectedProgramId) li.classList.add("active");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = p.name;
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${p.workouts.length} workouts`;
    const actions = document.createElement("div");
    actions.className = "row-actions";

    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      state.selectedProgramId = p.id;
      state.selectedWorkoutId = null;
      renderSidebar();
      renderContentEmpty();
    });

    const renameBtn = document.createElement("button");
    renameBtn.className = "small";
    renameBtn.textContent = "Rename";
    renameBtn.addEventListener("click", () => {
      const n = prompt("New program name?", p.name);
      if (!n) return;
      p.name = n.trim();
      saveData();
      renderSidebar();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "small danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete program and its workouts?")) return;
      // delete workouts referenced
      p.workouts.forEach((wid) => {
        delete state.data.workouts[wid];
      });
      state.data.programs = state.data.programs.filter((x) => x.id !== p.id);
      if (state.selectedProgramId === p.id) {
        state.selectedProgramId = null;
        state.selectedWorkoutId = null;
      }
      saveData();
      renderSidebar();
      renderContentEmpty();
    });

    actions.append(openBtn, renameBtn, delBtn);
    li.append(title, meta, actions);
    programList.appendChild(li);
  });

  const workoutPane = byId("workoutPane");
  const workoutList = byId("workoutList");
  workoutList.innerHTML = "";
  const prog = getSelectedProgram();
  if (!prog) {
    workoutPane.classList.add("hidden");
    return;
  }
  workoutPane.classList.remove("hidden");
  prog.workouts.forEach((wid) => {
    const w = state.data.workouts[wid];
    const li = document.createElement("li");
    if (wid === state.selectedWorkoutId) li.classList.add("active");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = w.name + (w.label ? ` (${w.label})` : "");
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${w.exercises.length} exercises`;
    const actions = document.createElement("div");
    actions.className = "row-actions";

    const openBtn = document.createElement("button");
    openBtn.textContent = "Open";
    openBtn.addEventListener("click", () => {
      state.selectedWorkoutId = wid;
      renderSidebar();
      renderWorkout(w);
    });

    const renameBtn = document.createElement("button");
    renameBtn.className = "small";
    renameBtn.textContent = "Edit";
    renameBtn.addEventListener("click", () => editWorkoutMeta(w));

    const delBtn = document.createElement("button");
    delBtn.className = "small danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      if (!confirm("Delete workout?")) return;
      const idx = prog.workouts.indexOf(wid);
      if (idx >= 0) prog.workouts.splice(idx, 1);
      delete state.data.workouts[wid];
      if (state.selectedWorkoutId === wid) state.selectedWorkoutId = null;
      saveData();
      renderSidebar();
      renderContentEmpty();
    });

    actions.append(openBtn, renameBtn, delBtn);
    li.append(title, meta, actions);
    workoutList.appendChild(li);
  });
}

function renderContentEmpty() {
  byId("content").innerHTML =
    '<div class="empty"><p>Select a workout or create one to get started.</p></div>';
}

function editWorkoutMeta(w) {
  const n = prompt("Workout name?", w.name);
  if (!n) return;
  const l = prompt("Label? (optional)", w.label || "") || "";
  w.name = n.trim();
  w.label = l.trim();
  saveData();
  renderSidebar();
  const sel = getSelectedWorkout();
  if (sel && sel.id === w.id) renderWorkout(w);
}

function renderWorkout(w) {
  const content = byId("content");
  const last = lastSession(w);
  content.innerHTML = "";

  // Header
  const header = document.createElement("div");
  header.className = "section";
  const hTitle = document.createElement("h3");
  hTitle.textContent = w.name;
  const sub = document.createElement("div");
  sub.className = "small-muted";
  sub.textContent = w.label ? `Label: ${w.label}` : "No label";
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.gap = "8px";
  const addExBtn = document.createElement("button");
  addExBtn.textContent = "Add exercise";
  addExBtn.addEventListener("click", () => addExercise(w));
  const startBtn = document.createElement("button");
  startBtn.textContent = "Start new session";
  startBtn.addEventListener("click", () => renderSessionForm(w));
  const historyBtn = document.createElement("button");
  historyBtn.textContent = "History";
  historyBtn.addEventListener("click", () => renderHistory(w));
  actions.append(addExBtn, startBtn, historyBtn);
  header.append(hTitle, sub, actions);
  content.appendChild(header);

  // Exercises list
  const exSection = document.createElement("div");
  exSection.className = "section";
  const exTitle = document.createElement("h3");
  exTitle.textContent = "Exercises";
  exSection.appendChild(exTitle);

  if (!w.exercises.length) {
    const p = document.createElement("p");
    p.className = "small-muted";
    p.textContent = "No exercises yet.";
    exSection.appendChild(p);
  }

  w.exercises.forEach((ex) => {
    const div = document.createElement("div");
    div.className = "exercise";
    const h4 = document.createElement("h4");
    h4.textContent = ex.name;
    const meta = document.createElement("div");
    meta.className = "small-muted";
    meta.textContent = `${ex.sets} sets • Target ${ex.targetReps.min}-${ex.targetReps.max} reps`;

    const notes = document.createElement("div");
    notes.className = "small-muted";
    notes.textContent = ex.notes ? `Notes: ${ex.notes}` : "No notes";

    const rowActions = document.createElement("div");
    rowActions.style.display = "flex";
    rowActions.style.gap = "6px";
    rowActions.style.marginTop = "6px";
    const editBtn = document.createElement("button");
    editBtn.className = "small";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => editExercise(w, ex));
    const delBtn = document.createElement("button");
    delBtn.className = "small danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteExercise(w, ex.id));

    rowActions.append(editBtn, delBtn);
    div.append(h4, meta, notes, rowActions);
    exSection.appendChild(div);
  });

  // Last time summary
  const lastSection = document.createElement("div");
  lastSection.className = "section";
  const lastTitle = document.createElement("h3");
  lastTitle.textContent = "Last time";
  lastSection.appendChild(lastTitle);
  if (!last) {
    const p = document.createElement("p");
    p.className = "small-muted";
    p.textContent = "No previous sessions.";
    lastSection.appendChild(p);
  } else {
    const when = new Date(last.dateISO).toLocaleString();
    const p = document.createElement("p");
    p.innerHTML = `<span class="badge">${when}</span>`;
    lastSection.appendChild(p);
    w.exercises.forEach((ex) => {
      const res = (last.results[ex.id] || [])
        .map((s, i) => `S${i + 1}: ${s.weight ?? "-"}×${s.reps ?? "-"}`)
        .join("  ");
      const line = document.createElement("div");
      line.className = "small-muted";
      line.textContent = `${ex.name}: ${res || "—"}`;
      lastSection.appendChild(line);
    });
  }

  content.append(exSection, lastSection);
}

function renderHistory(w) {
  const content = byId("content");
  content.innerHTML = "";

  const header = document.createElement("div");
  header.className = "section";
  const h3 = document.createElement("h3");
  h3.textContent = `History: ${w.name}`;
  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "8px";
  const back = document.createElement("button");
  back.textContent = "Back";
  back.addEventListener("click", () => renderWorkout(w));
  controls.appendChild(back);
  header.append(h3, controls);
  content.appendChild(header);

  const sec = document.createElement("div");
  sec.className = "section";
  const title = document.createElement("h3");
  title.textContent = "Sessions";
  sec.appendChild(title);

  if (!w.sessions.length) {
    const p = document.createElement("p");
    p.className = "small-muted";
    p.textContent = "No sessions yet.";
    sec.appendChild(p);
  } else {
    const container = document.createElement("div");
    w.sessions
      .slice()
      .reverse()
      .forEach((s, idx) => {
        const card = document.createElement("div");
        card.className = "exercise";
        const when = new Date(s.dateISO).toLocaleString();
        const h4 = document.createElement("h4");
        h4.textContent = `#${w.sessions.length - idx} · ${when}`;
        card.appendChild(h4);
        w.exercises.forEach((ex) => {
          const arr = s.results[ex.id] || [];
          const line = document.createElement("div");
          line.className = "small-muted";
          const summary = arr
            .map((r, i) => `S${i + 1}: ${r.weight ?? "-"}×${r.reps ?? "-"}`)
            .join("  ");
          line.textContent = `${ex.name}: ${summary || "—"}`;
          card.appendChild(line);
        });
        container.appendChild(card);
      });
    sec.appendChild(container);
  }

  content.appendChild(sec);
}

function addExercise(w) {
  const name = prompt("Exercise name?");
  if (!name) return;
  const sets = parseInt(prompt("Number of sets?", "3") || "3", 10);
  const min = parseInt(prompt("Target reps min?", "5") || "5", 10);
  const max = parseInt(
    prompt("Target reps max?", String(Math.max(min, 8))) ||
      String(Math.max(min, 8)),
    10
  );
  const notes = prompt("Notes (optional)?") || "";
  const ex = {
    id: uid(),
    name: name.trim(),
    sets: clamp(sets || 3, 1, 20),
    targetReps: { min: min || 1, max: max || min || 1 },
    notes: notes.trim(),
  };
  w.exercises.push(ex);
  saveData();
  renderWorkout(w);
  renderSidebar();
}

function editExercise(w, ex) {
  const name = prompt("Exercise name?", ex.name);
  if (!name) return;
  const sets = parseInt(
    prompt("Number of sets?", String(ex.sets)) || String(ex.sets),
    10
  );
  const min = parseInt(
    prompt("Target reps min?", String(ex.targetReps.min)) ||
      String(ex.targetReps.min),
    10
  );
  const max = parseInt(
    prompt("Target reps max?", String(ex.targetReps.max)) ||
      String(ex.targetReps.max),
    10
  );
  const notes = prompt("Notes?", ex.notes || "") || "";
  ex.name = name.trim();
  ex.sets = clamp(sets || ex.sets, 1, 20);
  ex.targetReps = {
    min: min || ex.targetReps.min,
    max: max || min || ex.targetReps.max,
  };
  ex.notes = notes.trim();
  saveData();
  renderWorkout(w);
  renderSidebar();
}

function deleteExercise(w, exId) {
  if (!confirm("Delete exercise?")) return;
  w.exercises = w.exercises.filter((e) => e.id !== exId);
  // Clean results in sessions
  w.sessions.forEach((s) => {
    delete s.results[exId];
  });
  saveData();
  renderWorkout(w);
  renderSidebar();
}

function renderSessionForm(w) {
  state.selectedWorkoutId = w.id;
  renderSidebar();
  const content = byId("content");
  content.innerHTML = "";

  const section = document.createElement("div");
  section.className = "section";
  const title = document.createElement("h3");
  title.textContent = `Log session: ${w.name}`;
  const last = lastSession(w);
  const small = document.createElement("div");
  small.className = "small-muted";
  small.textContent = last
    ? `Last: ${new Date(last.dateISO).toLocaleString()}`
    : "No previous sessions";
  section.append(title, small);

  const form = document.createElement("form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    saveSessionFromForm(w, form);
  });

  w.exercises.forEach((ex) => {
    const block = document.createElement("div");
    block.className = "exercise";
    const h4 = document.createElement("h4");
    h4.textContent = `${ex.name} · ${ex.sets} sets · target ${ex.targetReps.min}-${ex.targetReps.max}`;
    block.appendChild(h4);

    const grid = document.createElement("div");
    grid.className = "set-grid";
    const lastRes = last?.results[ex.id] || [];

    for (let i = 0; i < ex.sets; i++) {
      const idx = i;
      const setHeader = document.createElement("div");
      setHeader.className = "set-header";
      setHeader.textContent = `Set ${i + 1}`;
      const weight = document.createElement("input");
      weight.type = "number";
      weight.step = "0.5";
      weight.placeholder = "Weight";
      weight.name = `ex-${ex.id}-w-${idx}`;
      weight.value = lastRes[idx]?.weight ?? "";
      const reps = document.createElement("input");
      reps.type = "number";
      reps.step = "1";
      reps.placeholder = "Reps";
      reps.name = `ex-${ex.id}-r-${idx}`;
      reps.value = lastRes[idx]?.reps ?? "";
      const lastText = document.createElement("div");
      lastText.className = "small-muted";
      lastText.textContent = `Last: ${lastRes[idx]?.weight ?? "-"}×${
        lastRes[idx]?.reps ?? "-"
      }`;
      grid.append(setHeader, weight, reps, lastText);
    }

    block.appendChild(grid);
    section.appendChild(block);
  });

  const controls = document.createElement("div");
  controls.style.display = "flex";
  controls.style.gap = "8px";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.textContent = "Back";
  cancel.addEventListener("click", () => renderWorkout(w));
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "Save session";
  controls.append(cancel, submit);
  form.append(section, controls);

  content.appendChild(form);
}

function saveSessionFromForm(w, form) {
  const results = {};
  w.exercises.forEach((ex) => {
    results[ex.id] = [];
    for (let i = 0; i < ex.sets; i++) {
      const wv = form.querySelector(`[name="ex-${ex.id}-w-${i}"]`).value;
      const rv = form.querySelector(`[name="ex-${ex.id}-r-${i}"]`).value;
      const weight = wv === "" ? null : parseFloat(wv);
      const reps = rv === "" ? null : parseInt(rv, 10);
      results[ex.id].push({ weight, reps });
    }
  });

  const session = { id: uid(), dateISO: new Date().toISOString(), results };
  w.sessions.push(session);
  saveData();
  renderWorkout(w);
}

function lastSession(w) {
  return w.sessions[w.sessions.length - 1] || null;
}

// Export / Import
function onExport() {
  const dataStr = JSON.stringify(state.data, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "simple-workout-tracker-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function onImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    // Very light validation
    if (
      !json ||
      !Array.isArray(json.programs) ||
      typeof json.workouts !== "object"
    )
      throw new Error("Invalid data");
    state.data = json;
    saveData();
    renderSidebar();
    renderContentEmpty();
  } catch (err) {
    alert("Import failed: " + err.message);
  } finally {
    e.target.value = "";
  }
}

// Initialize
window.addEventListener("DOMContentLoaded", init);
