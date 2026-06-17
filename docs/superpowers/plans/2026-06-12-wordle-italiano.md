# Wordle Italiano Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clone di Wordle in italiano con parola del giorno deterministica, lunghezza variabile (min 4 lettere), dizionario curato incluso nel bundle e statistiche su localStorage.

**Architecture:** SPA React senza backend. `useGame` è la fonte di verità dello stato di partita; `useStats` gestisce la persistenza. La logica pura (valutazione tentativi, selezione parola, validazione) vive in `src/lib/` ed è testata unitariamente. I componenti sono presentazionali.

**Tech Stack:** React 18 + Vite + TypeScript, CSS Modules, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-06-12-wordle-italiano-design.md`

**Project root:** `c:/Users/Sherl/dev/wordle-italiano` (da creare nel Task 1). Tutti i path sotto sono relativi a questa root. Tutti i comandi vanno eseguiti dalla root del progetto, salvo il Task 1.

---

## File structure finale

```
wordle-italiano/
  scripts/build-words.mjs        ← genera src/data/words.ts (eseguito una volta)
  src/
    data/words.ts                ← targetWords + validWords (generato, committato)
    lib/
      types.ts                   ← LetterState, GameStatus
      evaluate.ts                ← evaluateGuess (verde/giallo/grigio, duplicati)
      wordSelection.ts           ← getDailyWord, getRandomWord
      dictionary.ts              ← isValidGuess
    hooks/
      useGame.ts                 ← stato partita
      useStats.ts                ← statistiche localStorage
    components/
      Tile.tsx / Row.tsx / Board.tsx
      Keyboard.tsx
      Toast.tsx / Header.tsx / StatsModal.tsx
      (+ un .module.css per componente)
    test/setup.ts
    App.tsx / main.tsx / index.css
  docs/superpowers/specs|plans/  ← spec e piano copiati nel repo
```

---

### Task 1: Scaffold del progetto

**Files:**
- Create: progetto Vite in `c:/Users/Sherl/dev/wordle-italiano`

- [ ] **Step 1: Crea il progetto Vite** (da `c:/Users/Sherl/dev`)

```bash
cd /c/Users/Sherl/dev
npm create vite@latest wordle-italiano -- --template react-ts
cd wordle-italiano
npm install
```

- [ ] **Step 2: Inizializza git e copia spec + piano nel repo**

```bash
git init
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp ../docs/superpowers/specs/2026-06-12-wordle-italiano-design.md docs/superpowers/specs/
cp ../docs/superpowers/plans/2026-06-12-wordle-italiano.md docs/superpowers/plans/
```

- [ ] **Step 3: Verifica che il template funzioni**

Run: `npm run build`
Expected: build completata senza errori (`dist/` creata).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite react-ts + spec e piano"
```

---

### Task 2: Setup Vitest + Testing Library

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json` (script `test`)
- Create: `src/test/setup.ts`
- Test: `src/test/smoke.test.tsx`

- [ ] **Step 1: Installa le dipendenze di test**

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Configura Vitest** — sostituisci `vite.config.ts` con:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 3: Crea il setup file** — `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Aggiungi lo script test** in `package.json` (sezione `scripts`):

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Scrivi uno smoke test** — `src/test/smoke.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('test setup', () => {
  it('renders with jsdom and RTL', () => {
    render(<div>ciao</div>)
    expect(screen.getByText('ciao')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: Esegui i test**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: setup Vitest + Testing Library"
```

---

### Task 3: Generazione del dizionario

**Files:**
- Create: `scripts/build-words.mjs`
- Create: `src/data/words.ts` (generato dallo script)

Fonte (verificata, HTTP 200): repo `napolux/paroleitaliane`.
- `1000_parole_italiane_comuni.txt` (~1.159 righe) → `targetWords`
- `60000_parole_italiane.txt` (~60.454 righe) → `validWords`

Regole: normalizzazione (minuscole, rimozione accenti, solo `a-z`), **lunghezza minima 4 lettere** per entrambe le liste, dedup, `targetWords ⊆ validWords` (unione), ordinamento alfabetico per output deterministico.

- [ ] **Step 1: Scrivi lo script** — `scripts/build-words.mjs`:

