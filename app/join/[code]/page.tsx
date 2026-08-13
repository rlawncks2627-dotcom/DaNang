import { JoinScreen } from './JoinScreen'

/**
 * 정적 내보내기는 어떤 코드로 페이지를 구울지 미리 알아야 한다.
 * 실제로 쓰는 코드 하나만 구우면 된다.
 *
 * TRIP_CODE에 NEXT_PUBLIC_ 접두사를 붙이지 않은 것이 중요하다. 그러면
 * 이 값은 빌드할 때 서버에서만 읽히고 브라우저 번들에는 들어가지 않는다.
 *
 * 서버로 띄울 때는 이 목록이 미리 굽는 대상일 뿐이라, 다른 코드로 들어와도
 * 그대로 동작하며 '초대 링크가 올바르지 않습니다'를 보여준다.
 */
export function generateStaticParams() {
  const code = process.env.TRIP_CODE
  return code ? [{ code }] : []
}

export default function JoinPage() {
  return <JoinScreen />
}
