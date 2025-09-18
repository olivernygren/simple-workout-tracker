import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../ui/components/Button";
import { useStorage } from "../utils/storageContext.jsx";
import {
  MoreVertical,
  Upload,
  Download,
  Edit3,
  Trash2,
  Plus,
} from "lucide-react";
import { Confirm, Prompt } from "../ui/components/Modal.jsx";

export default function Programs() {
  const {
    data,
    addProgram,
    renameProgram,
    deleteProgram,
    exportProgram,
    importProgram,
  } = useStorage();
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(null); // programId or null
  const [promptInfo, setPromptInfo] = React.useState(null); // { pid, name }
  const [confirmInfo, setConfirmInfo] = React.useState(null); // { pid }
  const fileInputRef = React.useRef(null);

  return (
    <div className="container">
      <div className="section-header">
        <h1>Programs</h1>
        <div className="row gap">
          <Button onClick={() => setPromptInfo({ pid: null, name: "" })}>
            <Plus size={16} /> New Program
          </Button>
          <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                importProgram(text);
              } catch (err) {
                console.error("Import failed:", err);
                alert(
                  "Failed to import file. Please select a valid JSON export."
                );
              } finally {
                e.target.value = "";
              }
            }}
          />
        </div>
      </div>

      {data.programs.length === 0 ? (
        <p className="muted">No programs yet.</p>
      ) : (
        <div className="grid">
          {data.programs.map((p) => (
            <div
              key={p.id}
              className="card card-click"
              onClick={() => nav(`/program/${p.id}`)}
            >
              <div className="card-head">
                <h3>{p.name}</h3>
                <div
                  className="head-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="menu">
                    <Button
                      variant="icon"
                      onClick={() =>
                        setMenuOpen(menuOpen === p.id ? null : p.id)
                      }
                      aria-label="More"
                    >
                      <MoreVertical size={16} />
                    </Button>
                    {menuOpen === p.id && (
                      <div className="menu-panel" role="menu">
                        <button
                          className="menu-item"
                          onClick={() => {
                            setMenuOpen(null);
                            setPromptInfo({ pid: p.id, name: p.name });
                          }}
                        >
                          <Edit3 size={14} style={{ marginRight: 6 }} /> Rename
                        </button>
                        <button
                          className="menu-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpen(null);
                            exportProgram(p.id);
                          }}
                        >
                          <Download size={14} style={{ marginRight: 6 }} />{" "}
                          Export
                        </button>
                        <button
                          className="menu-item"
                          onClick={() => {
                            setMenuOpen(null);
                            setConfirmInfo({ pid: p.id });
                          }}
                        >
                          <Trash2 size={14} style={{ marginRight: 6 }} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {p.label ? (
                <div className="card-body">
                  <p className="muted no-margin">{p.label}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <ProgramsModals
        promptInfo={promptInfo}
        setPromptInfo={setPromptInfo}
        confirmInfo={confirmInfo}
        setConfirmInfo={setConfirmInfo}
        addProgram={addProgram}
        renameProgram={renameProgram}
        deleteProgram={deleteProgram}
      />
    </div>
  );
}

// Modals
export function ProgramsModals({
  promptInfo,
  setPromptInfo,
  confirmInfo,
  setConfirmInfo,
  addProgram,
  renameProgram,
  deleteProgram,
}) {
  return (
    <>
      <Prompt
        open={!!promptInfo}
        title={promptInfo?.pid ? "Rename Program" : "New Program"}
        label="Program name"
        defaultValue={promptInfo?.name || ""}
        onCancel={() => setPromptInfo(null)}
        onSubmit={(val) => {
          if (!val) return;
          if (!promptInfo?.pid) addProgram(val);
          else renameProgram(promptInfo.pid, val);
          setPromptInfo(null);
        }}
      />
      <Confirm
        open={!!confirmInfo}
        title="Delete Program"
        message="Delete program and its workouts? This cannot be undone."
        onCancel={() => setConfirmInfo(null)}
        onConfirm={() => {
          deleteProgram(confirmInfo.pid);
          setConfirmInfo(null);
        }}
      />
    </>
  );
}
