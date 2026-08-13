/**
 * 'YYYY-MM-DD'로 만든다.
 *
 * toISOString()을 쓰면 안 된다. UTC로 바꾸기 때문에 한국(UTC+9)에서
 * 로컬 자정을 변환하면 전날이 나온다.
 */
function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 'YYYY-MM-DD' 사이의 날짜를 하루 단위로 편다. */
export function daysBetween(start: string, end: string): string[] {
  const days: string[] = []
  const cursor = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)

  // 날짜를 잘못 넣어도 화면이 멈추지 않게 상한을 둔다
  while (cursor <= last && days.length < 60) {
    days.push(toISODate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

/** '8월 15일 (금)' */
export function formatDay(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

/** 오늘 날짜를 로컬 기준으로. */
export function todayLocal() {
  return toISODate(new Date())
}

/** '14:30:00' -> '오후 2:30' */
export function formatTime(time: string | null) {
  if (!time) return null
  const [hour, minute] = time.split(':')
  const date = new Date()
  date.setHours(Number(hour), Number(minute), 0, 0)
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
