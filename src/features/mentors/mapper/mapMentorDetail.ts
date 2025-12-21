import { MentorDetailModel } from "../types";

export const mapMentorDetail = (mentor: any): MentorDetailModel => ({
  id: mentor.id,
  name: mentor.name,
  country: mentor.country_code,
  bio: mentor.bio,
  avatarUrl: mentor.avatar_url,
  price: Number(mentor.hourly_rate),
  rating: Number(mentor.rating_avg),
  reviewCount: mentor.review_count,
  subjects: mentor.subjects ?? [],
  ratingsDetail: mentor.ratings_detail ?? {
    教え方: 4.8,
    分かりやすさ: 4.7,
    対応力: 4.9,
    満足度: 4.8,
  },
  reviews: mentor.reviews ?? [
    {
      id: "1",
      author: "田中",
      rating: 5,
      comment: "とても分かりやすく丁寧でした！",
    },
    {
      id: "2",
      author: "佐藤",
      rating: 4,
      comment: "実践的なアドバイスが多かったです。",
    },
  ],
  lessons: mentor.lessons_count ?? 0,
  specialties: ["英会話", "ビジネス英語", "初級者向け英語", "留学準備"],
  intro: "様々な科目に経験を持つ講師、4年の経験があります。",
  introVideoUrl: "https://placehold.co/400x250?text=Intro+Video",
  spokenLanguages: [
    { name: "英語", level: "ネイティブ" },
    { name: "日本語", level: "ビジネス" },
  ],
});
