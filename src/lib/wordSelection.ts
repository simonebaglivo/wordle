const MS_PER_DAY = 86_400_000

// Parola del giorno deterministica: stesso giorno (ora locale) → stessa parola
// su qualunque dispositivo, senza server.
export function getDailyWord(words: string[], date: Date = new Date()): string {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY,
  )
  return words[dayNumber % words.length]
}

export function getRandomWord(words: string[], exclude?: string): string {
  if (words.length === 1) return words[0]
  let word: string
  do {
    word = words[Math.floor(Math.random() * words.length)]
  } while (word === exclude)
  return word
}
