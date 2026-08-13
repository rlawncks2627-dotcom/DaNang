'use client'

import { useEffect, useState } from 'react'

import { useTrip } from '@/components/TripProvider'
import { PHOTO_BUCKET } from '@/lib/photos'

const ONE_HOUR = 3600

/**
 * 비공개 버킷의 사진은 서명 URL로만 볼 수 있다.
 *
 * 경로 목록을 주면 한 번에 서명해 돌려준다. 유효기간은 한 시간이라
 * 화면을 오래 열어두면 만료되지만, 그때는 어차피 다시 들어온다.
 */
export function useSignedUrls(paths: string[]) {
  const { supabase } = useTrip()
  const [urls, setUrls] = useState<Record<string, string>>({})

  // 배열은 렌더마다 새 참조라 내용으로 비교한다
  const key = paths.join('|')

  useEffect(() => {
    let active = true
    const wanted = key ? key.split('|') : []
    // 경로는 uuid라 다시 쓰이지 않는다. 남은 항목은 아무도 찾지 않으므로
    // 굳이 비우지 않는다 - 비우려면 여기서 동기 setState를 해야 한다.
    if (wanted.length === 0) return

    void (async () => {
      const { data } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(wanted, ONE_HOUR)
      if (!active || !data) return

      const next: Record<string, string> = {}
      for (const item of data) {
        if (item.path && item.signedUrl) next[item.path] = item.signedUrl
      }
      setUrls(next)
    })()

    return () => {
      active = false
    }
  }, [supabase, key])

  return urls
}
