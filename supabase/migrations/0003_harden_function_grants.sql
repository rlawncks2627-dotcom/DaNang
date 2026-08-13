-- =============================================================
-- 함수 실행 권한 조이기
--
-- Supabase는 public 스키마의 모든 함수에 anon/authenticated 실행 권한을
-- 명시적으로 부여한다. 0001에서 준 grant만으로는 anon이 열려 있으므로
-- 직접 회수한다.
--
-- 익명 로그인(signInAnonymously)은 role=authenticated + is_anonymous=true 인
-- JWT를 발급한다. 즉 가입 흐름 전체가 authenticated로 동작하므로
-- anon 역할에는 아무것도 열어둘 필요가 없다.
--
-- is_trip_member만은 authenticated에게 반드시 남겨야 한다 —
-- RLS policy는 질의하는 역할의 권한으로 평가되기 때문이다.
-- =============================================================

revoke execute on function public.is_trip_member(uuid)     from public, anon;
revoke execute on function public.my_member_id(uuid)       from public, anon;
revoke execute on function public.lookup_trip(text)        from public, anon;
revoke execute on function public.list_member_slots(text)  from public, anon;
revoke execute on function public.claim_member(text, uuid) from public, anon;

grant execute on function public.is_trip_member(uuid)     to authenticated;
grant execute on function public.my_member_id(uuid)       to authenticated;
grant execute on function public.lookup_trip(text)        to authenticated;
grant execute on function public.list_member_slots(text)  to authenticated;
grant execute on function public.claim_member(text, uuid) to authenticated;

-- 앞으로 추가될 함수에도 같은 규칙이 적용되도록
alter default privileges in schema public revoke execute on functions from anon;
