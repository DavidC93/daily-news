"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "auto";

const THEME_EVENT = "theme-preference-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot(): Theme {
  return (localStorage.getItem("theme") as Theme | null) ?? "auto";
}

function getServerSnapshot(): Theme {
  return "auto";
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function apply(next: Theme) {
    if (next === "auto") {
      localStorage.removeItem("theme");
      document.documentElement.removeAttribute("data-theme");
    } else {
      localStorage.setItem("theme", next);
      document.documentElement.setAttribute("data-theme", next);
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  const options: { value: Theme; label: string }[] = [
    { value: "light", label: "בהיר" },
    { value: "auto", label: "אוטומטי" },
    { value: "dark", label: "כהה" },
  ];

  return (
    <div className="flex items-center gap-1 text-xs text-ink-faint">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => apply(opt.value)}
          aria-pressed={theme === opt.value}
          className={`px-2 py-1 rounded-sm transition-colors cursor-pointer ${
            theme === opt.value ? "text-accent font-medium" : "hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
