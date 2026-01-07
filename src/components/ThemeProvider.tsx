"use client";

import { useEffect } from "react";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // ライトテーマに固定
    const root = document.documentElement;
    root.setAttribute("data-theme", "light");
  }, []);

  return <>{children}</>;
}