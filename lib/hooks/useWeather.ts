'use client'

import { useEffect, useState } from 'react'

// 다낭
const LAT = 16.0544
const LON = 108.2022

type Weather = { temperature: number; label: string; emoji: string }

/** WMO 날씨 코드. 여행자에게 필요한 만큼만 묶었다. */
function describe(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: '맑음', emoji: '☀️' }
  if (code <= 2) return { label: '구름 조금', emoji: '🌤' }
  if (code === 3) return { label: '흐림', emoji: '☁️' }
  if (code <= 48) return { label: '안개', emoji: '🌫' }
  if (code <= 57) return { label: '이슬비', emoji: '🌦' }
  if (code <= 67) return { label: '비', emoji: '🌧' }
  if (code <= 77) return { label: '눈', emoji: '🌨' }
  if (code <= 82) return { label: '소나기', emoji: '🌧' }
  if (code <= 86) return { label: '눈보라', emoji: '🌨' }
  return { label: '천둥번개', emoji: '⛈' }
}

/**
 * 다낭 현재 날씨. API 키가 필요 없는 Open-Meteo를 쓴다.
 * 실패하면 조용히 아무것도 보여주지 않는다 - 날씨는 없어도 되는 정보다.
 */
export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(null)

  useEffect(() => {
    let active = true

    void (async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=Asia%2FBangkok`,
        )
        const json = await res.json()
        if (!active) return

        const temperature = json?.current?.temperature_2m
        const code = json?.current?.weather_code
        if (typeof temperature !== 'number' || typeof code !== 'number') return

        setWeather({ temperature, ...describe(code) })
      } catch {
        // 그대로 둔다
      }
    })()

    return () => {
      active = false
    }
  }, [])

  return weather
}
