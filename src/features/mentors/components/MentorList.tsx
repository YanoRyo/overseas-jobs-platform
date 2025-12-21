"use client";
import { useState } from "react";
import { useMentorList } from "../hooks/useMentorList";
import SearchFilters from "@/components/SearchFilters";
import MentorCard from "@/components/MentorCard";
import BookingModal from "@/components/BookingModal";
import { MentorListItem } from "../types";

export function MentorList() {
  const { mentors, loading, error } = useMentorList();
  const [selectedMentor, setSelectedMentor] = useState<MentorListItem | null>(
    null
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-md mx-auto w-full">
      {/* 検索フィルター */}
      <SearchFilters />

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading &&
        mentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            onBook={() => setSelectedMentor(mentor)}
          />
        ))}

      {selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          isOpen
          onClose={() => setSelectedMentor(null)}
        />
      )}
    </div>
  );
}
