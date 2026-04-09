// 既存定数を再エクスポート
export { COUNTRIES, LANGUAGES } from "@/features/shared/constants/options";

// ソートオプション
export const SORT_OPTIONS = [
  { value: "", label: "Sort by rating" },
  { value: "high", label: "Highest rated" },
  { value: "low", label: "Lowest rated" },
] as const;
