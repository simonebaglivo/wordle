import { useCallback, useState } from 'react'

export const STORAGE_KEY = 'wordle-it-stats-v1'

export interface Stats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
  distribution: number[] // indice = numero tentativi - 1
}

function emptyStats(): Stats {
  return {
    played: 0,
    won: 0,
    currentStreak: 0,
    maxStreak: 0,
    distribution: [0, 0, 0, 0, 0, 0],
  }
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStats()
    const parsed = JSON.parse(raw) as Stats
    if (
      typeof parsed.played !== 'number' ||
      !Array.isArray(parsed.distribution) ||
      parsed.distribution.length !== 6
    ) {
      return emptyStats()
    }
    return parsed
  } catch {
    return emptyStats()
  }
}

export function useStats() {
  const [stats, setStats] = useState<Stats>(loadStats)

  const recordGame = useCallback((won: boolean, numGuesses: number) => {
    setStats((prev) => {
      const currentStreak = won ? prev.currentStreak + 1 : 0
      const distribution = [...prev.distribution]
      if (won) distribution[numGuesses - 1] += 1
      const next: Stats = {
        played: prev.played + 1,
        won: prev.won + (won ? 1 : 0),
        currentStreak,
        maxStreak: Math.max(prev.maxStreak, currentStreak),
        distribution,
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // localStorage non disponibile: si gioca senza persistenza
      }
      return next
    })
  }, [])

  return { stats, recordGame }
}
