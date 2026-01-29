export type SortOrder = 'high' | 'low' | '';

export type SearchFilters = {
  country: string;       // country_code (例: 'JP', 'US')
  language: string;      // language_name (例: 'Japanese')
  sortByRating: SortOrder;
  keyword: string;       // expertise, headline, introduction を検索
};

export const initialFilters: SearchFilters = {
  country: '',
  language: '',
  sortByRating: '',
  keyword: '',
};
