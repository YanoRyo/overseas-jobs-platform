import { SearchFilters as SearchFiltersType } from "@/features/mentors/types/searchFilters";
import {
  COUNTRIES,
  LANGUAGES,
  SORT_OPTIONS,
} from "@/features/mentors/constants/searchOptions";

type Props = {
  filters: SearchFiltersType;
  onFilterChange: <K extends keyof SearchFiltersType>(
    key: K,
    value: SearchFiltersType[K]
  ) => void;
  onSearch: () => void;
  hitCount: number;
  loading?: boolean;
};

export default function SearchFilters({
  filters,
  onFilterChange,
  onSearch,
  hitCount,
  loading,
}: Props) {
  const selectBaseClass =
    "border border-border hover:border-border-hover rounded-lg px-3 py-2 text-base w-full bg-surface text-primary transition-colors";
  const selectSmallClass =
    "border border-border hover:border-border-hover rounded px-2 py-1 text-sm bg-surface text-primary transition-colors";

  return (
    <div className="flex flex-col gap-4 w-full max-w-screen-md mx-auto px-4 sm:px-6">
      {/* 上段（PC） */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          className={selectBaseClass}
          value={filters.country}
          onChange={(e) => onFilterChange("country", e.target.value)}
        >
          <option value="">国で絞り込む</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>

        <select
          className={selectBaseClass}
          value={filters.language}
          onChange={(e) => onFilterChange("language", e.target.value)}
        >
          <option value="">話せる言語で絞り込む</option>
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.name}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      {/* 上段（モバイル） */}
      <div className="md:hidden flex items-start gap-2">
        {/* 国セレクト */}
        <select
          className={selectBaseClass}
          value={filters.country}
          onChange={(e) => onFilterChange("country", e.target.value)}
        >
          <option value="">国で絞り込む</option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>

        {/* ハンバーガーメニュー */}
        <details className="relative w-10 shrink-0">
          <summary className="w-10 h-10 bg-surface-hover rounded-lg flex items-center justify-center cursor-pointer select-none text-primary">
            ☰
          </summary>
          <div className="absolute z-10 right-0 mt-2 w-64 bg-surface border border-border rounded-lg shadow-lg p-4 flex flex-col gap-3">
            <select
              className={selectSmallClass}
              value={filters.language}
              onChange={(e) => onFilterChange("language", e.target.value)}
            >
              <option value="">言語で絞り込む</option>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.name}>
                  {lang.name}
                </option>
              ))}
            </select>

            <select
              className={selectSmallClass}
              value={filters.sortByRating}
              onChange={(e) =>
                onFilterChange(
                  "sortByRating",
                  e.target.value as SearchFiltersType["sortByRating"]
                )
              }
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="キーワード検索"
              className={selectSmallClass}
              value={filters.keyword}
              onChange={(e) => onFilterChange("keyword", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearch();
              }}
            />

            <button
              onClick={onSearch}
              disabled={loading}
              className="bg-primary text-white px-3 py-2 rounded text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </details>
      </div>

      {/* 下段（件数 + PCのみの評価順・キーワード検索） */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">
          {hitCount}件ヒット
        </div>

        {/* 評価順 + キーワード検索 + 検索ボタン（PC表示） */}
        <div className="hidden md:flex gap-3 items-center">
          <select
            className="border border-border hover:border-border-hover rounded-lg px-3 py-2 text-base w-40 bg-surface text-primary transition-colors"
            value={filters.sortByRating}
            onChange={(e) =>
              onFilterChange(
                "sortByRating",
                e.target.value as SearchFiltersType["sortByRating"]
              )
            }
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="キーワードで検索（例：ビザ、IT、英語）"
            className="border border-border hover:border-border-hover rounded-lg px-3 py-2 text-base w-60 bg-surface text-primary transition-colors"
            value={filters.keyword}
            onChange={(e) => onFilterChange("keyword", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSearch();
            }}
          />

          <button
            onClick={onSearch}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
}
