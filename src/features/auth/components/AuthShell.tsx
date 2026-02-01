"use client";

import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

export const AuthShell = ({ title, description, children }: AuthShellProps) => {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white"
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-lg backdrop-blur">
          <div className="mb-8 space-y-3 text-center">
            <h1 className="text-3xl font-semibold text-primary">{title}</h1>
            {description}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};
