/**
 * 워드마크. 간판 글씨처럼 굵게 눌러쓰고, '다낭'만 주사색으로 띄운다.
 * 디스플레이 서체를 쓰는 자리는 여기와 Day 숫자, 큰 금액뿐이다.
 */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <p
      className={`font-display leading-none tracking-tight ${
        size === 'lg' ? 'text-5xl' : 'text-2xl'
      }`}
    >
      <span className="text-signal">다낭</span>
      <span className="text-ink"> 가족여행</span>
    </p>
  )
}
