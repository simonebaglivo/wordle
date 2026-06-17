import { useCallback, useState } from 'react'
import { targetWords } from '../data/words'
import { evaluateGuess } from '../lib/evaluate'
import { isValidGuess } from '../lib/dictionary'
import { getDailyWord, getRandomWord } from '../lib/wordSelection'
import type { GameStatus, LetterState } from '../lib/types'

export const MAX_GUESSES = 6

const STATE_RANK: Record<LetterState, number> = {
  absent: 0,
  present: 1,
  correct: 2,
}

export function useGame(initialTarget?: string) {
  const [target, setTarget] = useState(
    () => initialTarget ?? getDailyWord(targetWords),
  )
  const [guesses, setGuesses] = useState<string[]>([])
  const [current, setCurrent] = useState('')
  const [status, setStatus] = useState<GameStatus>('playing')
  // errorEvent cambia identità a ogni errore (anche se il messaggio è uguale),
  // così chi osserva può rifare lo shake anche su due submit identici di fila.
  const [errorEvent, setErrorEvent] = useState<{ message: string; n: number } | null>(
    null,
  )
  const error = errorEvent?.message ?? null

  const raiseError = useCallback((message: string) => {
    setErrorEvent((prev) => ({ message, n: (prev?.n ?? 0) + 1 }))
  }, [])

  const clearError = useCallback(() => setErrorEvent(null), [])

  const evaluations = guesses.map((g) => evaluateGuess(g, target))

  const keyStates = new Map<string, LetterState>()
  guesses.forEach((guess, gi) => {
    ;[...guess].forEach((letter, i) => {
      const state = evaluations[gi][i]
      const prev = keyStates.get(letter)
      if (!prev || STATE_RANK[state] > STATE_RANK[prev]) {
        keyStates.set(letter, state)
      }
    })
  })

  const addLetter = useCallback(
    (letter: string) => {
      if (status !== 'playing') return
      setErrorEvent(null)
      setCurrent((c) =>
        c.length < target.length ? c + letter.toLowerCase() : c,
      )
    },
    [status, target.length],
  )

  const removeLetter = useCallback(() => {
    if (status !== 'playing') return
    setErrorEvent(null)
    setCurrent((c) => c.slice(0, -1))
  }, [status])

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return
    if (current.length < target.length) {
      raiseError('Lettere insufficienti')
      return
    }
    if (!isValidGuess(current)) {
      raiseError('Parola non trovata')
      return
    }
    setErrorEvent(null)
    const nextGuesses = [...guesses, current]
    setGuesses(nextGuesses)
    setCurrent('')
    if (current === target) {
      setStatus('won')
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setStatus('lost')
    }
  }, [status, current, target, guesses, raiseError])

  const newGame = useCallback(() => {
    setTarget((t) => getRandomWord(targetWords, t))
    setGuesses([])
    setCurrent('')
    setStatus('playing')
    setErrorEvent(null)
  }, [])

  return {
    target,
    guesses,
    evaluations,
    current,
    status,
    error,
    errorEvent,
    keyStates,
    addLetter,
    removeLetter,
    submitGuess,
    newGame,
    clearError,
  }
}
