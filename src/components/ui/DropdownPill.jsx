import React, { useEffect, useMemo, useRef, useState } from "react";

function ChevronIcon({ open }) {
  return (
    <svg
      className={`chev-icon${open ? " open" : ""}`}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Reusable, theme-styled dropdown that behaves like a pill button. */
export default function DropdownPill({ value, options, onChange, className = "" }) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const indexOf = useMemo(
    () => Math.max(0, options.findIndex(o => o.value === value)),
    [options, value]
  );
  const [hi, setHi] = useState(indexOf); // highlighted

  useEffect(() => setHi(indexOf), [indexOf]);

  // close on outside / handle keyboard
  useEffect(() => {
    const onOutside = (e) => {
      if (!open) return;
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    };
    const onKeys = (e) => {
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setHi(i => (i + 1) % options.length); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setHi(i => (i - 1 + options.length) % options.length); }
      if (e.key === "Enter")     { e.preventDefault(); onChange(options[hi].value); setOpen(false); }
    };
    window.addEventListener("pointerdown", onOutside);
    window.addEventListener("keydown", onKeys);
    return () => {
      window.removeEventListener("pointerdown", onOutside);
      window.removeEventListener("keydown", onKeys);
    };
  }, [open, options, hi, onChange]);

  const current = options[indexOf]?.label ?? value;

  return (
    <div ref={wrapRef} className={`dp-wrap ${className}`}>
      <button
        type="button"
        className="pill pill-orange dp-trigger"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="select-label">{current}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="dp-menu" role="listbox" aria-activedescendant={`opt-${options[hi]?.value}`}>
          {options.map((o, i) => (
            <div
              id={`opt-${o.value}`}
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`dp-item${o.value === value ? " is-selected" : ""}${i === hi ? " is-active" : ""}`}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false); }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
