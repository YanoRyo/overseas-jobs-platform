-- ==========================================================================
-- Security Fix: 関数の search_path を固定化
-- ==========================================================================
-- 背景: search_path が未設定の関数は、呼び出し元ロールの search_path に
--       依存してスキーマ解決を行うため、同名オブジェクトを別スキーマに
--       仕込まれた場合に意図しない関数/テーブルを参照する可能性がある
--       (Supabase Advisor: function_search_path_mutable)。
-- 対応: 全対象関数に SET search_path = public, pg_temp を付与し、
--       public と一時スキーマ以外を参照しないよう固定する。
-- 備考: 関数本体は一切変更しない (ALTER FUNCTION のみ)。

ALTER FUNCTION "public"."create_booking_atomic"(
  "p_user_id" "uuid",
  "p_mentor_id" "uuid",
  "p_start_time" timestamp without time zone,
  "p_duration_minutes" integer,
  "p_expiry_minutes" integer
) SET "search_path" = 'public', 'pg_temp';

ALTER FUNCTION "public"."archive_conversation"(
  "p_conversation_id" "uuid",
  "p_user_id" "uuid"
) SET "search_path" = 'public', 'pg_temp';

ALTER FUNCTION "public"."mark_conversation_as_read"(
  "p_conversation_id" "uuid",
  "p_user_id" "uuid"
) SET "search_path" = 'public', 'pg_temp';

ALTER FUNCTION "public"."mark_conversation_as_unread"(
  "p_conversation_id" "uuid",
  "p_receiver_id" "uuid"
) SET "search_path" = 'public', 'pg_temp';

ALTER FUNCTION "public"."update_mentor_review_stats"()
  SET "search_path" = 'public', 'pg_temp';

ALTER FUNCTION "public"."update_updated_at_column"()
  SET "search_path" = 'public', 'pg_temp';
