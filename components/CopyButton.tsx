'use client'

import { useEffect, useState } from 'react'

/**
 * 주소나 예약번호를 그대로 집어가는 버튼.
 * 택시 기사에게 주소를 보여주거나 예약번호를 붙여넣을 때 쓴다.
 */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // 클립보드를 막아둔 브라우저가 있다. 조용히 넘어간다.
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="min-h-11 shrink-0 border border-line px-3 text-sm font-bold text-muted"
    >
      {copied ? '복사됨' : label}
    </button>
  )
}
