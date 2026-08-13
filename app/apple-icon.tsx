import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { ImageResponse } from 'next/og'

/**
 * iOS 홈 화면 아이콘.
 *
 * 사파리는 SVG 아이콘을 안 받으므로 PNG로 구워야 한다. 그림은
 * public/icon.svg를 그대로 읽어 쓴다 - 두 벌로 두면 한쪽만 고쳤을 때
 * 안드로이드와 아이폰이 달라 보인다.
 */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default async function AppleIcon() {
  const svg = await readFile(join(process.cwd(), 'public', 'icon.svg'), 'utf8')
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={dataUri} alt="" width={size.width} height={size.height} />
      </div>
    ),
    size,
  )
}
