import type { LetterState } from './types'

// Regola Wordle: prima i verdi, poi i gialli da sinistra a destra
// finché restano occorrenze non consumate della lettera nel target.
export function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(guess.length).fill('absent')
  const remaining = new Map<string, number>()

  for (let i = 0; i < target.length; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct'
    } else {
      remaining.set(target[i], (remaining.get(target[i]) ?? 0) + 1)
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (result[i] === 'correct') continue
    const count = remaining.get(guess[i]) ?? 0
    if (count > 0) {
      result[i] = 'present'
      remaining.set(guess[i], count - 1)
    }
  }

  return result
}
