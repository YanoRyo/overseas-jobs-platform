"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    
    if (newTheme === "system") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", newTheme);
    }
  };

  const toggleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const isDark = theme === "dark" || 
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-surface hover:bg-surface-hover border border-border transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Moon className="w-5 h-5 text-primary" />
      ) : (
        <Sun className="w-5 h-5 text-primary" />
      )}
    </button>
  );
}