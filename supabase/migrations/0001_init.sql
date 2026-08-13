-- =============================================================
-- 다낭 가족여행 공유 웹앱 — 초기 스키마
--
-- 접근 모델:
--   초대 코드가 담긴 링크로 들어오면 익명 로그인이 자동 실행되고,
--   claim_member()로 auth 계정이 members 행에 묶인다.
--   이후 모든 테이블의 RLS는 "이 여행의 멤버인가"만 확인한다.
-- =============================================================

create extension if not exists pgcrypto;

-- -------------------------------------------------------------
-- 여행 / 멤버
-- -------------------------------------------------------------

create table trips (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  destination       text not null default '다낭',
  start_date        date,
  end_date          date,
  join_code         text not null unique,
  -- 1 VND 당 KRW. 여행 시작 시점 값을 기본으로 두고 앱에서 조정한다.
  base_rate_vnd_krw numeric(12, 6) not null default 0.055,
  created_at        timestamptz not null default now()
);

create table members (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips (id) on delete cascade,
  -- 아직 아무도 이 자리를 고르지 않았으면 null (미청구 상태)
  user_id    uuid references auth.users (id) on delete set null,
  name       text not null,
  emoji      text not null default '🙂',
  color      text not null default '#64748b',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (trip_id, name)
);

-- 한 계정이 한 여행에서 두 자리를 차지할 수 없다
create unique index members_trip_user_uniq
  on members (trip_id, user_id)
  where user_id is not null;

-- -------------------------------------------------------------
-- RLS 헬퍼
--
-- security definer로 두어야 policy 안에서 members를 조회할 때
-- members 자신의 policy와 무한 재귀에 빠지지 않는다.
-- -------------------------------------------------------------

create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from members m
    where m.trip_id = p_trip_id
      and m.user_id = auth.uid()
  );
$$;

