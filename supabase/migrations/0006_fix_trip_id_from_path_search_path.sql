-- search_path를 고정하지 않으면 호출자가 스키마를 끼워 넣어 함수 해석을
-- 바꿀 수 있다. 다른 함수들에는 걸어뒀는데 0005의 이것만 빠져 있었다.
-- 안에서 쓰는 이름은 전부 스키마까지 적혀 있으므로 빈 값으로 둔다.
create or replace function public.trip_id_from_path(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
  return (storage.foldername(p_name))[1]::uuid;
exception
  when others then
    return null;
end;
$$;

revoke execute on function public.trip_id_from_path(text) from public, anon;
grant  execute on function public.trip_id_from_path(text) to authenticated;
