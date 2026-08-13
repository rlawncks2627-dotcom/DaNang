import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './types'

/**
 * 브라우저용 Supabase 클라이언트.
 *
 * 이 앱은 서버 렌더링 시점에 인증이 필요한 데이터를 읽지 않는다.
 * 익명 세션은 브라우저에만 존재하고, 데이터는 전부 클라이언트에서
 * 실시간 구독과 함께 가져온다.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
