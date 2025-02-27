export interface SearchParams {
  query: string;
  filters: SearchFilters;
  sort: SortOption;
  page: number;
  limit: number;
}

export interface SearchFilters {
  duration?: 'short' | 'medium' | 'long';
  language?: string[];
  theme?: string[];
  ageRange?: [number, number];
  dateRange?: [string, string];
  isFavorite?: boolean;
}

export type SortOption = {
  field: 'date' | 'title' | 'duration' | 'plays';
  order: 'asc' | 'desc';
}