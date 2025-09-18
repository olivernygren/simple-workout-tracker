import React from "react";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  const classes = ["btn"];
  if (variant === "icon") {
    classes.push("btn-icon", "btn-ghost");
  } else {
    classes.push(`btn-${variant}`);
  }
  if (size !== "md") classes.push(`btn-${size}`);
  if (className) classes.push(className);
  const btnRef = React.useRef(null);

  const createRipple = (evt) => {
    const el = btnRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.6;
    const x = (evt?.clientX ?? rect.left + rect.width / 2) - rect.left;
    const y = (evt?.clientY ?? rect.top + rect.height / 2) - rect.top;
    const span = document.createElement("span");
    span.className = "ripple";
    span.style.width = span.style.height = `${size}px`;
    span.style.left = `${x - size / 2}px`;
    span.style.top = `${y - size / 2}px`;
    el.appendChild(span);
    const cleanup = () => {
      span.removeEventListener("animationend", cleanup);
      span.remove();
    };
    span.addEventListener("animationend", cleanup);
  };

  const handlePointerDown = (e) => {
    try {
      createRipple(e);
    } catch {}
    if (typeof props.onPointerDown === "function") props.onPointerDown(e);
  };

  return (
    <button
      ref={btnRef}
      className={classes.join(" ")}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
    </button>
  );
}
