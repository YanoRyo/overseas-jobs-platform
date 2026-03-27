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
    <nav className="mt-2 w-full lg:mt-4 lg:w-56 lg:flex-shrink-0">
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-3 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const selected = item.id === active;
          return (
            <li key={item.id} className="flex-shrink-0 lg:block">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                className={`relative rounded-full px-4 py-2 text-left text-base font-medium transition lg:w-full lg:rounded-none lg:px-0 lg:pl-4 lg:py-0 lg:text-[18px] ${
                  selected
                    ? "bg-[#eef2ff] text-[#1f1f2d] lg:bg-transparent"
                    : "text-[#52576a] hover:text-[#1f1f2d]"
                }`}
              >
                {selected && (
                  <span className="hidden lg:block absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 bg-[#2563eb]" />
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
