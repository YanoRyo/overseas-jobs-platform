-- 予約作成のTOCTOU問題を解消するためのRPC関数
-- pg_advisory_xact_lockでメンター単位の排他ロックを取得し、
-- 重複チェック + INSERT を1トランザクション内で原子的に実行する

CREATE OR REPLACE FUNCTION create_booking_atomic(
  p_user_id uuid,
  p_mentor_id uuid,
  p_start_time timestamp,
  p_duration_minutes int,
  p_expiry_minutes int DEFAULT 15
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_end_time timestamp;
  v_expires_at timestamptz;
  v_booking_id bigint;
  v_conflict boolean;
BEGIN
  -- DB側で end_time と expires_at を算出
  v_end_time := p_start_time + (p_duration_minutes || ' minutes')::interval;
  v_expires_at := now() + (p_expiry_minutes || ' minutes')::interval;

  -- メンター単位の排他ロック（トランザクション終了時に自動解放）
  PERFORM pg_advisory_xact_lock(hashtextextended(p_mentor_id::text, 0));

  -- 重複予約チェック（pending期限内 or confirmed の予約と時間が重複していないか）
  SELECT EXISTS(
    SELECT 1 FROM bookings
    WHERE mentor_id = p_mentor_id
      AND status IN ('pending', 'confirmed')
      AND start_time < v_end_time
      AND end_time > p_start_time
      AND (status = 'confirmed' OR expires_at > now())
    LIMIT 1
  ) INTO v_conflict;

  IF v_conflict THEN
    RETURN jsonb_build_object('conflict', true, 'booking_id', null);
  END IF;

  INSERT INTO bookings (user_id, mentor_id, start_time, end_time, status, expires_at)
  VALUES (p_user_id, p_mentor_id, p_start_time, v_end_time, 'pending', v_expires_at)
  RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object('conflict', false, 'booking_id', v_booking_id);
END;
$$;

-- service_role からのみ呼び出し可能にする
-- PUBLIC のデフォルト権限と ALTER DEFAULT PRIVILEGES による anon/authenticated への自動付与も剥奪
REVOKE EXECUTE ON FUNCTION public.create_booking_atomic(uuid, uuid, timestamp, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(uuid, uuid, timestamp, int, int) TO service_role;