-- 현재 로그인한 사람의 이 여행에서의 member id
create or replace function public.my_member_id(p_trip_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.id from members m
  where m.trip_id = p_trip_id
    and m.user_id = auth.uid()
  limit 1;
$$;

-- -------------------------------------------------------------
-- 콘텐츠 테이블
-- -------------------------------------------------------------

create table places (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  name        text not null,
  name_local  text,                      -- 베트남어/영문 표기
  category    text not null default 'food'
              check (category in ('food', 'cafe', 'sight', 'shopping', 'massage', 'etc')),
  description text,
  price_level text,                      -- '2만원대', '저렴' 등 자유 입력
  ref_url     text,                      -- 블로그/인스타 링크
  gmap_url    text,
  status      text not null default 'wish'
              check (status in ('wish', 'planned', 'visited')),
  created_by  uuid references members (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index places_trip_idx on places (trip_id, category);

create table place_votes (
  place_id   uuid not null references places (id) on delete cascade,
  member_id  uuid not null references members (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (place_id, member_id)
);

create table itinerary (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips (id) on delete cascade,
  day_date   date not null,
  start_time time,
  title      text not null,
  kind       text not null default 'sight'
             check (kind in ('move', 'meal', 'sight', 'rest')),
  place_id   uuid references places (id) on delete set null,
  memo       text,
  sort_order int not null default 0,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

create index itinerary_day_idx on itinerary (trip_id, day_date, sort_order);

create table expenses (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references trips (id) on delete cascade,
  title       text not null,
  category    text not null default 'etc'
              check (category in ('food', 'transport', 'ticket', 'shopping', 'stay', 'etc')),
  amount_vnd  numeric(14, 2),
  amount_krw  numeric(14, 2),
  paid_by     uuid not null references members (id) on delete restrict,
  spent_at    date not null default current_date,
  receipt_url text,
  memo        text,
  created_at  timestamptz not null default now()
);

create index expenses_trip_idx on expenses (trip_id, spent_at);

-- 이 지출을 나눠 내는 사람들. 행이 없으면 정산에서 제외된다.
create table expense_shares (
  expense_id uuid not null references expenses (id) on delete cascade,
  member_id  uuid not null references members (id) on delete cascade,
  primary key (expense_id, member_id)
);

create table checklists (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips (id) on delete cascade,
  -- null이면 공용 항목, 값이 있으면 그 멤버의 개인 항목
  owner_id   uuid references members (id) on delete cascade,
  title      text not null,
  is_done    boolean not null default false,
  done_by    uuid references members (id) on delete set null,
  done_at    timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index checklists_trip_idx on checklists (trip_id, owner_id, sort_order);

create table bookings (
  id              uuid primary key default gen_random_uuid(),
  trip_id         uuid not null references trips (id) on delete cascade,
  type            text not null default 'etc'
                  check (type in ('flight', 'hotel', 'pickup', 'etc')),
  title           text not null,
  confirmation_no text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  address         text,
  address_local   text,                  -- 택시 기사에게 보여줄 현지어 주소
  phone           text,
  memo            text,
  file_url        text,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create index bookings_trip_idx on bookings (trip_id, sort_order);

create table notes (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips (id) on delete cascade,
  member_id  uuid references members (id) on delete set null,
  content    text,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index notes_trip_idx on notes (trip_id, created_at desc);

-- -------------------------------------------------------------
-- 가입 함수
-- -------------------------------------------------------------

-- 초대 코드를 여행 정보로 바꿔준다. 로그인만 되어 있으면 누구나 호출 가능하지만,
-- 코드를 모르면 아무것도 얻지 못한다.
create or replace function public.lookup_trip(p_code text)
returns table (
  trip_id     uuid,
  title       text,
  destination text,
  start_date  date,
  end_date    date
)
language sql
stable
security definer
set search_path = public
as $$
  select t.id, t.title, t.destination, t.start_date, t.end_date
  from trips t
  where t.join_code = upper(trim(p_code));
$$;

-- 코드가 맞는 사람만, 아직 비어 있는 자리를 자기 것으로 가져갈 수 있다.
-- 이미 자기 자리가 있으면 그 자리를 그대로 돌려준다(재방문/기기변경 대응).
create or replace function public.claim_member(p_code text, p_member_id uuid)
returns members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id  uuid;
  v_existing members;
  v_result   members;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  select id into v_trip_id from trips where join_code = upper(trim(p_code));
  if v_trip_id is null then
    raise exception '초대 코드가 올바르지 않습니다';
  end if;

  -- 이 여행에서 이미 자리를 가지고 있는가?
  select * into v_existing
  from members
  where trip_id = v_trip_id and user_id = auth.uid();

  if found then
    -- 다른 자리로 바꾸려는 경우: 대상이 비어 있을 때만 허용
    if v_existing.id <> p_member_id then
      update members set user_id = null where id = v_existing.id;
      update members set user_id = auth.uid()
      where id = p_member_id and trip_id = v_trip_id and user_id is null
      returning * into v_result;

      if not found then
        -- 대상이 이미 찬 자리였다면 원래 자리를 되돌린다
        update members set user_id = auth.uid() where id = v_existing.id;
        raise exception '이미 다른 사람이 선택한 자리입니다';
      end if;

      return v_result;
    end if;

    return v_existing;
  end if;

  update members set user_id = auth.uid()
  where id = p_member_id and trip_id = v_trip_id and user_id is null
  returning * into v_result;

  if not found then
    raise exception '이미 다른 사람이 선택한 자리입니다';
  end if;

  return v_result;
end;
$$;

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------

alter table trips          enable row level security;
alter table members        enable row level security;
alter table places         enable row level security;
alter table place_votes    enable row level security;
alter table itinerary      enable row level security;
alter table expenses       enable row level security;
alter table expense_shares enable row level security;
alter table checklists     enable row level security;
alter table bookings       enable row level security;
alter table notes          enable row level security;

-- 여행: 멤버만 조회/수정 (생성은 관리자가 SQL로)
create policy trips_select on trips for select
  using (is_trip_member(id));
create policy trips_update on trips for update
  using (is_trip_member(id)) with check (is_trip_member(id));

-- 멤버 목록: 이름 선택 화면에서 아직 멤버가 아닌 사람도 봐야 하므로
-- 조회는 lookup_trip으로 코드를 확인한 뒤 별도 함수로 처리한다.
-- 테이블 직접 조회는 이미 멤버인 사람만.
create policy members_select on members for select
  using (is_trip_member(trip_id));
create policy members_update on members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 콘텐츠 테이블은 전부 같은 규칙: 이 여행의 멤버면 전부 가능
create policy places_all on places for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

create policy itinerary_all on itinerary for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

create policy expenses_all on expenses for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

create policy checklists_all on checklists for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

create policy bookings_all on bookings for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

create policy notes_all on notes for all
  using (is_trip_member(trip_id)) with check (is_trip_member(trip_id));

-- trip_id가 없는 조인 테이블은 부모를 거쳐 확인한다
create policy place_votes_all on place_votes for all
  using (
    exists (select 1 from places p where p.id = place_id and is_trip_member(p.trip_id))
  )
  with check (
    exists (select 1 from places p where p.id = place_id and is_trip_member(p.trip_id))
  );

create policy expense_shares_all on expense_shares for all
  using (
    exists (select 1 from expenses e where e.id = expense_id and is_trip_member(e.trip_id))
  )
  with check (
    exists (select 1 from expenses e where e.id = expense_id and is_trip_member(e.trip_id))
  );

-- 이름 선택 화면용: 코드를 아는 사람에게만 자리 목록을 보여준다
create or replace function public.list_member_slots(p_code text)
returns table (
  id        uuid,
  name      text,
  emoji     text,
  color     text,
  is_taken  boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.name, m.emoji, m.color, (m.user_id is not null)
  from members m
  join trips t on t.id = m.trip_id
  where t.join_code = upper(trim(p_code))
  order by m.sort_order, m.name;
$$;

-- 실행 권한은 0003에서 anon을 걷어내며 최종 정리한다.
grant execute on function public.lookup_trip(text)        to authenticated;
grant execute on function public.list_member_slots(text)  to authenticated;
grant execute on function public.claim_member(text, uuid) to authenticated;

-- -------------------------------------------------------------
-- 실시간 구독
-- -------------------------------------------------------------

alter publication supabase_realtime add table places;
alter publication supabase_realtime add table place_votes;
alter publication supabase_realtime add table itinerary;
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table expense_shares;
alter publication supabase_realtime add table checklists;
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table notes;
