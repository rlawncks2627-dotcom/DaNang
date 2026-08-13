import type { MetadataRoute } from 'next'

/**
 * 홈 화면에 설치했을 때의 모습.
 *
 * standalone이라 주소창 없이 앱처럼 열린다. 시작 주소를 '/'로 두면
 * 세션이 살아 있는 한 바로 홈으로, 아니면 가입 화면으로 넘어간다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '다낭 가족여행',
    short_name: '다낭',
    description: '엄마·동생·나의 다낭 여행 준비와 기록',
    start_url: '/',
    display: 'standalone',
    background_color: '#efeee6',
    theme_color: '#efeee6',
    lang: 'ko',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  }
}
