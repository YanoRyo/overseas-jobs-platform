export default function SearchFilters() {
  const hitCount = 5;

  return (
    <div className="flex flex-col gap-4 w-full max-w-screen-md mx-auto px-4 sm:px-6">
      {/* 上段（PC） */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4">
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-base w-full">
          <option value="">国で絞り込む</option>
          <option value="Japan">日本</option>
          <option value="South Korea">韓国</option>
          <option value="USA">アメリカ</option>
          <option value="Taiwan">台湾</option>
          <option value="Mexico">メキシコ</option>
        </select>

        <select className="border border-gray-300 rounded-lg px-3 py-2 text-base w-full">
          <option value="">話せる言語で絞り込む</option>
          <option value="Japanese">日本語</option>
          <option value="English">英語</option>
          <option value="Korean">韓国語</option>
          <option value="Spanish">スペイン語</option>
          <option value="Mandarin">中国語</option>
          <option value="German">ドイツ語</option>
        </select>

        <select className="border border-gray-300 rounded-lg px-3 py-2 text-base w-full">
          <option value="">職種で絞り込む</option>
          <option value="Engineer">エンジニア</option>
          <option value="UX Designer">UXデザイナー</option>
          <option value="Sales Manager">営業マネージャー</option>
          <option value="Product Manager">プロダクトマネージャー</option>
          <option value="English Teacher">英語教師</option>
        </select>
      </div>

      {/* 上段（モバイル） */}
      <div className="md:hidden flex items-start gap-2">
        {/* 国セレクト：90% */}
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-base w-full">
          <option value="">国で絞り込む</option>
          <option value="Japan">日本</option>
          <option value="South Korea">韓国</option>
          <option value="USA">アメリカ</option>
          <option value="Taiwan">台湾</option>
          <option value="Mexico">メキシコ</option>
        </select>

        {/* ハンバーガーメニュー：10% */}
        <details className="relative w-10 shrink-0">
          <summary className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer select-none">
            ☰
          </summary>
          <div className="absolute z-10 right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex flex-col gap-3">
            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">言語で絞り込む</option>
              <option value="Japanese">日本語</option>
              <option value="English">英語</option>
              <option value="Korean">韓国語</option>
              <option value="Spanish">スペイン語</option>
              <option value="Mandarin">中国語</option>
              <option value="German">ドイツ語</option>
            </select>

            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">職種で絞り込む</option>
              <option value="Engineer">エンジニア</option>
              <option value="UX Designer">UXデザイナー</option>
              <option value="Sales Manager">営業マネージャー</option>
              <option value="Product Manager">プロダクトマネージャー</option>
              <option value="English Teacher">英語教師</option>
            </select>

            <select className="border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="">評価順</option>
              <option value="high">★ 高い順</option>
              <option value="low">★ 低い順</option>
            </select>

            <input
              type="text"
              placeholder="キーワード検索"
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </details>
      </div>

      {/* 下段（件数 + PCのみの評価順・キーワード検索） */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="text-lg sm:text-xl font-bold text-gray-800 whitespace-nowrap">
          {hitCount}件ヒット
        </div>

        {/* 評価順 + キーワード検索（PC表示） */}
        <div className="hidden md:flex gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-base w-40">
            <option value="">評価順</option>
            <option value="high">★ 高い順</option>
            <option value="low">★ 低い順</option>
          </select>

          <input
            type="text"
            placeholder="キーワードで検索（例：ビザ、IT、英語）"
            className="border border-gray-300 rounded-lg px-3 py-2 text-base w-60"
          />
        </div>
      </div>
    </div>
  );
}
