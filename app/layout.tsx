import type { Metadata, Viewport } from 'next'

import './globals.css'

export const metadata: Metadata = {
  title: '다낭 가족여행',
  description: '엄마·동생·나의 다낭 여행 준비와 기록',
}

export const viewport: Viewport = {
  themeColor: '#efeee6',
  width: 'device-width',
  initialScale: 1,
  // 확대는 막지 않는다. 글씨를 키워 보는 사람이 있다.
  maximumScale: 5,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/*
          next/font는 이 서체들의 한글 subset을 모른다(메타데이터에 latin만 있다).
          Google이 한글을 unicode-range로 쪼개 서빙하므로 link 방식이 오히려 낫다 —
          브라우저가 실제로 쓰는 구간만 받아간다.

          Black Han Sans: 워드마크·Day 숫자·큰 금액 전용
          Gothic A1: 본문
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          규칙은 pages/_document.js를 전제로 한다. App Router의 루트 레이아웃
          head는 이미 전역이라 여기서는 오탐이다.
        */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Gothic+A1:wght@400;500;700;800&display=swap"
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
