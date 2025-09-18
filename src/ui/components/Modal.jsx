import React from "react";

export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Confirm({
  open,
  title = "Confirm",
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  if (!open) return null;
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="muted" style={{ marginBottom: 12 }}>
        {message}
      </p>
      <div className="row gap">
        <button className="btn btn-ghost" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button className="btn btn-danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export function Prompt({
  open,
  title,
  label,
  defaultValue = "",
  onSubmit,
  onCancel,
}) {
  const [value, setValue] = React.useState(defaultValue);
  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, open]);
  if (!open) return null;
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <label className="muted" style={{ display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <div className="row gap" style={{ marginTop: 12 }}>
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" onClick={() => onSubmit(value)}>
          Save
        </button>
      </div>
    </Modal>
  );
}
