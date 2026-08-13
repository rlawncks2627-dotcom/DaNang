import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './supabase/types'

export const PHOTO_BUCKET = 'trip-photos'

type Client = SupabaseClient<Database>

/**
 * 올리기 전에 줄인다.
 *
 * 요즘 폰 사진은 한 장에 4~5MB다. 무료 저장공간은 1GB뿐이고, 여행 중
 * 현지 네트워크로 원본을 올리는 건 기다림이 길다. 긴 변 1600px이면
 * 화면에서 보기엔 충분하고 대개 300KB 안쪽으로 떨어진다.
 */
export async function shrinkImage(
  file: File,
  maxEdge = 1600,
  quality = 0.82,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)

  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    // 캔버스를 못 쓰면 원본이라도 올린다. 버킷 제한이 5MB라 대개는 통과한다.
    return file
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  )

  return blob ?? file
}

/** 저장 경로. 첫 칸이 여행 id여야 스토리지 정책이 통과시킨다. */
function pathFor(tripId: string) {
  return `${tripId}/${crypto.randomUUID()}.jpg`
}

export async function uploadPhoto(
  supabase: Client,
  tripId: string,
  file: File,
): Promise<string> {
  const blob = await shrinkImage(file)
  const path = pathFor(tripId)

  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg' })

  if (error) throw error
  return path
}

export async function removePhotos(supabase: Client, paths: string[]) {
  if (paths.length === 0) return
  await supabase.storage.from(PHOTO_BUCKET).remove(paths)
}
