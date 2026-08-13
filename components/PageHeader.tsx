export function PageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <header className="mb-6">
      <h1 className="font-display text-3xl leading-none">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
    </header>
  )
}

/**
 * 아직 만들지 않은 화면. 무엇이 들어올 자리인지 적어두면
 * 가족이 먼저 열어봤을 때 고장난 화면으로 보이지 않는다.
 */
export function ComingSoon({ what }: { what: string }) {
  return (
    <div className="border-l-4 border-line bg-card p-5">
      <p className="font-bold">아직 준비 중입니다</p>
      <p className="mt-2 text-muted">{what}</p>
    </div>
  )
}
