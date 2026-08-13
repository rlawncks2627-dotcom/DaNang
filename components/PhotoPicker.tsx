'use client'

import { useEffect, useMemo, useRef } from 'react'

/**
 * 사진 고르기.
 *
 * 폰에서는 파일 선택이 곧 카메라 열기라, 버튼 하나로 충분하다.
 * 고른 사진은 올리기 전에 미리보기로 보여준다 - 잘못 고른 것을
 * 올리고 나서 아는 것보다 낫다.
 */
export function PhotoPicker({
  files,
  onChange,
  max = 2,
  label = '사진 넣기',
}: {
  files: File[]
  onChange: (files: File[]) => void
  max?: number
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  // 고른 파일에서 그대로 나오는 값이라 state로 들 이유가 없다
  const previews = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  )

  // 미리보기 URL은 직접 놓아줘야 메모리에서 사라진다
  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews],
  )

  function add(picked: FileList | null) {
    if (!picked) return
    onChange([...files, ...Array.from(picked)].slice(0, max))
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      {previews.length > 0 && (
        <ul className="mb-3 flex gap-2">
          {previews.map((url, index) => (
            <li key={url} className="relative">
              {/* 미리보기는 로컬 blob이라 next/image가 최적화할 게 없다 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`고른 사진 ${index + 1}`}
                className="h-24 w-24 border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={`${index + 1}번째 사진 빼기`}
                className="absolute -top-2 -right-2 grid h-8 w-8 min-h-0 place-items-center border-2 border-ink bg-card font-bold text-signal"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length < max && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple={max > 1}
            onChange={(e) => add(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border border-line font-bold text-muted"
          >
            📷 {label}
          </button>
        </>
      )}
    </div>
  )
}
