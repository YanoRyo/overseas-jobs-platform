-- ==========================================================================
-- Security Fix: bookings と mentors の RLS ポリシーを厳格化
-- ==========================================================================
-- 前提: 予約作成(INSERT)と予約スロット取得(SELECT)は既にAPIルート経由に移行済み。
--       クライアントからの直接操作は不要なため、RLSを厳格化する。

-- --------------------------------------------------------------------------
-- bookings: SELECT を所有者/メンターのみに制限
-- --------------------------------------------------------------------------
-- 旧ポリシー: USING (true) → 全認証ユーザーが全予約を閲覧可能だった
DROP POLICY IF EXISTS "Authenticated users can read bookings" ON "public"."bookings";

-- 予約した学生本人のみ自分の予約を閲覧可能
CREATE POLICY "Booking owner can read own bookings"
  ON "public"."bookings"
  FOR SELECT
  TO "authenticated"
  USING ("user_id" = "auth"."uid"());

-- メンターは自分に割り当てられた予約を閲覧可能
CREATE POLICY "Mentor can read assigned bookings"
  ON "public"."bookings"
  FOR SELECT
  TO "authenticated"
  USING (
    "mentor_id" IN (
      SELECT "id" FROM "public"."mentors" WHERE "user_id" = "auth"."uid"()
    )
  );

-- --------------------------------------------------------------------------
-- bookings: INSERT をクライアント直実行不可に（APIルート経由のservice roleのみ）
-- --------------------------------------------------------------------------
-- 旧ポリシー: user_id = auth.uid() のみチェック → mentor_id/expires_at が任意に設定可能だった
DROP POLICY IF EXISTS "Users can insert their own bookings" ON "public"."bookings";

-- INSERT ポリシーなし = authenticated ユーザーからの直接INSERTは暗黙的に拒否
-- 予約作成は POST /api/bookings (service role) 経由でのみ実行される

-- --------------------------------------------------------------------------
-- bookings: UPDATE/DELETE は authenticated に開けない
-- --------------------------------------------------------------------------
-- 全 UPDATE は service role (webhook, admin API) 経由で実行される。
-- UPDATE ポリシーを追加すると所有者が status/mentor_id/expires_at/meeting_* を
-- 自由に変更可能になり、新たな権限昇格面を作るため意図的に追加しない。

-- --------------------------------------------------------------------------
-- mentors: INSERT を自分のプロフィールのみに制限
-- --------------------------------------------------------------------------
-- 旧ポリシー: WITH CHECK (true) → 任意の user_id でメンターレコード作成可能だった
DROP POLICY IF EXISTS "Allow authenticated insert" ON "public"."mentors";

CREATE POLICY "Allow authenticated insert own profile"
  ON "public"."mentors"
  FOR INSERT
  TO "authenticated"
  WITH CHECK ("auth"."uid"() = "user_id");
