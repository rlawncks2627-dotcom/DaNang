/**
 * 구글맵 링크.
 *
 * 지도를 앱 안에 그리지 않기로 했으므로, 길찾기는 전부 구글맵에 넘긴다.
 * 직접 넣은 링크가 있으면 그걸 쓰고, 없으면 이름으로 검색을 건다.
 * 현지어 이름이 있으면 그쪽이 검색이 훨씬 잘 맞는다.
 */
export function mapsUrl(place: {
  name: string
  name_local: string | null
  gmap_url: string | null
}) {
  if (place.gmap_url?.trim()) return place.gmap_url.trim()

  const query = `${place.name_local?.trim() || place.name} Da Nang`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
