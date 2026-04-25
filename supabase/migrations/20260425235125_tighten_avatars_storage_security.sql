-- C. avatars バケットの desired state を宣言。
--    ローカル/CI ではバケットが存在しないため update では 0 row になる。
--    insert ... on conflict ... do update で「無ければ作る、あれば設定を引き締める」を一度に行う。
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 既存ポリシー（Dashboard 自動生成命名）の撤去。
-- ローカル/CI には存在しないので IF EXISTS で冪等化。
drop policy if exists "Allow authenticated uploads 1oj01fe_0" on storage.objects;
drop policy if exists "Allow public read 1oj01fe_0" on storage.objects;
drop policy if exists "Allow owner update delete 1oj01fe_0" on storage.objects;
drop policy if exists "Allow owner delete 1oj01fe_0" on storage.objects;

-- 再適用に備え新規ポリシー名も先に DROP（policy には IF NOT EXISTS が無い）
drop policy if exists "avatars_owner_select" on storage.objects;
drop policy if exists "avatars_authenticated_insert_own_folder" on storage.objects;
drop policy if exists "avatars_owner_update" on storage.objects;
drop policy if exists "avatars_owner_delete" on storage.objects;

-- A. SELECT: 所有者フォルダのみ。
--    public 配信は bucket.public=true による /object/public/<bucket>/<path> 経路で行うため、
--    storage.objects への public SELECT ポリシーは付けない（=匿名 .list() は拒否される）。
--    authenticated 経由の upsert(=SELECT+UPDATE) は自分のフォルダのみ通る。
create policy "avatars_owner_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- B. INSERT: 自分のフォルダ配下のみ書き込み可能
create policy "avatars_authenticated_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
