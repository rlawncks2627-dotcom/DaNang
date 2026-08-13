'use client'

import { useState } from 'react'

import { PageHeader } from '@/components/PageHeader'
import { PhotoPicker } from '@/components/PhotoPicker'
import { useTrip } from '@/components/TripProvider'
import { useRealtimeTable } from '@/lib/hooks/useRealtimeTable'
import { useSignedUrls } from '@/lib/hooks/useSignedUrls'
import { removePhotos, uploadPhoto } from '@/lib/photos'
import type { Note } from '@/lib/supabase/types'

const byNewest = (a: Note, b: Note) => b.created_at.localeCompare(a.created_at)

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function NotesPage() {
  const { trip, members, me, supabase } = useTrip()
  const { rows, loading, applyLocal } = useRealtimeTable('notes', byNewest)

  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 화면에 있는 모든 사진을 한 번에 서명받는다
  const urls = useSignedUrls(rows.flatMap((n) => n.photo_urls))

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if ((!content.trim() && files.length === 0) || saving) return

    setSaving(true)
    setError(null)

    try {
      const paths: string[] = []
      for (const file of files) {
        paths.push(await uploadPhoto(supabase, trip.id, file))
      }

      const { error: insertError } = await supabase.from('notes').insert({
        trip_id: trip.id,
        member_id: me.id,
        content: content.trim() || null,
        photo_urls: paths,
      })

      if (insertError) {
        // 글이 안 들어갔으면 올린 사진도 치운다. 주인 없는 파일이 남으면
        // 저장공간만 먹고 아무도 못 찾는다.
        await removePhotos(supabase, paths)
        throw insertError
      }

      setContent('')
      setFiles([])
    } catch {
      setError('남기지 못했습니다. 잠시 후 다시 해보세요.')
    } finally {
      setSaving(false)
    }
  }

  async function remove(note: Note) {
    applyLocal((prev) => prev.filter((n) => n.id !== note.id))
    await supabase.from('notes').delete().eq('id', note.id)
    await removePhotos(supabase, note.photo_urls)
  }

  return (
    <>
      <PageHeader
        title="기록"
        subtitle={loading ? '불러오는 중…' : `${rows.length}개의 기록`}
      />

      <form onSubmit={add} className="mb-8 border-l-4 border-ink bg-card p-5">
        <label className="block">
          <span className="mb-1 block font-bold">지금 무슨 일이 있었나요</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="한 줄이면 충분합니다"
            className="w-full border border-line bg-paper p-4"
          />
        </label>

        <div className="mt-3">
          <PhotoPicker files={files} onChange={setFiles} max={2} />
        </div>

        {error && <p className="mt-3 text-signal">{error}</p>}

        <button
          type="submit"
          disabled={(!content.trim() && files.length === 0) || saving}
          className="mt-4 w-full bg-signal font-bold text-white disabled:opacity-40"
        >
          {saving ? '남기는 중…' : '남기기'}
        </button>
      </form>

      {!loading && rows.length === 0 && (
        <p className="text-muted">
          아직 없습니다. 여행 중 한 줄씩 남기면 돌아와서 그대로 여행기가 됩니다.
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {rows.map((note) => {
          const author = members.find((m) => m.id === note.member_id)

          return (
            <li
              key={note.id}
              style={{ borderColor: author?.color }}
              className="border-l-4 bg-card p-5"
            >
              <p className="text-sm text-muted">
                {author ? `${author.emoji} ${author.name}` : '알 수 없음'} ·{' '}
                {formatWhen(note.created_at)}
              </p>

              {note.content && (
                <p className="mt-2 whitespace-pre-wrap">{note.content}</p>
              )}

              {note.photo_urls.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {note.photo_urls.map((path) =>
                    urls[path] ? (
                      <li key={path}>
                        {/* 서명 URL은 한 시간짜리라 next/image로 최적화할 수 없다 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={urls[path]}
                          alt="여행 사진"
                          loading="lazy"
                          className="max-h-64 border border-line object-cover"
                        />
                      </li>
                    ) : (
                      <li
                        key={path}
                        className="grid h-32 w-32 place-items-center border border-line text-sm text-muted"
                      >
                        사진 여는 중…
                      </li>
                    ),
                  )}
                </ul>
              )}

              <button
                type="button"
                onClick={() => void remove(note)}
                className="mt-3 min-h-11 border border-line px-3 text-sm font-bold text-signal"
              >
                지우기
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
