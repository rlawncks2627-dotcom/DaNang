-- =============================================================
-- 초기 데이터: 여행 1건, 멤버 3명, 다낭 준비물 템플릿
--
-- join_code는 링크에 들어가는 값이므로 공유 전에 원하는 값으로 바꿔도 된다.
--   update trips set join_code = 'NEWCODE' where join_code = 'DN7K4Q';
-- =============================================================

insert into trips (title, destination, join_code, base_rate_vnd_krw)
values ('다낭 가족여행', '다낭', 'DN7K4Q', 0.055);

-- 멤버 3인. user_id는 각자 링크로 들어와 이름을 고를 때 채워진다.
insert into members (trip_id, name, emoji, color, sort_order)
select t.id, v.name, v.emoji, v.color, v.sort_order
from trips t,
     (values
       ('나',   '🧑', '#2563eb', 1),
       ('엄마', '👩', '#db2777', 2),
       ('동생', '🧒', '#16a34a', 3)
     ) as v(name, emoji, color, sort_order)
where t.join_code = 'DN7K4Q';

-- 공용 준비물 (owner_id null = 공용)
insert into checklists (trip_id, owner_id, title, sort_order)
select t.id, null, v.title, v.sort_order
from trips t,
     (values
       ('여권 (유효기간 6개월 이상 확인)', 1),
       ('항공권 / 숙소 바우처 캡처',        2),
       ('여행자 보험 가입',                 3),
       ('eSIM 또는 유심 준비',              4),
       ('달러 환전 (현지에서 동으로 환전)',  5),
       ('해외 결제 가능 카드',              6),
       ('멀티 어댑터',                      7),
       ('상비약 (해열제, 지사제, 소화제)',   8),
       ('모기 기피제',                      9),
       ('자외선 차단제',                    10),
       ('우산 또는 우비',                   11),
       ('수영복 / 래시가드',                12),
       ('슬리퍼',                          13),
       ('보조 배터리 (기내 반입)',          14),
       ('물티슈 / 휴지',                    15),
       ('작은 크로스백',                    16)
     ) as v(title, sort_order)
where t.join_code = 'DN7K4Q';

-- 비상 연락처 (예약정보 탭 하단 고정 블록)
insert into bookings (trip_id, type, title, phone, memo, sort_order)
select t.id, 'etc', v.title, v.phone, v.memo, v.sort_order
from trips t,
     (values
       ('주다낭 대한민국 총영사관', '+84-236-3566-100',
        '여권 분실·사건사고 시. 긴급 상황은 영사콜센터 +82-2-3210-0404 (24시간)', 90),
       ('베트남 긴급번호', '113 / 114 / 115',
        '113 경찰, 114 소방, 115 구급', 91)
     ) as v(title, phone, memo, sort_order)
where t.join_code = 'DN7K4Q';
