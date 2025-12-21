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
  spokenLanguages: {
    name: string;
    level: string;
  }[];
};
