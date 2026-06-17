import { describe, it, expect } from 'vitest'
import { isValidGuess } from './dictionary'
import { validWords, targetWords } from '../data/words'

describe('isValidGuess', () => {
  it('accetta una parola del dizionario', () => {
    expect(isValidGuess(validWords[0])).toBe(true)
  })

  it('accetta ogni parola target (i target sono un sottoinsieme dei validi)', () => {
    expect(isValidGuess(targetWords[0])).toBe(true)
    expect(isValidGuess(targetWords[targetWords.length - 1])).toBe(true)
  })

  it('rifiuta una sequenza inventata', () => {
    expect(isValidGuess('zzzzqx')).toBe(false)
  })

  it('le parole dei test di gioco esistono nel dizionario', () => {
    // sanity check: questi termini sono usati nei test di useGame e App
    for (const w of ['mela', 'pera', 'vino', 'cane', 'rana']) {
      expect(validWords, `manca "${w}" nel dizionario`).toContain(w)
    }
  })
})