```js
// Genera src/data/words.ts dalle liste di napolux/paroleitaliane.
// Eseguire una volta con: node scripts/build-words.mjs
import { writeFileSync } from 'node:fs'

const BASE =
  'https://raw.githubusercontent.com/napolux/paroleitaliane/master/paroleitaliane'
const MIN_LENGTH = 4

function normalize(word) {
  return word
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

async function fetchWords(file) {
  const res = await fetch(`${BASE}/${file}`)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  const text = await res.text()
  return text
    .split('\n')
    .map(normalize)
    .filter((w) => /^[a-z]+$/.test(w) && w.length >= MIN_LENGTH)
}

const common = await fetchWords('1000_parole_italiane_comuni.txt')
const all = await fetchWords('60000_parole_italiane.txt')

const targets = [...new Set(common)].sort()
const valid = [...new Set([...all, ...targets])].sort()

const out = `// Generato da scripts/build-words.mjs — non modificare a mano.
export const targetWords: string[] = ${JSON.stringify(targets)}

export const validWords: string[] = ${JSON.stringify(valid)}
`
writeFileSync(new URL('../src/data/words.ts', import.meta.url), out)
console.log(`targetWords: ${targets.length}, validWords: ${valid.length}`)
```

- [ ] **Step 2: Esegui lo script**

Run: `node scripts/build-words.mjs`
Expected: stampa i conteggi (circa `targetWords: ~1100, validWords: ~60000`) e crea `src/data/words.ts`.

- [ ] **Step 3: Verifica il file generato**

Run: `node -e "import('./src/data/words.ts').catch(()=>{}); const t=require('fs').readFileSync('src/data/words.ts','utf8'); console.log(t.slice(0,200))"`

Più semplice: apri `src/data/words.ts` e verifica che esporti due array di stringhe minuscole senza accenti, tutte di lunghezza ≥ 4. Poi verifica che compili:

Run: `npm run build`
Expected: build ok.

- [ ] **Step 4: Commit**

```bash
git add scripts/build-words.mjs src/data/words.ts
git commit -m "feat: dizionario italiano generato (target + valid words)"
```

---

### Task 4: Tipi condivisi e valutazione dei tentativi

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/evaluate.ts`
- Test: `src/lib/evaluate.test.ts`

- [ ] **Step 1: Crea i tipi** — `src/lib/types.ts`:

```ts
export type LetterState = 'correct' | 'present' | 'absent'
export type GameStatus = 'playing' | 'won' | 'lost'
```

- [ ] **Step 2: Scrivi i test (falliranno)** — `src/lib/evaluate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { evaluateGuess } from './evaluate'

describe('evaluateGuess', () => {
  it('parola esatta: tutte correct', () => {
    expect(evaluateGuess('mela', 'mela')).toEqual([
      'correct', 'correct', 'correct', 'correct',
    ])
  })

  it('nessuna lettera in comune: tutte absent', () => {
    expect(evaluateGuess('funi', 'mela')).toEqual([
      'absent', 'absent', 'absent', 'absent',
    ])
  })

  it('lettera presente in posizione sbagliata: present', () => {
    // 'a' e 'e' presenti ma fuori posto, 'l' corretta
    expect(evaluateGuess('aole', 'mela')).toEqual([
      'present', 'absent', 'correct', 'present',
    ])
  })

  it('duplicati: il verde consuma l\'occorrenza, l\'eccesso resta absent', () => {
    // target 'pera' ha una sola 'e' e una sola 'r'
    // guess 'erre': e(0) present, r(1) absent (la r è consumata dal verde in 2), r(2) correct, e(3) absent
    expect(evaluateGuess('erre', 'pera')).toEqual([
      'present', 'absent', 'correct', 'absent',
    ])
  })

  it('duplicati: i gialli si assegnano da sinistra finché ci sono occorrenze', () => {
    // target 'salsa' ha due 's': guess 'sssss' → correct in 0 e 3, le altre absent
    expect(evaluateGuess('sssss', 'salsa')).toEqual([
      'correct', 'absent', 'absent', 'correct', 'absent',
    ])
  })
})
```

- [ ] **Step 3: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `evaluate.ts` non esiste / `evaluateGuess` non definita.

- [ ] **Step 4: Implementa** — `src/lib/evaluate.ts`:

```ts
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
```

- [ ] **Step 5: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/evaluate.ts src/lib/evaluate.test.ts
git commit -m "feat: valutazione tentativi con regola duplicati Wordle"
```

---

### Task 5: Selezione della parola (giornaliera + casuale)

**Files:**
- Create: `src/lib/wordSelection.ts`
- Test: `src/lib/wordSelection.test.ts`

- [ ] **Step 1: Scrivi i test (falliranno)** — `src/lib/wordSelection.test.ts`:

