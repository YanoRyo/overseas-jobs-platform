export type MentorDetailModel = {
  id: string;
  name: string;
  country: string;
  bio: string;
  avatarUrl: string;
  price: number;
  rating: number;
  reviewCount: number;
  subjects: string[];
  ratingsDetail: Record<string, number>;
  timezone: string;
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isEnabled: boolean;
  }[];
  reviews: {
    id: string;
    author: string;
    rating: number;
    comment: string;
  }[];
  lessons: number;
  specialties: string[];
  intro: string;
  introVideoUrl: string;
  workExperience: string;
  hasNoDegree: boolean;
  university: string | null;
  degree: string | null;
  degreeType: string | null;
  specialization: string | null;
  spokenLanguages: {
    name: string;
    level: string;
  }[];
};
