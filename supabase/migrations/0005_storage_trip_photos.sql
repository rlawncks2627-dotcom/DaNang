-- =============================================================
-- 사진 보관함
--
-- 비공개 버킷이라 보려면 서명 URL이 필요하다. 공개 버킷으로 두면
-- 주소만 아는 사람이 영수증까지 들여다볼 수 있다.
--
-- 경로 규칙은 {trip_id}/{uuid}.jpg — 첫 칸이 곧 접근 판단 근거가 된다.
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-photos',
  'trip-photos',
  false,
  5242880,                                    -- 5MB. 올리기 전에 리사이즈하므로 넉넉하다
  array['image/jpeg', 'image/png', 'image/webp']
);

-- 경로에서 여행 id를 꺼낸다. 규칙에 안 맞는 이름이면 null을 준다 —
-- 캐스팅 오류로 정책이 터지는 대신 조용히 거부되게 하려는 것이다.
create or replace function public.trip_id_from_path(p_name text)
returns uuid
language plpgsql
immutable
as $$
begin
  return (storage.foldername(p_name))[1]::uuid;
exception
  when others then
    return null;
end;
$$;

-- 0003의 alter default privileges는 여기에 먹지 않는다. 마이그레이션이
-- 그 규칙을 만든 역할과 다른 역할로 실행되기 때문이다.
-- 새 함수를 만들 때마다 이 두 줄을 직접 붙여야 한다.
revoke execute on function public.trip_id_from_path(text) from public, anon;
grant  execute on function public.trip_id_from_path(text) to authenticated;

-- is_trip_member(null)은 false라 규칙에 안 맞는 경로는 전부 막힌다
create policy "trip photos: 멤버만 조회"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'trip-photos'
    and is_trip_member(trip_id_from_path(name))
  );

create policy "trip photos: 멤버만 올리기"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'trip-photos'
    and is_trip_member(trip_id_from_path(name))
  );

create policy "trip photos: 멤버만 지우기"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'trip-photos'
    and is_trip_member(trip_id_from_path(name))
  );
