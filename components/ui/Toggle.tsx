"use client";

import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  size?: "sm" | "md";
}

export default function Toggle({ checked, onChange, label, size = "md" }: ToggleProps) {
  const sizes = {
    sm: { track: "h-4 w-7", thumb: "h-3 w-3", translate: "translate-x-3" },
    md: { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" },
  };
  const s = sizes[size];

  return (
    <label className="flex cursor-pointer items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none",
          s.track,
        )}
        style={{ backgroundColor: checked ? "#1a1a1a" : "#d4d0c8" }}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-white shadow-sm transition-transform duration-200",
            s.thumb,
            checked ? s.translate : "translate-x-0"
          )}
        />
      </button>
      {label && <span className="text-sm" style={{ color: "#555" }}>{label}</span>}
    </label>
  );
}
