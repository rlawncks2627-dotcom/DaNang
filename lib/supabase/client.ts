import { createBrowserClient } from '@supabase/ssr'

import type { Database } from './types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/** 환경변수가 갖춰졌는지. 빌드 시점에 값이 박히므로 렌더 중에 읽어도 안전하다. */
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