```ts
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
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `wordSelection.ts` non esiste.

- [ ] **Step 3: Implementa** — `src/lib/wordSelection.ts`:

```ts
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
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/wordSelection.ts src/lib/wordSelection.test.ts
git commit -m "feat: parola del giorno deterministica e parola casuale"
```

---

### Task 6: Validazione dei tentativi sul dizionario

**Files:**
- Create: `src/lib/dictionary.ts`
- Test: `src/lib/dictionary.test.ts`

- [ ] **Step 1: Scrivi i test (falliranno)** — `src/lib/dictionary.test.ts`:

```ts
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
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `dictionary.ts` non esiste.

- [ ] **Step 3: Implementa** — `src/lib/dictionary.ts`:

```ts
import { validWords } from '../data/words'

const validSet = new Set(validWords)

export function isValidGuess(guess: string): boolean {
  return validSet.has(guess)
}
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS. Se il sanity check fallisce per una parola specifica, sostituirla in tutti i test con un'altra parola comune di pari lunghezza presente in `validWords` (e aggiornare i test di Task 8/12 di conseguenza).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dictionary.ts src/lib/dictionary.test.ts
git commit -m "feat: validazione tentativi sul dizionario"
```

---

### Task 7: Hook useStats (statistiche persistenti)

**Files:**
- Create: `src/hooks/useStats.ts`
- Test: `src/hooks/useStats.test.ts`

- [ ] **Step 1: Scrivi i test (falliranno)** — `src/hooks/useStats.test.ts`:

```ts
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
})
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `useStats.ts` non esiste.

- [ ] **Step 3: Implementa** — `src/hooks/useStats.ts`:

```ts
import { useCallback, useState } from 'react'

export const STORAGE_KEY = 'wordle-it-stats-v1'

export interface Stats {
  played: number
  won: number
  currentStreak: number
  maxStreak: number
  distribution: number[] // indice = numero tentativi - 1
}

const emptyStats: Stats = {
  played: 0,
  won: 0,
  currentStreak: 0,
  maxStreak: 0,
  distribution: [0, 0, 0, 0, 0, 0],
}

