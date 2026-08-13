/**
 * 초대 코드는 이 앱의 유일한 열쇠다.
 * 저장소가 public이므로 값 자체는 .env.local과 Vercel 환경변수에만 둔다.
 */
export const TRIP_CODE = process.env.NEXT_PUBLIC_TRIP_CODE ?? ''

export const joinPath = `/join/${TRIP_CODE}`
