-- ==========================================================================
-- Security Fix: conversation / message の RLS を厳格化し write は API/RPC のみに
-- ==========================================================================
-- 背景:
--   1) Supabase ダッシュボードで手動追加された "Allow select for authenticated users"
--      (cmd=ALL, USING=true, WITH CHECK=true) が、参加者制限ポリシーと OR 結合され
--      事実上 RLS を無効化していた (Advisor: 0024_permissive_rls_policy)。
--   2) 既存の conversation_insert/update_participants / message_insert_participants
--      を残すと API ルート (/api/messages/send) をバイパスして直接 INSERT/UPDATE
--      可能であり、last_message_at / unread_by / 通知の整合性を破壊できる。
--   3) conversation_update_participants は mentor_id/student_id 差し替えによる
--      会話乗っ取りを許していた。
--   4) RPC mark_conversation_as_read / mark_conversation_as_unread / archive_conversation
--      は SECURITY INVOKER で auth.uid() 検証もなく、p_user_id を任意指定できた。
-- 対応 (適用順注意: RPC を先に DEFINER 化してから write ポリシーを DROP する):
--   A) mark_conversation_as_read を SECURITY DEFINER + auth.uid() 検証に置換
--   B) mark_conversation_as_unread / archive_conversation を service_role 専用に
--   C) anon の table 直書き権限を REVOKE
--   D) 危険な ALL ポリシーと write ポリシーを DROP
--   E) 参加者ベース SELECT ポリシーを冪等補完
--   F) message(conversation_id, created_at DESC) index を追加