function loadStats(): Stats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStats
    const parsed = JSON.parse(raw) as Stats
    if (typeof parsed.played !== 'number' || !Array.isArray(parsed.distribution)) {
      return emptyStats
    }
    return parsed
  } catch {
    return emptyStats
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
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useStats.ts src/hooks/useStats.test.ts
git commit -m "feat: statistiche persistenti su localStorage"
```

---

### Task 8: Hook useGame (stato della partita)

**Files:**
- Create: `src/hooks/useGame.ts`
- Test: `src/hooks/useGame.test.ts`

Nota: i test passano `initialTarget` esplicito con parole verificate dal sanity check del Task 6 (`mela`, `pera`, `vino`, `cane`, `rana`).

- [ ] **Step 1: Scrivi i test (falliranno)** — `src/hooks/useGame.test.ts`:

```ts
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
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `useGame.ts` non esiste.

- [ ] **Step 3: Implementa** — `src/hooks/useGame.ts`:

```ts
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
  const [error, setError] = useState<string | null>(null)

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
      setError(null)
      setCurrent((c) =>
        c.length < target.length ? c + letter.toLowerCase() : c,
      )
    },
    [status, target.length],
  )

  const removeLetter = useCallback(() => {
    if (status !== 'playing') return
    setError(null)
    setCurrent((c) => c.slice(0, -1))
  }, [status])

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return
    if (current.length < target.length) {
      setError('Lettere insufficienti')
      return
    }
    if (!isValidGuess(current)) {
      setError('Parola non trovata')
      return
    }
    const nextGuesses = [...guesses, current]
    setGuesses(nextGuesses)
    setCurrent('')
    if (current === target) {
      setStatus('won')
    } else if (nextGuesses.length >= MAX_GUESSES) {
      setStatus('lost')
    }
  }, [status, current, target, guesses])

  const newGame = useCallback(() => {
    setTarget((t) => getRandomWord(targetWords, t))
    setGuesses([])
    setCurrent('')
    setStatus('playing')
    setError(null)
  }, [])

  return {
    target,
    guesses,
    evaluations,
    current,
    status,
    error,
    keyStates,
    addLetter,
    removeLetter,
    submitGuess,
    newGame,
  }
}
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS. (Il test `newGame` presuppone che `targetWords` abbia più di una parola, garantito dal Task 3.)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useGame.ts src/hooks/useGame.test.ts
git commit -m "feat: hook useGame con logica completa di partita"
```

---

### Task 9: Componenti griglia (Tile, Row, Board)

**Files:**
- Create: `src/components/Tile.tsx`, `src/components/Tile.module.css`
- Create: `src/components/Row.tsx`, `src/components/Row.module.css`
- Create: `src/components/Board.tsx`, `src/components/Board.module.css`
- Test: `src/components/Board.test.tsx`

Nota sul flip: ogni tile valutata ha un'animazione flip con ritardo `i * 250ms`; il colore è applicato dall'inizio dell'animazione della singola tile (semplificazione accettata in spec review: la sequenza visiva resta sinistra→destra).

- [ ] **Step 1: Scrivi il test (fallirà)** — `src/components/Board.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Board } from './Board'

describe('Board', () => {
  it('rende 6 righe × lunghezza parola celle', () => {
    render(
      <Board wordLength={4} guesses={[]} evaluations={[]} current="" shakeCurrent={false} />,
    )
    expect(screen.getAllByTestId('tile')).toHaveLength(24)
  })

  it('mostra le lettere dei tentativi inviati e dell\'input corrente', () => {
    render(
      <Board
        wordLength={4}
        guesses={['pera']}
        evaluations={[['absent', 'correct', 'absent', 'correct']]}
        current="me"
        shakeCurrent={false}
      />,
    )
    const tiles = screen.getAllByTestId('tile')
    expect(tiles[0]).toHaveTextContent('p')
    expect(tiles[3]).toHaveTextContent('a')
    expect(tiles[4]).toHaveTextContent('m')
    expect(tiles[5]).toHaveTextContent('e')
  })

  it('applica lo stato di valutazione come data-state', () => {
    render(
      <Board
        wordLength={4}
        guesses={['pera']}
        evaluations={[['absent', 'correct', 'absent', 'correct']]}
        current=""
        shakeCurrent={false}
      />,
    )
    const tiles = screen.getAllByTestId('tile')
    expect(tiles[0]).toHaveAttribute('data-state', 'absent')
    expect(tiles[1]).toHaveAttribute('data-state', 'correct')
  })
})
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `Board.tsx` non esiste.

- [ ] **Step 3: Implementa Tile** — `src/components/Tile.tsx`:

```tsx
import styles from './Tile.module.css'
import type { LetterState } from '../lib/types'

interface TileProps {
  letter: string
  state?: LetterState // undefined = non ancora valutata
  revealDelay?: number // ms
}

export function Tile({ letter, state, revealDelay = 0 }: TileProps) {
  const classNames = [styles.tile]
  if (state) classNames.push(styles.revealed, styles[state])
  else if (letter) classNames.push(styles.filled)

  return (
    <div
      data-testid="tile"
      data-state={state}
      className={classNames.join(' ')}
      style={state ? { animationDelay: `${revealDelay}ms` } : undefined}
    >
      {letter}
    </div>
  )
}
```

`src/components/Tile.module.css`:

```css
.tile {
  width: 58px;
  height: 58px;
  border: 2px solid #3a3a3c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
  user-select: none;
}

.filled {
  border-color: #565758;
  animation: pop 0.1s ease;
}

.revealed {
  border-color: transparent;
  animation: flip 0.5s ease both;
}

.correct { background-color: #538d4e; }
.present { background-color: #b59f3b; }
.absent { background-color: #3a3a3c; }

@keyframes pop {
  50% { transform: scale(1.1); }
}

@keyframes flip {
  0% { transform: rotateX(0); }
  50% { transform: rotateX(90deg); }
  100% { transform: rotateX(0); }
}
```

- [ ] **Step 4: Implementa Row** — `src/components/Row.tsx`:

```tsx
import styles from './Row.module.css'
import { Tile } from './Tile'
import type { LetterState } from '../lib/types'

interface RowProps {
  length: number
  guess: string
  evaluation?: LetterState[]
  shake?: boolean
}

export function Row({ length, guess, evaluation, shake }: RowProps) {
  return (
    <div className={shake ? `${styles.row} ${styles.shake}` : styles.row}>
      {Array.from({ length }, (_, i) => (
        <Tile
          key={i}
          letter={guess[i] ?? ''}
          state={evaluation?.[i]}
          revealDelay={i * 250}
        />
      ))}
    </div>
  )
}
```

`src/components/Row.module.css`:

```css
.row {
  display: flex;
  gap: 5px;
}

.shake {
  animation: shake 0.5s;
}

@keyframes shake {
  10%, 90% { transform: translateX(-2px); }
  20%, 80% { transform: translateX(4px); }
  30%, 50%, 70% { transform: translateX(-6px); }
  40%, 60% { transform: translateX(6px); }
}
```

- [ ] **Step 5: Implementa Board** — `src/components/Board.tsx`:

```tsx
import styles from './Board.module.css'
import { Row } from './Row'
import { MAX_GUESSES } from '../hooks/useGame'
import type { LetterState } from '../lib/types'

interface BoardProps {
  wordLength: number
  guesses: string[]
  evaluations: LetterState[][]
  current: string
  shakeCurrent: boolean
}

export function Board({
  wordLength,
  guesses,
  evaluations,
  current,
  shakeCurrent,
}: BoardProps) {
  const rows = Array.from({ length: MAX_GUESSES }, (_, i) => {
    if (i < guesses.length) {
      return (
        <Row key={i} length={wordLength} guess={guesses[i]} evaluation={evaluations[i]} />
      )
    }
    if (i === guesses.length) {
      return <Row key={i} length={wordLength} guess={current} shake={shakeCurrent} />
    }
    return <Row key={i} length={wordLength} guess="" />
  })

  return <div className={styles.board}>{rows}</div>
}
```

`src/components/Board.module.css`:

```css
.board {
  display: flex;
  flex-direction: column;
  gap: 5px;
  align-items: center;
}
```

- [ ] **Step 6: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Tile.tsx src/components/Tile.module.css src/components/Row.tsx src/components/Row.module.css src/components/Board.tsx src/components/Board.module.css src/components/Board.test.tsx
git commit -m "feat: griglia di gioco con animazioni flip e shake"
```

---

### Task 10: Tastiera virtuale

**Files:**
- Create: `src/components/Keyboard.tsx`, `src/components/Keyboard.module.css`
- Test: `src/components/Keyboard.test.tsx`

- [ ] **Step 1: Scrivi il test (fallirà)** — `src/components/Keyboard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Keyboard } from './Keyboard'
import type { LetterState } from '../lib/types'

function renderKeyboard(keyStates = new Map<string, LetterState>()) {
  const onLetter = vi.fn()
  const onEnter = vi.fn()
  const onBackspace = vi.fn()
  render(
    <Keyboard
      keyStates={keyStates}
      onLetter={onLetter}
      onEnter={onEnter}
      onBackspace={onBackspace}
    />,
  )
  return { onLetter, onEnter, onBackspace }
}

describe('Keyboard', () => {
  it('click su una lettera chiama onLetter', async () => {
    const { onLetter } = renderKeyboard()
    await userEvent.click(screen.getByRole('button', { name: 'q' }))
    expect(onLetter).toHaveBeenCalledWith('q')
  })

  it('click su Invio e Backspace chiamano i rispettivi handler', async () => {
    const { onEnter, onBackspace } = renderKeyboard()
    await userEvent.click(screen.getByRole('button', { name: 'invio' }))
    expect(onEnter).toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'cancella' }))
    expect(onBackspace).toHaveBeenCalled()
  })

  it('colora i tasti secondo keyStates', () => {
    renderKeyboard(new Map([['a', 'correct'], ['s', 'absent']]))
    expect(screen.getByRole('button', { name: 'a' })).toHaveAttribute('data-state', 'correct')
    expect(screen.getByRole('button', { name: 's' })).toHaveAttribute('data-state', 'absent')
    expect(screen.getByRole('button', { name: 'd' })).not.toHaveAttribute('data-state')
  })
})
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `Keyboard.tsx` non esiste.

- [ ] **Step 3: Implementa** — `src/components/Keyboard.tsx`:

```tsx
import styles from './Keyboard.module.css'
import type { LetterState } from '../lib/types'

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

interface KeyboardProps {
  keyStates: Map<string, LetterState>
  onLetter: (letter: string) => void
  onEnter: () => void
  onBackspace: () => void
}

export function Keyboard({ keyStates, onLetter, onEnter, onBackspace }: KeyboardProps) {
  return (
    <div className={styles.keyboard}>
      {ROWS.map((row, rowIndex) => (
        <div key={row} className={styles.krow}>
          {rowIndex === 2 && (
            <button className={`${styles.key} ${styles.wide}`} onClick={onEnter}>
              invio
            </button>
          )}
          {[...row].map((letter) => {
            const state = keyStates.get(letter)
            return (
              <button
                key={letter}
                data-state={state}
                className={state ? `${styles.key} ${styles[state]}` : styles.key}
                onClick={() => onLetter(letter)}
              >
                {letter}
              </button>
            )
          })}
          {rowIndex === 2 && (
            <button
              className={`${styles.key} ${styles.wide}`}
              onClick={onBackspace}
              aria-label="cancella"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
```

`src/components/Keyboard.module.css`:

```css
.keyboard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 24px;
}

.krow {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.key {
  min-width: 36px;
  height: 52px;
  padding: 0 10px;
  border: none;
  border-radius: 4px;
  background: #818384;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  text-transform: uppercase;
  cursor: pointer;
  transition: background-color 0.3s;
}

.wide {
  min-width: 60px;
  font-size: 0.75rem;
}

.correct { background: #538d4e; }
.present { background: #b59f3b; }
.absent { background: #3a3a3c; }
```

- [ ] **Step 4: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Keyboard.tsx src/components/Keyboard.module.css src/components/Keyboard.test.tsx
git commit -m "feat: tastiera virtuale QWERTY colorata"
```

---

### Task 11: Header, Toast e StatsModal

**Files:**
- Create: `src/components/Header.tsx`, `src/components/Header.module.css`
- Create: `src/components/Toast.tsx`, `src/components/Toast.module.css`
- Create: `src/components/StatsModal.tsx`, `src/components/StatsModal.module.css`
- Test: `src/components/StatsModal.test.tsx`

- [ ] **Step 1: Scrivi il test (fallirà)** — `src/components/StatsModal.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatsModal } from './StatsModal'
import type { Stats } from '../hooks/useStats'

const stats: Stats = {
  played: 10,
  won: 7,
  currentStreak: 2,
  maxStreak: 5,
  distribution: [0, 1, 3, 2, 1, 0],
}

describe('StatsModal', () => {
  it('non rende nulla se open è false', () => {
    render(
      <StatsModal open={false} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.queryByText('Statistiche')).not.toBeInTheDocument()
  })

  it('mostra le statistiche principali', () => {
    render(
      <StatsModal open={true} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.getByText('Statistiche')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument() // giocate
    expect(screen.getByText('70%')).toBeInTheDocument() // vittorie
  })

  it('in caso di sconfitta rivela la parola', () => {
    render(
      <StatsModal open={true} stats={stats} status="lost" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.getByText(/mela/i)).toBeInTheDocument()
  })

  it('in caso di vittoria non rivela la parola', () => {
    render(
      <StatsModal open={true} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={() => {}} />,
    )
    expect(screen.queryByText(/la parola era/i)).not.toBeInTheDocument()
  })

  it('"Nuova parola" chiama onNewGame', async () => {
    const onNewGame = vi.fn()
    render(
      <StatsModal open={true} stats={stats} status="won" target="mela"
        onClose={() => {}} onNewGame={onNewGame} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /nuova parola/i }))
    expect(onNewGame).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `StatsModal.tsx` non esiste.

- [ ] **Step 3: Implementa StatsModal** — `src/components/StatsModal.tsx`:

```tsx
import styles from './StatsModal.module.css'
import type { Stats } from '../hooks/useStats'
import type { GameStatus } from '../lib/types'

interface StatsModalProps {
  open: boolean
  stats: Stats
  status: GameStatus
  target: string
  onClose: () => void
  onNewGame: () => void
}

export function StatsModal({ open, stats, status, target, onClose, onNewGame }: StatsModalProps) {
  if (!open) return null

  const winPct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0
  const maxDist = Math.max(...stats.distribution, 1)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="chiudi">
          ×
        </button>
        <h2>Statistiche</h2>
        {status === 'lost' && (
          <p className={styles.reveal}>
            La parola era: <strong>{target}</strong>
          </p>
        )}
        <div className={styles.grid}>
          <div className={styles.stat}>
            <div className={styles.value}>{stats.played}</div>
            <div className={styles.label}>Giocate</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.value}>{winPct}%</div>
            <div className={styles.label}>Vittorie</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.value}>{stats.currentStreak}</div>
            <div className={styles.label}>Streak</div>
          </div>
          <div className={styles.stat}>
            <div className={styles.value}>{stats.maxStreak}</div>
            <div className={styles.label}>Streak max</div>
          </div>
        </div>
        <h3>Distribuzione tentativi</h3>
        <div className={styles.distribution}>
          {stats.distribution.map((count, i) => (
            <div key={i} className={styles.distRow}>
              <span className={styles.distIndex}>{i + 1}</span>
              <div className={styles.distBar} style={{ width: `${(count / maxDist) * 100}%` }}>
                {count}
              </div>
            </div>
          ))}
        </div>
        <button className={styles.newGame} onClick={onNewGame}>
          Nuova parola
        </button>
      </div>
    </div>
  )
}
```

`src/components/StatsModal.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal {
  position: relative;
  background: #121213;
  border: 1px solid #3a3a3c;
  border-radius: 8px;
  padding: 24px 32px;
  width: min(90vw, 420px);
  color: #fff;
  text-align: center;
}

.close {
  position: absolute;
  top: 8px;
  right: 12px;
  background: none;
  border: none;
  color: #818384;
  font-size: 1.5rem;
  cursor: pointer;
}

.reveal {
  color: #b59f3b;
}

.reveal strong {
  text-transform: uppercase;
}

.grid {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin: 16px 0;
}

.value {
  font-size: 2rem;
  font-weight: 700;
}

.label {
  font-size: 0.75rem;
  color: #818384;
}

.distribution {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 20px;
}

.distRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.distIndex {
  width: 1em;
  color: #818384;
}

.distBar {
  background: #538d4e;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: right;
  padding: 2px 6px;
  border-radius: 2px;
  min-width: 1.5em;
}

.newGame {
  background: #538d4e;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 4: Implementa Toast** — `src/components/Toast.tsx`:

```tsx
import styles from './Toast.module.css'

interface ToastProps {
  message: string | null
}

export function Toast({ message }: ToastProps) {
  if (!message) return null
  return (
    <div className={styles.toast} role="alert">
      {message}
    </div>
  )
}
```

`src/components/Toast.module.css`:

```css
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: #121213;
  font-weight: 700;
  padding: 10px 16px;
  border-radius: 4px;
  z-index: 20;
}
```

- [ ] **Step 5: Implementa Header** — `src/components/Header.tsx`:

```tsx
import styles from './Header.module.css'

interface HeaderProps {
  onShowStats: () => void
}

export function Header({ onShowStats }: HeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Parole</h1>
      <button className={styles.statsButton} onClick={onShowStats} aria-label="statistiche">
        📊
      </button>
    </header>
  )
}
```

`src/components/Header.module.css`:

```css
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-bottom: 1px solid #3a3a3c;
  padding: 8px 0;
  margin-bottom: 24px;
  width: 100%;
}

.title {
  margin: 0;
  font-size: 1.6rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.statsButton {
  position: absolute;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.3rem;
  cursor: pointer;
}
```

- [ ] **Step 6: Esegui i test e verifica che passino**

Run: `npm test`
Expected: tutti PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Header.tsx src/components/Header.module.css src/components/Toast.tsx src/components/Toast.module.css src/components/StatsModal.tsx src/components/StatsModal.module.css src/components/StatsModal.test.tsx
git commit -m "feat: header, toast e modale statistiche"
```

---

### Task 12: App — wiring completo e tastiera fisica

**Files:**
- Modify: `src/App.tsx` (sostituire il contenuto del template)
- Modify: `src/index.css` (sostituire)
- Delete: `src/App.css`, `src/assets/react.svg` (residui del template)
- Test: `src/App.test.tsx`

- [ ] **Step 1: Scrivi il test di integrazione (fallirà)** — `src/App.test.tsx`:

Nota: `App` accetta una prop opzionale `initialTarget` (solo per i test) che passa a `useGame`.

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import App from './App'

beforeEach(() => {
  localStorage.clear()
})

describe('App', () => {
  it('partita vinta con la tastiera fisica: modale con statistiche aggiornate', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<App initialTarget="mela" />)

    await user.keyboard('mela{Enter}')

    // il modale si apre dopo 1.5s
    act(() => vi.advanceTimersByTime(1500))
    expect(screen.getByText('Statistiche')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('parola non in dizionario: toast di errore, nessuna riga consumata', async () => {
    const user = userEvent.setup()
    render(<App initialTarget="mela" />)

    await user.keyboard('zzqx{Enter}')
    expect(screen.getByRole('alert')).toHaveTextContent('Parola non trovata')
  })

  it('la tastiera virtuale inserisce lettere nella griglia', async () => {
    const user = userEvent.setup()
    render(<App initialTarget="mela" />)

    await user.click(screen.getByRole('button', { name: 'p' }))
    const tiles = screen.getAllByTestId('tile')
    expect(tiles[0]).toHaveTextContent('p')
  })
})
```

- [ ] **Step 2: Esegui i test e verifica che falliscano**

Run: `npm test`
Expected: FAIL — `App` non accetta `initialTarget` / componenti non collegati.

- [ ] **Step 3: Implementa App** — `src/App.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useGame } from './hooks/useGame'
import { useStats } from './hooks/useStats'
import { Header } from './components/Header'
import { Board } from './components/Board'
import { Keyboard } from './components/Keyboard'
import { Toast } from './components/Toast'
import { StatsModal } from './components/StatsModal'

interface AppProps {
  initialTarget?: string // solo per i test
}

export default function App({ initialTarget }: AppProps) {
  const game = useGame(initialTarget)
  const { stats, recordGame } = useStats()
  const [showStats, setShowStats] = useState(false)
  const [shake, setShake] = useState(false)

  const { status, guesses, error, addLetter, removeLetter, submitGuess } = game

  // input da tastiera fisica
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') submitGuess()
      else if (e.key === 'Backspace') removeLetter()
      else if (/^[a-zA-Z]$/.test(e.key)) addLetter(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [submitGuess, removeLetter, addLetter])

  // shake della riga corrente quando compare un errore
  useEffect(() => {
    if (!error) return
    setShake(true)
    const t = setTimeout(() => setShake(false), 500)
    return () => clearTimeout(t)
  }, [error])

  // fine partita: registra le statistiche e apri il modale dopo 1.5s
  useEffect(() => {
    if (status === 'playing') return
    recordGame(status === 'won', guesses.length)
    const t = setTimeout(() => setShowStats(true), 1500)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  function handleNewGame() {
    setShowStats(false)
    game.newGame()
  }

  return (
    <div className="app">
      <Header onShowStats={() => setShowStats(true)} />
      <Toast message={error} />
      <Board
        wordLength={game.target.length}
        guesses={guesses}
        evaluations={game.evaluations}
        current={game.current}
        shakeCurrent={shake}
      />
      <Keyboard
        keyStates={game.keyStates}
        onLetter={addLetter}
        onEnter={submitGuess}
        onBackspace={removeLetter}
      />
      <StatsModal
        open={showStats}
        stats={stats}
        status={status}
        target={game.target}
        onClose={() => setShowStats(false)}
        onNewGame={handleNewGame}
      />
    </div>
  )
}
```

Nota sul `useEffect` di fine partita: dipende volutamente solo da `status` — `recordGame` è stabile (useCallback) e `guesses.length` al momento del cambio di stato è il valore corretto; aggiungere `guesses` alle dipendenze causerebbe doppie registrazioni.

- [ ] **Step 4: Sostituisci gli stili globali** — `src/index.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #121213;
  color: #fff;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

#root {
  min-height: 100vh;
}

.app {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding-bottom: 24px;
}
```

- [ ] **Step 5: Rimuovi i residui del template**

```bash
rm -f src/App.css src/assets/react.svg
```

Verifica che `src/main.tsx` non importi `App.css` (il template importa solo `index.css` in `main.tsx`; se `App.tsx` importava `./App.css`, l'import è già sparito con la riscrittura).

- [ ] **Step 6: Esegui tutti i test**

Run: `npm test`
Expected: tutti PASS.

- [ ] **Step 7: Verifica manuale**

Run: `npm run dev`
Apri il browser: la griglia ha la lunghezza della parola del giorno, si gioca con tastiera fisica e virtuale, errori → toast + shake, vittoria/sconfitta → modale dopo 1.5s, "Nuova parola" inizia una partita extra.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: app completa con tastiera fisica, toast e statistiche"
```

---

### Task 13: Verifica finale

- [ ] **Step 1: Esegui l'intera suite**

Run: `npm test`
Expected: tutti PASS, nessun test skippato.

- [ ] **Step 2: Verifica la build di produzione**

Run: `npm run build`
Expected: build completata. Nota: `words.ts` pesa ~700KB; se Vite avvisa sul chunk size è atteso e accettabile (gzip lo riduce a ~200KB).

- [ ] **Step 3: Anteprima della build**

Run: `npm run preview`
Expected: il gioco funziona dalla build di produzione.

- [ ] **Step 4: Commit finale (se ci sono modifiche residue)**

```bash
git add -A
git commit -m "chore: verifica finale"
```
