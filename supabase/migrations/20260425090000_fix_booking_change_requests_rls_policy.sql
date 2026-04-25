-- ==========================================================================
-- Security Fix: booking_change_requests に拒否ポリシーを明示
-- ==========================================================================
-- 前提: アプリケーションからのアクセスは全て server-side の service role
--       経由の API ルートで実装済み。authenticated/anon クライアントから
--       直接操作する要件はない。
--
-- 状態遷移 (pending → approved/rejected) と通知を伴うため、クライアント
-- 直接 UPDATE は status/reviewed_by の改ざんリスクがあり禁止する。
--
-- Supabase Security Advisor 0008_rls_enabled_no_policy (INFO) は
-- 「RLS 有効 + ポリシー 0 件」を検知するため、拒否ポリシーを 1 件追加して
-- lint を解消すると同時に多層防御を構成する。

-- --------------------------------------------------------------------------
-- 1) 意図を DB に永続化（概念レベルに留め、将来 stale にならないようにする）
-- --------------------------------------------------------------------------
COMMENT ON TABLE public.booking_change_requests IS
  'Application access is intentionally restricted to server-side service-role paths. Direct API access by anon/authenticated is denied by design.';

-- --------------------------------------------------------------------------
-- 2) anon / authenticated の grant を取り消す
-- --------------------------------------------------------------------------
-- ALTER DEFAULT PRIVILEGES (20260402015913_remote_schema.sql) により新規
-- public table は anon/authenticated にも GRANT ALL が自動付与されている。
-- service_role 経由のみで運用する本テーブルでは明示的に剥がす。
REVOKE ALL PRIVILEGES ON TABLE public.booking_change_requests FROM anon, authenticated;

-- --------------------------------------------------------------------------
-- 3) RESTRICTIVE な拒否ポリシーで authenticated/anon の直接アクセスを禁止
-- --------------------------------------------------------------------------
-- service_role は RLS をバイパスするため影響を受けない。
-- RESTRICTIVE は permissive policy と AND 結合されるため、将来 permissive
-- ポリシーが追加されてもこの deny が外されない限り API は開かない。
-- クライアント直接操作の要件が将来発生した場合は、このポリシーを DROP
-- または対象ロールから外した上で、bookings (20260415063301) と同様の
-- 所有者・メンター制限ポリシーを設計してから追加すること。
DROP POLICY IF EXISTS booking_change_requests_no_api_access
  ON public.booking_change_requests;

CREATE POLICY booking_change_requests_no_api_access
  ON public.booking_change_requests
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
