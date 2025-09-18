import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../ui/components/Button";
import { useStorage } from "../utils/storageContext.jsx";
import { Confirm, Prompt } from "../ui/components/Modal.jsx";
import {
  MoreVertical,
  CheckSquare,
  Square,
  TrendingUp,
  TrendingDown,
  Equal,
  CircleMinus,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  StickyNote,
  Edit3,
  SkipForward,
  Trash2,
  Wrench,
} from "lucide-react";

export default function WorkoutDetail() {
  const { wid } = useParams();
  const nav = useNavigate();
  const {
    data,
    addExercise,
    editExercise,
    editWorkoutMeta,
    deleteExercise,
    saveSetResult,
    clearSetResult,
    clearExerciseResults,
    clearExerciseResultsToday,
    incrementExerciseSets,
    removeExerciseSet,
    completeSession,
  } = useStorage();
  const workout = data.workouts[wid];
  const program = useMemo(
    () => data.programs.find((p) => p.workouts.includes(wid)),
    [data, wid]
  );
  const today = new Date().toISOString().slice(0, 10);
  const prev = useMemo(() => {
    if (!workout) return null;
    for (let i = workout.sessions.length - 1; i >= 0; i--) {
      const s = workout.sessions[i];
      if ((s.dateISO || "").slice(0, 10) < today) return s;
    }
    return null;
  }, [workout, today]);
  const curr = useMemo(() => {
    if (!workout) return null;
    const last = workout.sessions[workout.sessions.length - 1];
    if (!last) return null;
    return (last.dateISO || "").slice(0, 10) === today ? last : null;
  }, [workout, today]);
  const [values, setValues] = useState(() => initialValues(workout, prev));
  const [doneMap, setDoneMap] = useState({});
  const [promptInfo, setPromptInfo] = useState(null);
  const [confirmInfo, setConfirmInfo] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [editSets, setEditSets] = useState({}); // exId -> boolean
  const [workoutMenuOpen, setWorkoutMenuOpen] = useState(false);
  const [workoutNotesPrompt, setWorkoutNotesPrompt] = useState(false);
  const [workoutNamePrompt, setWorkoutNamePrompt] = useState(false);
  const isCompleted = !!curr?.complete;
  const allSetsComplete = useMemo(() => {
    if (!workout || (workout.exercises || []).length === 0) return false;
    for (const ex of workout.exercises) {
      const arr = values[ex.id] || [];
      const needed = ex.sets || arr.length;
      for (let i = 0; i < needed; i++) {
        if (!doneMap[`${ex.id}-${i}`]) return false;
      }
    }
    return true;
  }, [workout, values, doneMap]);

  // When there's a session today, prefill values and mark those sets done
  useEffect(() => {
    if (!workout) return;
    if (!curr) return;
    const results = curr.results || {};
    setValues((prevVals) => {
      const copy = structuredClone(prevVals);
      for (const ex of workout.exercises) {
        const arr = results[ex.id] || [];
        // Ensure array length
        if (!copy[ex.id]) copy[ex.id] = [];
        for (let i = 0; i < ex.sets; i++) {
          const r = arr[i];
          if (r) {
            copy[ex.id][i] = {
              weight: r.weight == null ? "-" : String(r.weight),
              reps: r.reps == null ? "-" : String(r.reps),
            };
          }
        }
      }
      return copy;
    });
    setDoneMap((m) => {
      const next = { ...m };
      for (const ex of workout.exercises) {
        const arr = results[ex.id] || [];
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] !== undefined) next[`${ex.id}-${i}`] = true;
        }
      }
      return next;
    });
  }, [curr, workout]);

  if (!workout) {
    return (
      <div className="container">
        <p className="muted">Workout not found.</p>
        <Button variant="ghost" onClick={() => nav(-1)}>
          Back
        </Button>
      </div>
    );
  }

  function handleSetToggle(ex, i, checked) {
    const key = `${ex.id}-${i}`;
    if (!checked) {
      setDoneMap((m) => ({ ...m, [key]: false }));
      // If this was a skip placeholder, clear back to blank so user can type
      setValues((v) => {
        const c = structuredClone(v);
        if (c[ex.id]?.[i]) {
          if (c[ex.id][i].weight === "-") c[ex.id][i].weight = "";
          if (c[ex.id][i].reps === "-") c[ex.id][i].reps = "";
        }
        return c;
      });
      // Clear persisted result for today's session
      clearSetResult(wid, ex.id, i);
      return;
    }
    // When checking, if empty treat as skipped '-'
    const cur = values[ex.id][i];
    const emptyW = cur.weight === "" || cur.weight == null;
    const emptyR = cur.reps === "" || cur.reps == null;
    const weightToSave = emptyW && emptyR ? "-" : cur.weight;
    const repsToSave = emptyW && emptyR ? "-" : cur.reps;
    setValues((v) => {
      const c = structuredClone(v);
      if (emptyW && emptyR) {
        c[ex.id][i].weight = "-";
        c[ex.id][i].reps = "-";
      }
      return c;
    });
    setDoneMap((m) => ({ ...m, [key]: true }));
    // Save; storage maps '-' to null
    saveSetResult(wid, ex.id, i, { weight: weightToSave, reps: repsToSave });
  }

  function relDaysAgo(iso) {
    if (!iso) return "—";
    const d1 = new Date(iso);
    const d2 = new Date();
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "today";
    if (diff === 1) return "1 day ago";
    return `${diff} days ago`;
  }

  function skipRemainingSets(ex) {
    setValues((v) => {
      const c = structuredClone(v);
      for (let i = 0; i < c[ex.id].length; i++) {
        const key = `${ex.id}-${i}`;
        if (!doneMap[key]) {
          c[ex.id][i] = { weight: "-", reps: "-" };
        }
      }
      return c;
    });
    // Mark as done and persist as nulls for skipped sets
    setDoneMap((m) => {
      const next = { ...m };
      for (let i = 0; i < values[ex.id].length; i++) {
        const key = `${ex.id}-${i}`;
        if (!next[key]) {
          next[key] = true;
          saveSetResult(wid, ex.id, i, { weight: "-", reps: "-" });
        }
      }
      return next;
    });
  }

  function progressForExercise(ex) {
    const prevFirst = prev?.results?.[ex.id]?.[0] || null;
    const currFirst = curr?.results?.[ex.id]?.[0] || null;
    if (!prevFirst || !currFirst) return null;
    const wPrev = prevFirst.weight ?? 0;
    const wCurr = currFirst.weight ?? 0;
    if (wCurr > wPrev) return "up";
    if (wCurr < wPrev) return "down";
    const rPrev = prevFirst.reps ?? 0;
    const rCurr = currFirst.reps ?? 0;
    if (rCurr > rPrev) return "up";
    if (rCurr < rPrev) return "down";
    return "equal";
  }

  return (
    <div className="container">
      <div className="section-header">
        <div className="breadcrumbs">
          <Link to="/">Programs</Link> <span>/</span>{" "}
          <Link to={`/program/${program?.id}`}>{program?.name}</Link>{" "}
          <span>/</span> <span>{workout.name}</span>
        </div>
        <div className="row gap">
          <Button onClick={() => setPromptInfo({ mode: "add" })}>
            <Plus size={16} /> Add Exercise
          </Button>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card-head">
            <h3>{workout.name}</h3>
            <div className="head-right">
              <span className="badge">
                {workout.exercises.length} exercises
              </span>
              {isCompleted ? (
                <span className="badge" title="This session is completed">
                  Completed
                </span>
              ) : null}
              <div className="menu">
                <Button
                  variant="icon"
                  aria-label="Workout menu"
                  onClick={() => setWorkoutMenuOpen((v) => !v)}
                >
                  <MoreVertical size={16} />
                </Button>
                {workoutMenuOpen && (
                  <div className="menu-panel" role="menu">
                    <button
                      className="menu-item"
                      onClick={() => {
                        setWorkoutMenuOpen(false);
                        setWorkoutNamePrompt(true);
                      }}
                    >
                      <Edit3 size={14} style={{ marginRight: 6 }} />
                      Edit name
                    </button>
                    <button
                      className="menu-item"
                      onClick={() => {
                        setWorkoutMenuOpen(false);
                        setWorkoutNotesPrompt(true);
                      }}
                    >
                      <StickyNote size={14} style={{ marginRight: 6 }} />
                      {workout.label ? "Edit notes" : "Add notes"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          {workout.label ? (
            <div className="card-body">
              <p className="muted no-margin">{workout.label}</p>
            </div>
          ) : null}
        </div>

        <div className="stack">
          {workout.exercises.length === 0 ? (
            <p className="muted">No exercises yet.</p>
          ) : (
            workout.exercises.map((ex) => (
              <div key={ex.id} className="card">
                <div className="card-head">
                  <h3>{ex.name}</h3>
                  <div
                    className="head-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(() => {
                      const p = progressForExercise(ex);
                      return p === "up" ? (
                        <TrendingUp size={16} color="#9afaa0" title="Up" />
                      ) : p === "down" ? (
                        <TrendingDown size={16} color="#ff6b6b" title="Down" />
                      ) : p === "equal" ? (
                        <Equal size={16} color="#9aa4b2" title="Equal" />
                      ) : null;
                    })()}
                    <span className="muted">
                      {ex.sets} sets • {ex.targetReps.min}-{ex.targetReps.max}
                    </span>
                    <div className="menu">
                      <Button
                        variant="icon"
                        onClick={() =>
                          setMenuOpen(menuOpen === ex.id ? null : ex.id)
                        }
                        aria-label="More"
                      >
                        <MoreVertical size={16} />
                      </Button>
                      {menuOpen === ex.id && (
                        <div className="menu-panel" role="menu">
                          <button
                            className="menu-item"
                            onClick={() => {
                              setMenuOpen(null);
                              setPromptInfo({ mode: "replace", ex });
                            }}
                          >
                            <RefreshCw size={14} style={{ marginRight: 6 }} />
                            Replace
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setMenuOpen(null);
                              setPromptInfo({ mode: "edit-target", ex });
                            }}
                          >
                            <SlidersHorizontal
                              size={14}
                              style={{ marginRight: 6 }}
                            />
                            Target reps
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setMenuOpen(null);
                              setPromptInfo({ mode: "ex-notes", ex });
                            }}
                          >
                            <StickyNote size={14} style={{ marginRight: 6 }} />
                            {ex.notes ? "Edit notes" : "Add notes"}
                          </button>
                          {!isCompleted && (
                            <button
                              className="menu-item"
                              onClick={() => {
                                setMenuOpen(null);
                                setEditSets((m) => ({
                                  ...m,
                                  [ex.id]: !m[ex.id],
                                }));
                              }}
                            >
                              <Wrench size={14} style={{ marginRight: 6 }} />
                              {editSets[ex.id] ? "Done editing" : "Edit sets"}
                            </button>
                          )}
                          {!isCompleted && (
                            <button
                              className="menu-item"
                              onClick={() => {
                                setMenuOpen(null);
                                incrementExerciseSets(wid, ex.id, 1);
                                setValues((v) => ({
                                  ...v,
                                  [ex.id]: [
                                    ...v[ex.id],
                                    { weight: "", reps: "" },
                                  ],
                                }));
                              }}
                            >
                              <Plus size={14} style={{ marginRight: 6 }} />
                              Add set
                            </button>
                          )}
                          {!isCompleted && (
                            <button
                              className="menu-item"
                              onClick={() => {
                                setMenuOpen(null);
                                skipRemainingSets(ex);
                              }}
                            >
                              <SkipForward
                                size={14}
                                style={{ marginRight: 6 }}
                              />
                              Skip remaining sets
                            </button>
                          )}
                          <button
                            className="menu-item"
                            onClick={() => {
                              setMenuOpen(null);
                              setConfirmInfo({ ex });
                            }}
                          >
                            <Trash2 size={14} style={{ marginRight: 6 }} />
                            Delete exercise
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {ex.notes ? (
                  <div className="card-body">
                    <p className="muted" style={{ margin: "0 0 16px 0" }}>
                      {ex.notes}
                    </p>
                  </div>
                ) : null}
                {/* Last session for this exercise, aligned */}
                {prev?.results?.[ex.id] ? (
                  <div className="last-section">
                    <div className="last-row">
                      <div className="set-index">
                        Last ({relDaysAgo(prev.dateISO)})
                      </div>
                    </div>
                    {values[ex.id].map((_, i) => (
                      <div className="last-row" key={`last-${ex.id}-${i}`}>
                        <div className="set-index">{i + 1}</div>
                        <div className="weight">
                          {prev?.results[ex.id]?.[i]?.weight ?? "-"}
                        </div>
                        <div className="reps">
                          {prev?.results[ex.id]?.[i]?.reps ?? "-"}
                        </div>
                        <div className="save" />
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Set table header */}
                <div className="set-head">
                  {editSets[ex.id] && !isCompleted ? (
                    <div className="remove" />
                  ) : null}
                  <div className="set-index">Set</div>
                  <div className="weight">Weight</div>
                  <div className="reps">Reps</div>
                  <div className="save">Save</div>
                </div>

                <div className="stack">
                  {values[ex.id].map((_, i) => (
                    <div key={i} className="set-row">
                      {editSets[ex.id] && !isCompleted ? (
                        <button
                          className="remove-btn"
                          title="Remove set"
                          onClick={() =>
                            setConfirmInfo({ removeSet: { ex, index: i } })
                          }
                        >
                          <CircleMinus size={16} />
                        </button>
                      ) : null}
                      <div className="set-index">{i + 1}</div>
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={
                          doneMap[`${ex.id}-${i}`] &&
                          values[ex.id][i].weight === "-"
                            ? "-"
                            : "Weight"
                        }
                        value={values[ex.id][i].weight}
                        disabled={!!doneMap[`${ex.id}-${i}`] || isCompleted}
                        onChange={(e) =>
                          setValues((v) => {
                            const c = structuredClone(v);
                            c[ex.id][i].weight = e.target.value;
                            return c;
                          })
                        }
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={
                          doneMap[`${ex.id}-${i}`] &&
                          values[ex.id][i].reps === "-"
                            ? "-"
                            : "Reps"
                        }
                        value={values[ex.id][i].reps}
                        disabled={!!doneMap[`${ex.id}-${i}`] || isCompleted}
                        onChange={(e) =>
                          setValues((v) => {
                            const c = structuredClone(v);
                            c[ex.id][i].reps = e.target.value;
                            return c;
                          })
                        }
                      />
                      <label
                        className={`check-toggle ${
                          doneMap[`${ex.id}-${i}`] ? "checked" : ""
                        }`}
                      >
                        {doneMap[`${ex.id}-${i}`] ? (
                          <CheckSquare size={24} />
                        ) : (
                          <Square size={24} />
                        )}
                        <input
                          type="checkbox"
                          checked={!!doneMap[`${ex.id}-${i}`]}
                          onChange={(e) =>
                            handleSetToggle(ex, i, e.target.checked)
                          }
                          disabled={isCompleted}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {!isCompleted && allSetsComplete && workout.exercises.length > 0 && (
        <div className="row gap" style={{ marginTop: 12 }}>
          <Button
            variant="primary"
            onClick={() => setConfirmInfo({ complete: true })}
          >
            Finish workout
          </Button>
        </div>
      )}

      <ExerciseModals
        promptInfo={promptInfo}
        setPromptInfo={setPromptInfo}
        confirmInfo={confirmInfo}
        setConfirmInfo={setConfirmInfo}
        wid={wid}
        addExercise={addExercise}
        editExercise={editExercise}
        deleteExercise={deleteExercise}
        setValues={setValues}
        setDoneMap={setDoneMap}
        values={values}
        removeExerciseSet={removeExerciseSet}
        workout={workout}
      />
      {/* Workout notes prompt */}
      <Prompt
        open={workoutNotesPrompt}
        title="Workout notes"
        label="Workout notes"
        defaultValue={workout.label || ""}
        onCancel={() => setWorkoutNotesPrompt(false)}
        onSubmit={(val) => {
          editWorkoutMeta(wid, { name: workout.name, label: val || "" });
          setWorkoutNotesPrompt(false);
        }}
      />
      {/* Workout name prompt */}
      <Prompt
        open={workoutNamePrompt}
        title="Workout name"
        label="Name"
        defaultValue={workout.name || ""}
        onCancel={() => setWorkoutNamePrompt(false)}
        onSubmit={(val) => {
          if (!val) return;
          editWorkoutMeta(wid, { name: val, label: workout.label || "" });
          setWorkoutNamePrompt(false);
        }}
      />
      {confirmInfo?.complete && (
        <Confirm
          open
          title="Complete Workout"
          message="Mark this workout as complete? Any remaining sets will be saved as skipped."
          confirmLabel="Complete"
          onCancel={() => setConfirmInfo(null)}
          onConfirm={() => {
            completeSession(wid);
            setConfirmInfo(null);
          }}
        />
      )}
    </div>
  );
}

function initialValues(workout, last) {
  const init = {};
  workout.exercises.forEach((ex) => {
    init[ex.id] = [];
    const lastRes = last?.results?.[ex.id] || [];
    const count = ex.sets;
    for (let i = 0; i < count; i++) {
      init[ex.id][i] = {
        weight: lastRes[i]?.weight ?? "",
        reps: lastRes[i]?.reps ?? "",
      };
    }
  });
  return init;
}

function ExerciseModals({
  promptInfo,
  setPromptInfo,
  confirmInfo,
  setConfirmInfo,
  wid,
  addExercise,
  editExercise,
  deleteExercise,
  setValues,
  setDoneMap,
  values,
  removeExerciseSet,
  workout,
}) {
  const isOpen = !!promptInfo;
  const isConfirm = !!confirmInfo;
  return (
    <>
      {isOpen && promptInfo?.mode === "add" && (
        <AddExerciseModal
          open
          onCancel={() => setPromptInfo(null)}
          onSubmit={({ name, sets, min, max, notes }) => {
            const id = addExercise(wid, { name, sets, min, max, notes });
            // Seed local values with correct number of sets for the new exercise
            setValues((v) => {
              const c = structuredClone(v);
              c[id] = Array.from({ length: sets }, () => ({
                weight: "",
                reps: "",
              }));
              return c;
            });
            setPromptInfo(null);
          }}
        />
      )}
      {isOpen &&
        (promptInfo?.mode === "replace" || promptInfo?.mode === "ex-notes") && (
          <Prompt
            open
            title={
              promptInfo?.mode === "replace"
                ? "Replace Exercise"
                : "Exercise notes"
            }
            label={promptInfo?.mode === "ex-notes" ? "Notes" : "Exercise name"}
            defaultValue={
              promptInfo?.mode === "ex-notes"
                ? promptInfo?.ex?.notes || ""
                : promptInfo?.ex?.name || ""
            }
            onCancel={() => setPromptInfo(null)}
            onSubmit={(val) => {
              if (!val) return;
              if (promptInfo?.mode === "replace" && promptInfo.ex) {
                editExercise(wid, promptInfo.ex.id, {
                  name: val,
                  sets: promptInfo.ex.sets,
                  min: promptInfo.ex.targetReps.min,
                  max: promptInfo.ex.targetReps.max,
                  notes: promptInfo.ex.notes,
                });
                // Clear only today's logged results for this exercise when replacing
                clearExerciseResultsToday(wid, promptInfo.ex.id);
              } else if (promptInfo?.mode === "ex-notes" && promptInfo.ex) {
                editExercise(wid, promptInfo.ex.id, {
                  name: promptInfo.ex.name,
                  sets: promptInfo.ex.sets,
                  min: promptInfo.ex.targetReps.min,
                  max: promptInfo.ex.targetReps.max,
                  notes: val,
                });
              }
              setValues(
                initialValues(
                  workout,
                  workout.sessions[workout.sessions.length - 1] || null
                )
              );
              setPromptInfo(null);
            }}
          />
        )}
      {isOpen && promptInfo?.mode === "edit-target" && (
        <EditTargetRepsModal
          open
          ex={promptInfo.ex}
          onCancel={() => setPromptInfo(null)}
          onSubmit={({ min, max }) => {
            const ex = promptInfo.ex;
            editExercise(wid, ex.id, {
              name: ex.name,
              sets: ex.sets,
              min,
              max,
              notes: ex.notes,
            });
            setPromptInfo(null);
          }}
        />
      )}
      {isConfirm && confirmInfo?.ex && !confirmInfo?.removeSet && (
        <Confirm
          open
          title="Delete Exercise"
          message="Delete this exercise?"
          onCancel={() => setConfirmInfo(null)}
          onConfirm={() => {
            deleteExercise(wid, confirmInfo.ex.id);
            setConfirmInfo(null);
          }}
        />
      )}
      {isConfirm && confirmInfo?.removeSet && (
        <Confirm
          open
          title="Remove Set"
          message={`Remove set #${confirmInfo.removeSet.index + 1}?`}
          confirmLabel="Remove"
          onCancel={() => setConfirmInfo(null)}
          onConfirm={() => {
            const { ex, index } = confirmInfo.removeSet;
            // Update local UI state
            setValues((v) => {
              const c = structuredClone(v);
              if (c[ex.id].length > 1) {
                c[ex.id].splice(index, 1);
              }
              return c;
            });
            // Reindex doneMap for that exercise
            setDoneMap((m) => {
              const next = { ...m };
              const count = values[ex.id].length;
              for (let i = index; i < count; i++) {
                delete next[`${ex.id}-${i}`];
              }
              return next;
            });
            // Persist removal
            removeExerciseSet(wid, ex.id, index);
            setConfirmInfo(null);
          }}
        />
      )}
    </>
  );
}

function AddExerciseModal({ open, onCancel, onSubmit }) {
  const [name, setName] = useState("");
  const [setsStr, setSetsStr] = useState("3");
  const [minStr, setMinStr] = useState("10");
  const [maxStr, setMaxStr] = useState("20");
  const [notes, setNotes] = useState("");
  const sets = parseInt(setsStr, 10);
  const min = parseInt(minStr, 10);
  const max = parseInt(maxStr, 10);
  const valid =
    name.trim().length > 0 &&
    Number.isFinite(sets) &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    sets >= 1 &&
    min >= 1 &&
    max >= min;
  return (
    <Confirm
      open={open}
      title="Add Exercise"
      message={
        <div className="stack" style={{ gap: 8 }}>
          <label className="muted">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <div className="row gap">
            <div style={{ flex: 1 }}>
              <label className="muted">Sets</label>
              <input
                inputMode="numeric"
                value={setsStr}
                onChange={(e) => setSetsStr(e.target.value)}
                placeholder="3"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="muted">Min reps</label>
              <input
                inputMode="numeric"
                value={minStr}
                onChange={(e) => setMinStr(e.target.value)}
                placeholder="5"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="muted">Max reps</label>
              <input
                inputMode="numeric"
                value={maxStr}
                onChange={(e) => setMaxStr(e.target.value)}
                placeholder="8"
              />
            </div>
          </div>
          <label className="muted">Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      }
      confirmLabel="Add"
      cancelLabel="Cancel"
      onCancel={onCancel}
      onConfirm={() => {
        if (!valid) return;
        const clampedSets = Math.max(1, Math.min(20, sets));
        onSubmit({
          name: name.trim(),
          sets: clampedSets,
          min,
          max,
          notes: notes.trim(),
        });
      }}
    />
  );
}

function EditTargetRepsModal({ open, ex, onCancel, onSubmit }) {
  const [minStr, setMinStr] = useState(String(ex?.targetReps?.min ?? 1));
  const [maxStr, setMaxStr] = useState(String(ex?.targetReps?.max ?? 1));
  useEffect(() => {
    setMinStr(String(ex?.targetReps?.min ?? 1));
    setMaxStr(String(ex?.targetReps?.max ?? 1));
  }, [ex]);
  const minNum = Number.parseInt(minStr, 10);
  const maxNum = Number.parseInt(maxStr, 10);
  const valid =
    Number.isFinite(minNum) &&
    Number.isFinite(maxNum) &&
    minNum >= 1 &&
    maxNum >= minNum;
  return (
    <Confirm
      open={open}
      title={`Edit target reps — ${ex?.name ?? ""}`}
      message={
        <div className="row gap">
          <div style={{ flex: 1 }}>
            <label className="muted">Min reps</label>
            <input
              inputMode="numeric"
              value={minStr}
              onChange={(e) => setMinStr(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="muted">Max reps</label>
            <input
              inputMode="numeric"
              value={maxStr}
              onChange={(e) => setMaxStr(e.target.value)}
              placeholder="e.g. 8"
            />
          </div>
        </div>
      }
      confirmLabel="Save"
      cancelLabel="Cancel"
      onCancel={onCancel}
      onConfirm={() => {
        if (!valid) return;
        onSubmit({ min: minNum, max: maxNum });
      }}
    />
  );
}
