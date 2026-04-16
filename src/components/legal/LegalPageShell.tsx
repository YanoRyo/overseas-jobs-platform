type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export function LegalPageShell({
  eyebrow,
  title,
  description,
  lastUpdated,
  children,
}: LegalPageShellProps) {
  return (
    <div className="bg-[#fafafb]">
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:py-12">
        <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary sm:text-base">
            {description}
          </p>
          <p className="mt-3 text-xs text-muted sm:text-sm">{lastUpdated}</p>
        </div>

        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
