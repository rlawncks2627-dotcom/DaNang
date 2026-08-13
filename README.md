# 다낭 가족여행 공유 웹앱

엄마·동생·나 세 사람이 여행 정보를 한 곳에 모으고, 같이 편집하고, 현지에서 바로 꺼내 보는 웹앱.

설계 배경과 결정은 [PLAN.md](./PLAN.md)를 본다.

## 화면

| 경로 | 하는 일 |
|---|---|
| `/` | D-day, 오늘 일정, 준비물 진행률, 환율·날씨 |
| `/schedule` | Day별 타임라인. 여행 날짜도 여기서 정한다 |
| `/places` | 맛집·관광지 카드, 하트 투표, 구글맵 길찾기 |
| `/expenses` | 지출 기록, 동↔원 환산, N빵 정산 |
| `/checklist` | 공용·개인 준비물 |
| `/bookings` | 항공·숙소·픽업, 비상 연락처 |
| `/notes` | 메모와 사진 타임라인 |
| `/join/<코드>` | 초대 링크로 들어오는 입구 |

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 검증
npx eslint .     # 린트
```

환경변수는 `.env.local`에 둔다. 형식은 `.env.example` 참고.

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable 키 |
| `NEXT_PUBLIC_TRIP_CODE` | 여행 초대 코드. 공유 링크는 `/join/<코드>` |

## 배포

Vercel에 붙인다. 위 환경변수 세 개를 Vercel 프로젝트 설정에도 넣어야 한다.

```bash
npx vercel        # 최초 연결
npx vercel --prod # 배포
```

## 데이터베이스

Supabase 프로젝트: `danang-family-trip` (ap-northeast-2)

스키마는 `supabase/migrations/`에 순서대로 들어 있고 이미 적용된 상태다.
새 변경은 새 번호의 파일을 추가하는 방식으로 쌓는다.

| 파일 | 내용 |
|---|---|
| `0001_init.sql` | 테이블 10개, RLS, 가입 함수, 실시간 구독 |
| `0002_seed.sql` | 여행 1건, 멤버 3자리, 다낭 준비물 템플릿, 비상 연락처 |
| `0003_harden_function_grants.sql` | `anon` 역할의 함수 실행 권한 회수 |
| `0004_bookings_emergency_flag.sql` | 비상 연락처 구분 플래그 |
| `0005_storage_trip_photos.sql` | 사진 버킷과 스토리지 정책 |

스키마를 바꾼 뒤에는 타입을 다시 생성한다:

```bash
npx supabase gen types typescript --project-id zvvcziaayljdiwupwawc > lib/supabase/types.ts
```

> **함수를 새로 만들 때는 `revoke execute ... from public, anon`을 직접 붙인다.**
> 0003의 `alter default privileges`는 마이그레이션 실행 역할이 달라 적용되지 않는다.
> 0005에서 이 함정에 한 번 걸렸다.

### 접근 모델

비밀번호가 없다. 초대 코드가 담긴 링크로 들어오면 익명 로그인이 자동 실행되고,
`claim_member()`가 그 계정을 멤버 자리에 묶는다. 이후 모든 테이블의 RLS는
"이 여행의 멤버인가"만 확인한다.

익명 로그인은 `role=authenticated` JWT를 발급하므로 `anon` 역할에는
아무 권한도 열어두지 않았다.

사진은 비공개 버킷에 `{trip_id}/{uuid}.jpg`로 저장하고 서명 URL로만 본다.
경로의 첫 칸이 곧 스토리지 정책의 판단 근거다.

> 여권번호·카드번호 같은 민감정보는 앱에 넣지 않는다. 예약번호와 주소까지가 적정선.

### Supabase 대시보드 설정

코드가 아니라 대시보드에서만 켤 수 있는 항목이 하나 있다.

- `Authentication → Sign In / Providers → Allow anonymous sign-ins` **켜짐**

이게 꺼져 있으면 아무도 앱에 들어올 수 없다.

## 초대 코드

초대 코드가 이 앱의 유일한 열쇠다. 저장소는 public이므로 **실제 코드를 커밋하지 않는다** —
`.env.local`(gitignore됨)과 Vercel 환경변수에만 둔다.

`supabase/migrations/0002_seed.sql`에 박혀 있는 코드는 최초 시드용이며 이후 교체되어
더 이상 유효하지 않다.

코드를 바꿀 때는 DB와 `.env.local`, Vercel 환경변수 세 곳을 함께 고친다.

```sql
update trips set join_code = 'NEWCODE';
```

## 구조

```
app/
  (main)/          로그인 후 화면들. 하단 탭 내비게이션을 공유한다
  join/[code]/     초대 링크 입구
components/        화면별 폼과 카드
lib/
  hooks/           실시간 구독 훅
  money.ts         환율 변환과 정산 계산
  days.ts          날짜 계산. toISOString을 쓰지 않는다(시간대가 밀린다)
  photos.ts        리사이즈와 업로드
supabase/migrations/
```

실시간 구독은 `useRealtimeTable`(id 기반)과 `useLinkTable`(복합키) 둘로 나뉜다.
둘 다 **구독을 먼저 걸고 스냅샷을 뒤에 찍는다** — 반대로 하면 그 사이에 들어온
행이 영구히 누락된다.
