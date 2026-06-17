import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGame, MAX_GUESSES } from './useGame'

function typeWord(result: { current: ReturnType<typeof useGame> }, word: string) {
  for (const letter of word) {
    act(() => result.current.addLetter(letter))
  }
}

describe('useGame', () => {
  it('parte in stato playing con griglia vuota', () => {
    const { result } = renderHook(() => useGame('mela'))
    expect(result.current.status).toBe('playing')
    expect(result.current.guesses).toEqual([])
    expect(result.current.current).toBe('')
    expect(result.current.target).toBe('mela')
  })

  it('addLetter accumula fino alla lunghezza del target, poi ignora', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'perab')
    expect(result.current.current).toBe('pera')
  })

  it('removeLetter cancella l\'ultima lettera', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'pe')
    act(() => result.current.removeLetter())
    expect(result.current.current).toBe('p')
  })

  it('submit con poche lettere → errore "Lettere insufficienti"', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'pe')
    act(() => result.current.submitGuess())
    expect(result.current.error).toBe('Lettere insufficienti')
    expect(result.current.guesses).toEqual([])
  })

  it('submit con parola inventata → errore "Parola non trovata"', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'zzqx')
    act(() => result.current.submitGuess())
    expect(result.current.error).toBe('Parola non trovata')
    expect(result.current.guesses).toEqual([])
  })

  it('tentativo valido sbagliato: registrato, input azzerato, si continua', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'pera')
    act(() => result.current.submitGuess())
    expect(result.current.guesses).toEqual(['pera'])
    expect(result.current.evaluations).toHaveLength(1)
    expect(result.current.current).toBe('')
    expect(result.current.status).toBe('playing')
  })

  it('indovinare la parola → won', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'mela')
    act(() => result.current.submitGuess())
    expect(result.current.status).toBe('won')
  })

  it('6 tentativi falliti → lost', () => {
    const { result } = renderHook(() => useGame('mela'))
    for (let i = 0; i < MAX_GUESSES; i++) {
      typeWord(result, 'pera')
      act(() => result.current.submitGuess())
    }
    expect(result.current.guesses).toHaveLength(MAX_GUESSES)
    expect(result.current.status).toBe('lost')
  })

  it('a partita finita l\'input è ignorato', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'mela')
    act(() => result.current.submitGuess())
    typeWord(result, 'pera')
    expect(result.current.current).toBe('')
  })

  it('keyStates riflette lo stato migliore di ogni lettera', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'pera') // p:absent, e:correct(pos1), r:absent, a:correct(pos3)
    act(() => result.current.submitGuess())
    expect(result.current.keyStates.get('e')).toBe('correct')
    expect(result.current.keyStates.get('p')).toBe('absent')
    expect(result.current.keyStates.get('a')).toBe('correct')
  })

  it('newGame resetta tutto con un nuovo target', () => {
    const { result } = renderHook(() => useGame('mela'))
    typeWord(result, 'mela')
    act(() => result.current.submitGuess())
    act(() => result.current.newGame())
    expect(result.current.status).toBe('playing')
    expect(result.current.guesses).toEqual([])
    expect(result.current.target).not.toBe('mela')
  })
})
