import { validWords } from '../data/words'

const validSet = new Set(validWords)

export function isValidGuess(guess: string): boolean {
  return validSet.has(guess)
}
