import { supabase } from "@/lib/supabase";

export default async function MentorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  // DBから1件取得
  const { data, error } = await supabase
    .from("mentors")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching mentor:", error?.message);
    return <div className="p-6">メンターが見つかりませんでした。</div>;
  }

  // camelCase変換 + デザイン用の追加フィールド
  const displayMentor = {
    id: data.id,
    name: data.name,
    country: data.country,
    location: data.location,
    languages: data.languages,
    job: data.job,
    bio: data.bio,
    avatarUrl: data.avatar_url,
    price: data.price,
    reviews: data.reviews,
    rating: data.rating,
    createdAt: data.created_at,

    // 追加
    intro: "海外キャリア・スキルアップをサポートします！",
    reviewList: [
      {
        id: 1,
        name: "Test User",
        date: "2025年9月",
        text: "とても丁寧でわかりやすいメンターでした！",
      },
    ],
    stats: {
      rating: data.rating,
      lessons: data.reviews, // DB の reviews 件数をレッスン数として利用
      price:
        typeof data.price === "string"
          ? Number(data.price.replace(/[^0-9]/g, "")) || 2000
          : data.price,
    },
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 左カラム */}
      <div className="md:col-span-2">
        <div className="flex items-start gap-6">
          <img
            src={displayMentor.avatarUrl}
            alt={displayMentor.name}
            className="w-48 h-48 object-cover rounded-lg shadow-md"
          />
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {displayMentor.name} <span>{displayMentor.country}</span>
            </h1>
            <p className="text-gray-600 mt-2">{displayMentor.intro}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">自己紹介</h2>
          <p className="mt-2 text-gray-700 whitespace-pre-wrap">
            {displayMentor.bio}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold">レビュー</h2>
          <ul className="mt-2 space-y-4">
            {displayMentor.reviewList.map((review) => (
              <li key={review.id} className="border-b pb-2">
                <p className="font-medium">{review.name}</p>
                <p className="text-sm text-gray-500">{review.date}</p>
                <p className="mt-1 text-gray-700">{review.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 右カラム */}
      <div className="sticky top-6 h-fit border rounded-lg shadow p-4">
        <img
          src={displayMentor.avatarUrl}
          alt={displayMentor.name}
          className="rounded-lg w-full h-40 object-cover"
        />
        <div className="mt-4">
          <p className="font-bold text-lg">⭐ {displayMentor.stats.rating}</p>
          <p className="text-sm text-gray-500">
            {displayMentor.stats.lessons} レッスン
          </p>
          <p className="font-semibold mt-2">
            ¥{displayMentor.stats.price.toLocaleString()} / 50分
          </p>
          <button className="mt-4 w-full bg-pink-500 text-white py-2 rounded-lg font-semibold">
            体験レッスンを予約
          </button>
        </div>
      </div>
    </div>
  );
}
