import { LegalPageShell } from "./LegalPageShell";

type LegalDocumentSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalDocumentPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  sections: LegalDocumentSection[];
};

export function LegalDocumentPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  sections,
}: LegalDocumentPageProps) {
  return (
    <LegalPageShell
      eyebrow={eyebrow}
      title={title}
      description={description}
      lastUpdated={lastUpdated}
    >
      <div className="space-y-5">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-semibold text-primary sm:text-xl">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-7 text-secondary">
              {section.paragraphs.map((paragraph, index) => (
                <p key={`${section.id}-paragraph-${index}`}>{paragraph}</p>
              ))}
            </div>

            {section.bullets && section.bullets.length > 0 ? (
              <ul className="mt-4 space-y-3 pl-5 text-sm leading-7 text-secondary">
                {section.bullets.map((bullet, index) => (
                  <li key={`${section.id}-bullet-${index}`} className="list-disc">
                    {bullet}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </LegalPageShell>
  );
}
