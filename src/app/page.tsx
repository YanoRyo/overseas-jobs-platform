"use client";
import Image from "next/image";
import { useState } from "react";
import Flag from "react-world-flags";
import { Mentor } from "../types/mentor";
import { countryCodeMap } from "../data/mentors";
import { mentors } from "../data/mentors";
import SearchFilters from "../components/SearchFilters";
import MentorCard from "../components/MentorCard";
import BookingModal from "../components/BookingModal";

export default function Home() {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  return (
    <div className="flex flex-col gap-6 p-6 max-w-screen-md mx-auto w-full">
      {/* 検索フィルター */}
      <SearchFilters />
      {/* メンタリスト */}
      {mentors.map((mentor) => (
        <MentorCard
          key={mentor.id}
          mentor={mentor}
          onBook={() => setSelectedMentor(mentor)}
        />
      ))}
      {/* モーダル */}
      {selectedMentor && (
        <BookingModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          isOpen={true}
        />
      )}
    </div>
  );
}
