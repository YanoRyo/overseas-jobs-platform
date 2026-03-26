// サーバーサイドでのみ使用。金額は必ずサーバーで算出する（クライアントからの金額は信用しない）
// hourlyRateCents: 時給（セント単位。$25.00 = 2500）
// durationMinutes: レッスン時間（分）
// 戻り値: セント単位の金額（Stripeに渡す値）
export function calculateLessonFee(
  hourlyRateCents: number,
  durationMinutes: number
): number {
  return Math.ceil((hourlyRateCents * durationMinutes) / 60);
}
