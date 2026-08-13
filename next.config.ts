import type { NextConfig } from 'next'

/**
 * STATIC_EXPORT=1 이면 out/ 폴더에 HTML로 굽는다 (npm run build:static).
 *
 * 이 앱은 서버에서 하는 일이 없다 - 데이터는 전부 브라우저가 Supabase에
 * 직접 물어본다. 그래서 정적 파일로 내보내도 그대로 동작한다.
 * 다만 굽는 대상이 되는 초대 링크는 TRIP_CODE 하나뿐이다.
 */
const nextConfig: NextConfig = {
  ...(process.env.STATIC_EXPORT === '1'
    ? { output: 'export' as const, images: { unoptimized: true } }
    : {}),
}

export default nextConfig
