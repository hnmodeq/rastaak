"use client";

import { useState } from "react";

const CHIPS = [
  { label: "AI & Accelerated Computing", icon: "M4 4h16v16H4zM9 4v16M4 9h16" },
  { label: "Backup", icon: "M4 6h16M4 12h16M4 18h10" },
  { label: "High-Performance Workloads", icon: "M13 2L3 14h7l-1 8 11-13h-7l1-8z" },
  { label: "Ransomware Protection", icon: "M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" },
  { label: "Video Surveillance", icon: "M12 12a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" },
  { label: "Virtual Desktop", icon: "M2 5h20v14H2zM2 10h20" },
  { label: "User Directories", icon: "M9 8a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7zM2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" },
];

export default function UseCaseChips() {
  const [active, setActive] = useState(0);
  return (
    <div className="use-chips reveal reveal-d2">
      {CHIPS.map((c, i) => (
        <button
          key={c.label}
          type="button"
          className={`chip${i === active ? " active" : ""}`}
          onClick={() => setActive(i)}
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round">
            <path d={c.icon} />
          </svg>
          {c.label}
        </button>
      ))}
    </div>
  );
}
