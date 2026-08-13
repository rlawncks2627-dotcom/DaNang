import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './types'

/**
 * 프로젝트 주소와 publishable 키.
 *
 * 이 둘은 감출 수 있는 값이 아니다. 브라우저가 Supabase에 요청할 때마다
 * 그대로 실려 나가므로, 배포된 앱을 여는 사람은 누구나 볼 수 있다.
 * 감출 필요도 없다 — 데이터는 이 값이 아니라 RLS가 지킨다.
 * 멤버가 아니면 어떤 테이블도 0행이고, 사진도 서명 URL을 못 받는다.
 *
 * 그래서 기본값을 코드에 둔다. 환경변수 하나 빠뜨렸다고 배포가 망가지는
 * 일을 없애기 위해서다. 다른 Supabase 프로젝트를 쓰려면 환경변수로 덮으면 된다.
 *
 * 초대 코드는 다르다. 그건 이 앱의 유일한 열쇠라 서버 전용 환경변수
 * TRIP_CODE에만 두고 절대 커밋하지 않는다.
 */
const DEFAULT_URL = 'https://zvvcziaayljdiwupwawc.supabase.co'
const DEFAULT_ANON_KEY = 'sb_publishable_b9p7Jp0NMqYZkZCG3vDo3Q_FghKluBF'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY

/** 기본값이 있으므로 항상 true다. 값이 비워진 채 덮이는 경우를 대비해 남겨둔다. */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * 브라우저용 Supabase 클라이언트.
 *
 * 이 앱은 서버 렌더링 시점에 인증이 필요한 데이터를 읽지 않는다.
 * 익명 세션은 브라우저에만 존재하고, 데이터는 전부 클라이언트에서
 * 실시간 구독과 함께 가져온다.
 *
 * 값이 없으면 null을 준다. 예외를 던지면 빌드가 프리렌더 단계에서
 * 통째로 깨진다 — 환경변수를 빠뜨린 벌치고는 너무 크다.
 */
export function createClient() {
  if (!url || !anonKey) return null
  return createBrowserClient<Database>(url, anonKey)
}
