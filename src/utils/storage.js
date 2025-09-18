const STORAGE_KEY = "swt:data:v1";

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function seed() {
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

export function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const s = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return s;
  }
  try {
    return JSON.parse(raw);
  } catch {
    const s = seed();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    return s;
  }
}
export function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createActions(state, setState) {
  const update = (mutator) =>
    setState((prev) => {
      const copy = structuredClone(prev);
      mutator(copy);
      save(copy);
      return copy;
    });

  return {
    exportData: () => {
      const dataStr = JSON.stringify(state, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "simple-workout-tracker-backup.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    importData: (json) => {
      setState(json);
      save(json);
    },
    // Export only a single program and its workouts
    exportProgram: (pid) => {
      try {
        const p = state.programs.find((x) => x.id === pid);
        if (!p) return;
        const bundle = {
          kind: "swt:program",
          version: 1,
          program: structuredClone(p),
          workouts: {},
        };
        p.workouts.forEach((wid) => {
          const w = state.workouts[wid];
          if (w) bundle.workouts[wid] = structuredClone(w);
        });
        const dataStr = JSON.stringify(bundle, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const safe = (p.name || "program")
          .toLowerCase()
          .replace(/[^a-z0-9-_]+/g, "-");
        a.download = `swt-${safe}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (e) {
        console.error("exportProgram failed", e);
      }
    },
    // Import a single program bundle into current data (does not replace existing)
    importProgram: (json) =>
      update((d) => {
        try {
          const bundle = typeof json === "string" ? JSON.parse(json) : json;
          if (!bundle || bundle.kind !== "swt:program" || !bundle.program) {
            throw new Error("Invalid program bundle");
          }
          const oldToNew = {};
          const newProgramId = uid();
          const srcP = bundle.program;
          const newProgram = {
            id: newProgramId,
            name: String(srcP.name || "Imported Program"),
            workouts: [],
          };
          // Recreate workouts with new IDs
          (srcP.workouts || []).forEach((oldWid) => {
            const w = bundle.workouts?.[oldWid];
            if (!w) return;
            const newWid = uid();
            oldToNew[oldWid] = newWid;
            const newWorkout = structuredClone(w);
            newWorkout.id = newWid;
            d.workouts[newWid] = newWorkout;
            newProgram.workouts.push(newWid);
          });
          d.programs.push(newProgram);
        } catch (e) {
          console.error("importProgram failed", e);
          throw e;
        }
      }),

    addProgram: (name) =>
      update((d) => {
        d.programs.push({ id: uid(), name: name.trim(), workouts: [] });
      }),
    renameProgram: (pid, name) =>
      update((d) => {
        const p = d.programs.find((x) => x.id === pid);
        if (p) p.name = name.trim();
      }),
    deleteProgram: (pid) =>
      update((d) => {
        const p = d.programs.find((x) => x.id === pid);
        if (!p) return;
        p.workouts.forEach((wid) => delete d.workouts[wid]);
        d.programs = d.programs.filter((x) => x.id !== pid);
      }),

    addWorkout: (pid, { name, label = "" }) =>
      update((d) => {
        const p = d.programs.find((x) => x.id === pid);
        if (!p) return;
        const w = {
          id: uid(),
          name: name.trim(),
          label: label.trim(),
          exercises: [],
          sessions: [],
        };
        d.workouts[w.id] = w;
        p.workouts.push(w.id);
      }),
    editWorkoutMeta: (wid, { name, label = "" }) =>
      update((d) => {
        const w = d.workouts[wid];
        if (w) {
          w.name = name.trim();
          w.label = label.trim();
        }
      }),
    deleteWorkout: (pid, wid) =>
      update((d) => {
        const p = d.programs.find((x) => x.id === pid);
        if (!p) return;
        p.workouts = p.workouts.filter((x) => x !== wid);
        delete d.workouts[wid];
      }),

    addExercise: (wid, { name, sets, min, max, notes }) => {
      let newId = null;
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const ex = {
          id: uid(),
          name: name.trim(),
          sets: clamp(sets || 3, 1, 20),
          targetReps: { min: min || 1, max: max || min || 1 },
          notes: (notes || "").trim(),
        };
        w.exercises.push(ex);
        newId = ex.id;
      });
      return newId;
    },
    editExercise: (wid, exId, { name, sets, min, max, notes }) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const ex = w.exercises.find((e) => e.id === exId);
        if (!ex) return;
        ex.name = name.trim();
        ex.sets = clamp(sets || ex.sets, 1, 20);
        ex.targetReps = {
          min: min || ex.targetReps.min,
          max: max || min || ex.targetReps.max,
        };
        ex.notes = (notes || "").trim();
      }),
    deleteExercise: (wid, exId) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        w.exercises = w.exercises.filter((e) => e.id !== exId);
        w.sessions.forEach((s) => {
          delete s.results[exId];
        });
      }),
    // Clear all logged results for an exercise across all sessions, keeping the exercise itself
    clearExerciseResults: (wid, exId) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        (w.sessions || []).forEach((s) => {
          if (s?.results && exId in s.results) delete s.results[exId];
        });
      }),
    // Clear only today's logged results for an exercise (used on replace when you only want to reset current session)
    clearExerciseResultsToday: (wid, exId) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const today = new Date().toISOString().slice(0, 10);
        const last = w.sessions[w.sessions.length - 1];
        if (!last) return;
        if ((last.dateISO || "").slice(0, 10) !== today) return;
        if (last.results && exId in last.results) {
          delete last.results[exId];
        }
      }),

    addSession: (wid, results) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        w.sessions.push({
          id: uid(),
          dateISO: new Date().toISOString(),
          results,
        });
      }),

    // Save or update a single set result into today's session.
    saveSetResult: (wid, eid, index, { weight, reps }) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const today = new Date().toISOString().slice(0, 10);
        let session = w.sessions[w.sessions.length - 1];
        if (!session || (session.dateISO || "").slice(0, 10) !== today) {
          session = {
            id: uid(),
            dateISO: new Date().toISOString(),
            results: {},
          };
          w.sessions.push(session);
        }
        if (!session.results[eid]) session.results[eid] = [];
        // Ensure array length
        for (let i = 0; i <= index; i++) {
          if (!session.results[eid][i])
            session.results[eid][i] = { weight: null, reps: null };
        }
        const mapVal = (val, isReps) => {
          if (val === "-" || val === "" || val == null) return null;
          return isReps ? parseInt(val, 10) : parseFloat(val);
        };
        session.results[eid][index] = {
          weight: mapVal(weight, false),
          reps: mapVal(reps, true),
        };
      }),
    // Increment exercise set count (used when adding sets on the fly)
    incrementExerciseSets: (wid, eid, delta = 1) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const ex = w.exercises.find((e) => e.id === eid);
        if (!ex) return;
        ex.sets = clamp((ex.sets || 0) + (delta || 1), 1, 20);
      }),
    // Clear a saved set result for today's session (used when unchecking/skipped reset)
    clearSetResult: (wid, eid, index) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const today = new Date().toISOString().slice(0, 10);
        const last = w.sessions[w.sessions.length - 1];
        if (!last || (last.dateISO || "").slice(0, 10) !== today) return;
        const arr = last.results[eid];
        if (!arr) return;
        if (index < 0 || index >= arr.length) return;
        // Remove the entry; keep alignment minimal by setting undefined
        arr[index] = undefined;
        // Trim trailing undefined entries
        while (arr.length && arr[arr.length - 1] === undefined) arr.pop();
      }),
    // Remove a set by index from an exercise; decrements sets and splices today's results
    removeExerciseSet: (wid, eid, index) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const ex = w.exercises.find((e) => e.id === eid);
        if (!ex) return;
        if (ex.sets <= 1) return; // keep at least 1 set
        ex.sets = clamp(ex.sets - 1, 1, 20);
        const today = new Date().toISOString().slice(0, 10);
        const last = w.sessions[w.sessions.length - 1];
        if (last && (last.dateISO || "").slice(0, 10) === today) {
          if (!last.results[eid]) last.results[eid] = [];
          if (index >= 0 && index < last.results[eid].length) {
            last.results[eid].splice(index, 1);
          }
        }
      }),
    // Mark today's session complete, ensuring all sets are accounted for
    completeSession: (wid) =>
      update((d) => {
        const w = d.workouts[wid];
        if (!w) return;
        const today = new Date().toISOString().slice(0, 10);
        let session = w.sessions[w.sessions.length - 1];
        if (!session || (session.dateISO || "").slice(0, 10) !== today) {
          session = {
            id: uid(),
            dateISO: new Date().toISOString(),
            results: {},
          };
          w.sessions.push(session);
        }
        // Ensure every exercise has result entries up to sets-1
        w.exercises.forEach((ex) => {
          if (!session.results[ex.id]) session.results[ex.id] = [];
          for (let i = 0; i < (ex.sets || 0); i++) {
            if (!session.results[ex.id][i]) {
              session.results[ex.id][i] = { weight: null, reps: null };
            }
          }
        });
        session.complete = true;
        session.completedAt = new Date().toISOString();
      }),
  };
}
