"use client";

type NavItem<T extends string> = {
  id: T;
  label: string;
};

type Props<T extends string> = {
  items: NavItem<T>[];
  active: T;
  onChange: (id: T) => void;
};

export function SettingsNavBase<T extends string>({
  items,
  active,
  onChange,
}: Props<T>) {
  return (
    <nav className="mt-4 w-56">
      <ul className="space-y-3">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={`relative w-full pl-4 text-left text-[18px] font-medium transition ${
                  selected
                    ? "text-[#1f1f2d]"
                    : "text-[#52576a] hover:text-[#1f1f2d]"
                }`}
              >
                {selected && (
                  <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 bg-[#2563eb]" />
                )}
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
