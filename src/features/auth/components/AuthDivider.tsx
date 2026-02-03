"use client";

type AuthDividerProps = {
  label?: string;
};

export const AuthDivider = ({ label = "or" }: AuthDividerProps) => {
  return (
    <div className="flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs uppercase tracking-[0.2em] text-muted">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
};
