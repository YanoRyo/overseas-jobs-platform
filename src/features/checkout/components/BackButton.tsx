"use client";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="absolute top-0 -left-12 p-2 text-gray-400 hover:text-gray-600"
    >
      <ChevronLeft size={32} />
    </button>
  );
};
