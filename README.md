# 다낭 가족여행 공유 웹앱

엄마·동생·나 세 사람이 여행 정보를 한 곳에 모으고, 같이 편집하고, 현지에서 바로 꺼내 보는 웹앱.

전체 설계는 [PLAN.md](./PLAN.md)를 본다.

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드 검증
```

환경변수는 `.env.local`에 둔다. 형식은 `.env.example` 참고.

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable 키 |
| `NEXT_PUBLIC_TRIP_CODE` | 여행 초대 코드. 공유 링크는 `/join/<코드>` |

## 데이터베이스

Supabase 프로젝트: `danang-family-trip` (ap-northeast-2)

스키마는 `supabase/migrations/`에 순서대로 들어 있다. 이미 적용된 상태이며,
새 변경은 새 번호의 파일을 추가하는 방식으로 쌓는다.

| 파일 | 내용 |
|---|---|
| `0001_init.sql` | 테이블 10개, RLS, 가입 함수, 실시간 구독 |
| `0002_seed.sql` | 여행 1건, 멤버 3명, 다낭 준비물 템플릿, 비상 연락처 |
| `0003_harden_function_grants.sql` | `anon` 역할의 함수 실행 권한 회수 |

스키마를 바꾼 뒤에는 타입을 다시 생성한다:

```bash
npx supabase gen types typescript --project-id zvvcziaayljdiwupwawc > lib/supabase/types.ts
```

### 접근 모델

비밀번호가 없다. 초대 코드가 담긴 링크로 들어오면 익명 로그인이 자동 실행되고,
`claim_member()`가 그 계정을 멤버 자리에 묶는다. 이후 모든 테이블의 RLS는
"이 여행의 멤버인가"만 확인한다.

익명 로그인은 `role=authenticated` JWT를 발급하므로 `anon` 역할에는
아무 권한도 열어두지 않았다.

> 여권번호·카드번호 같은 민감정보는 앱에 넣지 않는다. 예약번호와 주소까지가 적정선.

## 초대 코드

초대 코드가 이 앱의 유일한 열쇠다. 저장소는 public이므로 **실제 코드를 커밋하지 않는다** —
`.env.local`(gitignore됨)과 Vercel 환경변수에만 둔다.

`supabase/migrations/0002_seed.sql`에 박혀 있는 코드는 최초 시드용이며 이후 교체되어
더 이상 유효하지 않다.

코드를 바꿀 때는 DB와 `.env.local`, Vercel 환경변수 세 곳을 함께 고친다.

```sql
update trips set join_code = 'NEWCODE';
```
