"use client";
import { useState, useCallback } from "react";
import { searchMentors } from "@/lib/supabase/mentors";
import { mapMentorList } from "../mapper/mapMentorList";
import { MentorListItem } from "../types";
import { SearchFilters, initialFilters } from "../types/searchFilters";

export const useMentorSearch = () => {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: queryError } = await searchMentors({
      country: filters.country || undefined,
      language: filters.language || undefined,
      sortByRating: filters.sortByRating || undefined,
      keyword: filters.keyword || undefined,
    });

    if (queryError) {
      setError("検索に失敗しました");
      setMentors([]);
    } else {
      const mapped = (data || []).map((row) => mapMentorList(row));
      setMentors(mapped);
    }

    setLoading(false);
    setHasSearched(true);
  }, [filters]);

  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
    search,
    mentors,
    loading,
    error,
    hitCount: mentors.length,
    hasSearched,
  };
};
