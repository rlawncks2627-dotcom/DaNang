'use client'

import { useEffect, useState } from 'react'

/**
 * 오늘 환율. 1,000동이 몇 원인지로 돌려준다.
 *
 * 정산에 쓰는 값은 여행 시작 시점으로 고정해둔 trips.base_rate_vnd_krw다.
 * 이건 홈에서 감을 잡는 용도이고, 차이가 크면 정산 화면에서 직접 고친다.
 */
export function useLiveRate() {
  const [per1000, setPer1000] = useState<number | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/VND')
        const json = await res.json()
        if (!active) return

        const krwPerVnd = json?.rates?.KRW
        if (typeof krwPerVnd !== 'number') return

        setPer1000(Math.round(krwPerVnd * 1000 * 100) / 100)
      } catch {
        // 그대로 둔다
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return per1000
}
