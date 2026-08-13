-- 비상 연락처는 예약이 아니라 항상 맨 아래 고정되는 블록이다.
-- sort_order 관례에 기대지 않고 명시적으로 표시한다.
alter table bookings add column is_emergency boolean not null default false;

update bookings set is_emergency = true
where title in ('주다낭 대한민국 총영사관', '베트남 긴급번호');
