import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStats, STORAGE_KEY } from './useStats'

beforeEach(() => {
  localStorage.clear()
})

describe('useStats', () => {
  it('parte da statistiche vuote', () => {
    const { result } = renderHook(() => useStats())
    expect(result.current.stats).toEqual({
      played: 0,
      won: 0,
      currentStreak: 0,
      maxStreak: 0,
      distribution: [0, 0, 0, 0, 0, 0],
    })
  })

  it('registra una vittoria al terzo tentativo', () => {
    const { result } = renderHook(() => useStats())
    act(() => result.current.recordGame(true, 3))
    expect(result.current.stats.played).toBe(1)
    expect(result.current.stats.won).toBe(1)
    expect(result.current.stats.currentStreak).toBe(1)
    expect(result.current.stats.maxStreak).toBe(1)
    expect(result.current.stats.distribution).toEqual([0, 0, 1, 0, 0, 0])
  })

  it('una sconfitta azzera lo streak ma non il massimo', () => {
    const { result } = renderHook(() => useStats())
    act(() => result.current.recordGame(true, 2))
    act(() => result.current.recordGame(true, 4))
    act(() => result.current.recordGame(false, 6))
    expect(result.current.stats.played).toBe(3)
    expect(result.current.stats.won).toBe(2)
    expect(result.current.stats.currentStreak).toBe(0)
    expect(result.current.stats.maxStreak).toBe(2)
    expect(result.current.stats.distribution).toEqual([0, 1, 0, 1, 0, 0])
  })

  it('persiste su localStorage e ricarica', () => {
    const a = renderHook(() => useStats())
    act(() => a.result.current.recordGame(true, 1))
    a.unmount()
    const b = renderHook(() => useStats())
    expect(b.result.current.stats.played).toBe(1)
    expect(b.result.current.stats.distribution[0]).toBe(1)
  })

  it('dati corrotti su localStorage → riparte da zero senza crash', () => {
    localStorage.setItem(STORAGE_KEY, '{non-json!!!')
    const { result } = renderHook(() => useStats())
    expect(result.current.stats.played).toBe(0)
  })

  it('scarta una distribuzione di lunghezza errata su localStorage', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ played: 5, won: 3, currentStreak: 1, maxStreak: 2, distribution: [1, 2] }),
    )
    const { result } = renderHook(() => useStats())
    expect(result.current.stats.played).toBe(0)
    expect(result.current.stats.distribution).toEqual([0, 0, 0, 0, 0, 0])
  })
})
