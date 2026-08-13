import { Wordmark } from './Wordmark'

/**
 * Supabase 환경변수가 없을 때 보이는 화면.
 *
 * 이런 상태로 배포되는 일은 없어야 하지만, 났을 때 흰 화면만 보이면
 * 무엇이 잘못됐는지 알 길이 없다. 고칠 곳을 이름으로 적어둔다.
 */
export function MissingEnvScreen() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <Wordmark size="lg" />

      <div className="mt-8 border-l-4 border-signal bg-card p-5">
        <p className="font-bold">설정이 덜 됐습니다</p>
        <p className="mt-2 text-muted">
          서버에 아래 두 값이 등록되어야 데이터를 불러올 수 있습니다.
        </p>
        <ul className="mt-3 flex flex-col gap-1 font-bold">
          <li>NEXT_PUBLIC_SUPABASE_URL</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Vercel 프로젝트의 Settings → Environment Variables에서 넣고 다시
          배포하면 됩니다.
        </p>
      </div>
    </main>
  )
}
