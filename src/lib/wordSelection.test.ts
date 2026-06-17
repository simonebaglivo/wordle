import { describe, it, expect } from 'vitest'
import { getDailyWord, getRandomWord } from './wordSelection'

const words = ['alfa', 'bravo', 'carta', 'delta', 'fiume']

describe('getDailyWord', () => {
  it('stessa data → stessa parola, anche con orari diversi', () => {
    const mattina = new Date(2026, 5, 12, 8, 0, 0)
    const sera = new Date(2026, 5, 12, 23, 59, 59)
    expect(getDailyWord(words, mattina)).toBe(getDailyWord(words, sera))
  })

  it('giorni consecutivi → indici consecutivi (modulo lunghezza)', () => {
    const oggi = new Date(2026, 5, 12)
    const domani = new Date(2026, 5, 13)
    const i = words.indexOf(getDailyWord(words, oggi))
    const j = words.indexOf(getDailyWord(words, domani))
    expect(j).toBe((i + 1) % words.length)
  })
})

describe('getRandomWord', () => {
  it('restituisce una parola della lista', () => {
    expect(words).toContain(getRandomWord(words))
  })

  it('non restituisce mai la parola esclusa', () => {
    for (let n = 0; n < 50; n++) {
      expect(getRandomWord(words, 'carta')).not.toBe('carta')
    }
  })

  it('con lista di una sola parola la restituisce anche se esclusa', () => {
    expect(getRandomWord(['alfa'], 'alfa')).toBe('alfa')
  })
})
