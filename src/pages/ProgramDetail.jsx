import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Button from "../ui/components/Button";
import { useStorage } from "../utils/storageContext.jsx";
import { MoreVertical, Plus, Edit3, Trash2 } from "lucide-react";
import { Confirm, Prompt } from "../ui/components/Modal.jsx";

export default function ProgramDetail() {
  const { pid } = useParams();
  const nav = useNavigate();
  const { data, addWorkout, editWorkoutMeta, deleteWorkout } = useStorage();
  const [menuOpen, setMenuOpen] = React.useState(null); // wid
  const [promptInfo, setPromptInfo] = React.useState(null); // { wid, name, label (notes) }
  const [confirmInfo, setConfirmInfo] = React.useState(null); // { wid }
  const program = data.programs.find((p) => p.id === pid);

  if (!program) {
    return (
      <div className="container">
        <p className="muted">Program not found.</p>
        <Button variant="ghost" onClick={() => nav(-1)}>
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="section-header">
        <div className="breadcrumbs">
          <Link to="/">Programs</Link> <span>/</span>{" "}
          <span>{program.name}</span>
        </div>
        <div className="row gap">
          <Button
            onClick={() => setPromptInfo({ wid: null, name: "", label: "" })}
          >
            <Plus size={16} /> New Workout
          </Button>
        </div>
      </div>

      {program.workouts.length === 0 ? (
        <p className="muted">No workouts in this program yet.</p>
      ) : (
        <div className="grid">
          {program.workouts.map((wid) => {
            const w = data.workouts[wid];
            return (
              <div
                key={wid}
                className="card card-click"
                onClick={() => nav(`/workout/${wid}`)}
              >
                <div className="card-head">
                  <h3>{w.name}</h3>
                  <div
                    className="head-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="badge">
                      {w.exercises.length} exercises
                    </span>
                    <div className="menu">
                      <Button
                        variant="icon"
                        onClick={() =>
                          setMenuOpen(menuOpen === wid ? null : wid)
                        }
                        aria-label="More"
                      >
                        <MoreVertical size={16} />
                      </Button>
                      {menuOpen === wid && (
                        <div className="menu-panel" role="menu">
                          <button
                            className="menu-item"
                            onClick={() => {
                              setMenuOpen(null);
                              setPromptInfo({
                                wid,
                                name: w.name,
                                label: w.label || "",
                              });
                            }}
                          >
                            <Edit3 size={14} style={{ marginRight: 6 }} /> Edit
                          </button>
                          <button
                            className="menu-item"
                            onClick={() => {
                              setMenuOpen(null);
                              setConfirmInfo({ wid });
                            }}
                          >
                            <Trash2 size={14} style={{ marginRight: 6 }} />{" "}
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {w.label ? (
                  <div className="card-body">
                    <p className="muted no-margin">{w.label}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      <WorkoutModals
        promptInfo={promptInfo}
        setPromptInfo={setPromptInfo}
        confirmInfo={confirmInfo}
        setConfirmInfo={setConfirmInfo}
        programId={program.id}
        editWorkoutMeta={editWorkoutMeta}
        addWorkout={addWorkout}
        deleteWorkout={deleteWorkout}
      />
    </div>
  );
}

function WorkoutModals({
  promptInfo,
  setPromptInfo,
  confirmInfo,
  setConfirmInfo,
  programId,
  editWorkoutMeta,
  addWorkout,
  deleteWorkout,
}) {
  return (
    <>
      <Prompt
        open={!!promptInfo}
        title={promptInfo?.wid ? "Edit Workout" : "New Workout"}
        label="Workout name"
        defaultValue={promptInfo?.name || ""}
        onCancel={() => setPromptInfo(null)}
        onSubmit={(val) => {
          if (!val) return;
          if (!promptInfo?.wid) addWorkout(programId, { name: val, label: "" });
          else
            editWorkoutMeta(promptInfo.wid, {
              name: val,
              label: promptInfo.label || "",
            });
          setPromptInfo(null);
        }}
      />
      <Confirm
        open={!!confirmInfo}
        title="Delete Workout"
        message="Delete this workout?"
        onCancel={() => setConfirmInfo(null)}
        onConfirm={() => {
          deleteWorkout(programId, confirmInfo.wid);
          setConfirmInfo(null);
        }}
      />
    </>
  );
}
