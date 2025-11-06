"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    const root = document.documentElement;

    if (savedTheme && savedTheme !== "system") {
      root.setAttribute("data-theme", savedTheme);
    } else {
      root.removeAttribute("data-theme");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const theme = localStorage.getItem("theme");
      if (!theme || theme === "system") {
        root.removeAttribute("data-theme");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return <>{children}</>;
}