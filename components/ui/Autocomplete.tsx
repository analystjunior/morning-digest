"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const DARK   = "#1a1a1a";
const BORDER = "#d4d0c8";
const BG     = "#E8E6DF";

interface DropdownPos {
  top: number;
  left: number;
  width: number;
  openAbove: boolean;
}

interface AutocompleteProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  fetchSuggestions: (query: string) => Promise<T[]>;
  renderSuggestion: (item: T) => React.ReactNode;
  placeholder?: string;
  inputStyle?: React.CSSProperties;
  debounceMs?: number;
}

export function Autocomplete<T>({
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  renderSuggestion,
  placeholder,
  inputStyle,
  debounceMs = 300,
}: AutocompleteProps<T>) {
  const [suggestions, setSuggestions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calcPos = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    const estimatedH = Math.min(suggestions.length, 5) * 37;
    const spaceBelow = window.innerHeight - r.bottom;
    const openAbove = spaceBelow < estimatedH + 8 && r.top > estimatedH + 8;
    setPos({ top: openAbove ? r.top : r.bottom, left: r.left, width: r.width, openAbove });
  }, [suggestions.length]);

  useEffect(() => {
    if (!open) return;
    calcPos();
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open, calcPos]);

  // Close only when mousedown happens outside BOTH the input and the dropdown.
  // Checking the dropdown ref prevents the dropdown from being removed from the
  // DOM before the subsequent click event fires on a suggestion button.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (inputRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      onChange(q);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (!q.trim()) { setSuggestions([]); setOpen(false); return; }
      timerRef.current = setTimeout(async () => {
        const results = await fetchSuggestions(q);
        setSuggestions(results);
        setOpen(results.length > 0);
      }, debounceMs);
    },
    [onChange, fetchSuggestions, debounceMs]
  );

  const handleSelect = (item: T) => {
    onSelect(item);
    setSuggestions([]);
    setOpen(false);
  };

  const dropdownStyle: React.CSSProperties = pos
    ? {
        position: "fixed",
        left: pos.left,
        width: pos.width,
        ...(pos.openAbove
          ? { bottom: window.innerHeight - pos.top + 3 }
          : { top: pos.top + 3 }),
        backgroundColor: "white",
        border: `1px solid ${BORDER}`,
        borderRadius: "4px",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0,0,0,0.10)",
        overflow: "hidden",
      }
    : { display: "none" };

  return (
    <>
      <input
        ref={inputRef}
        style={inputStyle}
        className="rounded"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && pos && (
        <div ref={dropdownRef} style={dropdownStyle}>
          {suggestions.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(item)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                fontSize: "13px",
                color: DARK,
                backgroundColor: "white",
                border: "none",
                borderTop: i > 0 ? "1px solid #f0ede6" : "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = BG;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "white";
              }}
            >
              {renderSuggestion(item)}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