-- --------------------------------------------------------------------------
-- A. mark_conversation_as_read: SECURITY DEFINER 化 + auth.uid() 検証
-- --------------------------------------------------------------------------
-- 旧実装: SECURITY INVOKER, 引数 p_user_id をそのまま使用
--         → 自分が参加する会話で「相手の unread_by」を勝手に外せた
--         + 後段で UPDATE ポリシーを DROP するため INVOKER だと失敗する
-- 新実装: SECURITY DEFINER で RLS をバイパスしつつ、関数内部で
--         (a) 認証済みであること、(b) p_user_id が呼び出し元自身であること、
--         (c) 呼び出し元が当該 conversation の参加者であること
--         の 3 点を例外で明示的にチェックする。
--         WHERE 句で参加者条件を絞ると 0 行更新の "silent success" になり
--         監査・デバッグ性が低下するため、参加者判定は WHERE ではなく
--         FOUND によるポストチェックで forbidden を返す形に分離する。
CREATE OR REPLACE FUNCTION "public"."mark_conversation_as_read"(
  "p_conversation_id" uuid,
  "p_user_id" uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'mark_conversation_as_read: not authenticated'
      USING ERRCODE = '42501';
  END IF;
  IF p_user_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'mark_conversation_as_read: forbidden'
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.conversation
  SET unread_by = array_remove(unread_by, v_uid)
  WHERE id = p_conversation_id
    AND (mentor_id = v_uid OR student_id = v_uid);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'mark_conversation_as_read: forbidden or conversation not found'
      USING ERRCODE = '42501';
  END IF;
END;
$$;

ALTER FUNCTION "public"."mark_conversation_as_read"(uuid, uuid) OWNER TO "postgres";

-- PUBLIC / anon / service_role からデフォルト EXECUTE を剥がし、authenticated のみ許可。
-- この関数は auth.uid() による本人確認を前提とするため、ユーザーコンテキストを
-- 持たない service_role 経由では常に失敗する。Server-side で unread_by を更新したい
-- 場合は service_role で直接 UPDATE すれば RLS バイパスで可能なので、本関数を
-- service_role に開ける必要は無い。
REVOKE ALL ON FUNCTION "public"."mark_conversation_as_read"(uuid, uuid)
  FROM PUBLIC, "anon", "service_role";
GRANT EXECUTE ON FUNCTION "public"."mark_conversation_as_read"(uuid, uuid)
  TO "authenticated";

-- --------------------------------------------------------------------------
-- B. mark_conversation_as_unread / archive_conversation を service_role 専用に
-- --------------------------------------------------------------------------
-- どちらもクライアントから呼ばれていない (API 経由 or UI 未実装) ため、
-- PUBLIC / anon / authenticated から完全に EXECUTE を剥奪する。
REVOKE ALL ON FUNCTION "public"."mark_conversation_as_unread"(uuid, uuid)
  FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."mark_conversation_as_unread"(uuid, uuid)
  TO "service_role";

REVOKE ALL ON FUNCTION "public"."archive_conversation"(uuid, uuid)
  FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION "public"."archive_conversation"(uuid, uuid)
  TO "service_role";

-- --------------------------------------------------------------------------
-- C. anon の table 直書き権限を REVOKE (RLS の手前で防御層を狭める)
-- --------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON "public"."conversation" FROM "anon";
REVOKE INSERT, UPDATE, DELETE ON "public"."message" FROM "anon";

-- --------------------------------------------------------------------------
-- D-1. 危険な ALL ポリシーを除去
-- --------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow select for authenticated users" ON "public"."conversation";
DROP POLICY IF EXISTS "Allow select for authenticated users" ON "public"."message";

-- --------------------------------------------------------------------------
-- D-2. 既存 write ポリシーを除去 (クライアント直 INSERT/UPDATE を全禁止)
-- --------------------------------------------------------------------------
-- 旧 INSERT ポリシーは API ルートをバイパス可能だったため除去
DROP POLICY IF EXISTS "conversation_insert_participants" ON "public"."conversation";
DROP POLICY IF EXISTS "message_insert_participants" ON "public"."message";

-- 旧 UPDATE ポリシーは mentor_id/student_id を含む全カラム書き換えを許していたため除去
DROP POLICY IF EXISTS "conversation_update_participants" ON "public"."conversation";

-- 全 INSERT / UPDATE は POST /api/messages/send (service_role) 経由のみ
-- 既読化は上で改修した SECURITY DEFINER の RPC mark_conversation_as_read 経由のみ
-- DELETE は元々ポリシー未定義のため引き続き暗黙拒否

-- --------------------------------------------------------------------------
-- E. 参加者ベース SELECT ポリシーの冪等補完
-- --------------------------------------------------------------------------
-- 既存 migration (20260402015913) で定義済みだが、prod でダッシュボード経由の
-- 削除等が起きていても安全になるよう、欠落時のみ CREATE する。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversation'
      AND policyname = 'conversation_select_participants'
  ) THEN
    CREATE POLICY "conversation_select_participants"
      ON "public"."conversation"
      FOR SELECT
      TO "authenticated"
      USING (
        ("auth"."uid"() IS NOT NULL)
        AND (("mentor_id" = "auth"."uid"()) OR ("student_id" = "auth"."uid"()))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'message'
      AND policyname = 'message_select_participants'
  ) THEN
    CREATE POLICY "message_select_participants"
      ON "public"."message"
      FOR SELECT
      TO "authenticated"
      USING (
        ("auth"."uid"() IS NOT NULL)
        AND EXISTS (
          SELECT 1 FROM "public"."conversation" "c"
          WHERE ("c"."id" = "message"."conversation_id")
            AND (("c"."mentor_id" = "auth"."uid"()) OR ("c"."student_id" = "auth"."uid"()))
        )
      );
  END IF;
END;
$$;

-- --------------------------------------------------------------------------
-- F. パフォーマンス: message(conversation_id, created_at DESC) index
-- --------------------------------------------------------------------------
-- PostgreSQL は FK に自動 index を張らないため、現状 message には
-- conversation_id 関連の index が無い。新 RLS の EXISTS サブクエリと、
-- useMessages / useMessageThreads の SELECT の双方で利用される。
CREATE INDEX IF NOT EXISTS "idx_message_conversation_id_created_at"
  ON "public"."message" ("conversation_id", "created_at" DESC);
