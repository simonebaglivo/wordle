// Genera src/data/words.ts dalle liste di napolux/paroleitaliane.
// Eseguire una volta con: node scripts/build-words.mjs
import { writeFileSync } from 'node:fs'

const BASE =
  'https://raw.githubusercontent.com/napolux/paroleitaliane/master/paroleitaliane'
const MIN_LENGTH = 4

// Parole comuni che mancano dalle liste sorgente ma che vogliamo sempre
// includere sia tra le soluzioni (targetWords) sia tra i tentativi validi
// (validWords). Sopravvivono a ogni rigenerazione. Aggiungi qui le parole
// segnalate dal report "comuni assenti da target" stampato a fine esecuzione.
const EXTRA_WORDS = ['guanto', 'retina']

// Lista di frequenza italiana (OpenSubtitles, ordinata per frequenza d'uso):
// usata solo per il report informativo delle parole comuni mancanti.
const FREQUENCY_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt'
const FREQUENCY_TOP_N = 5000
const REPORT_LIMIT = 100

function normalize(word) {
  return word
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function isUsable(word) {
  return /^[a-z]+$/.test(word) && word.length >= MIN_LENGTH
}

async function fetchWords(file) {
  const res = await fetch(`${BASE}/${file}`)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  const text = await res.text()
  return text.split('\n').map(normalize).filter(isUsable)
}

const common = await fetchWords('1000_parole_italiane_comuni.txt')
const all = await fetchWords('60000_parole_italiane.txt')

// Normalizza le parole extra e scarta (segnalando) quelle non valide.
const extra = []
for (const raw of EXTRA_WORDS) {
  const word = normalize(raw)
  if (isUsable(word)) {
    extra.push(word)
  } else {
    console.warn(`EXTRA_WORDS: scartata "${raw}" (lunghezza >= ${MIN_LENGTH}, solo lettere a-z)`)
  }
}

const targets = [...new Set([...common, ...extra])].sort()
const valid = [...new Set([...all, ...targets])].sort()

const out = `// Generato da scripts/build-words.mjs — non modificare a mano.
export const targetWords: string[] = ${JSON.stringify(targets)}

export const validWords: string[] = ${JSON.stringify(valid)}
`
writeFileSync(new URL('../src/data/words.ts', import.meta.url), out)
console.log(`targetWords: ${targets.length}, validWords: ${valid.length}`)

// Report: parole comuni (per frequenza d'uso) assenti da targetWords.
// È solo informativo: non modifica le liste. Best effort, non fa fallire il build.
try {
  const res = await fetch(FREQUENCY_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const frequent = text
    .split('\n')
    .slice(0, FREQUENCY_TOP_N)
    .map((line) => normalize(line.split(/\s+/)[0] ?? ''))
    .filter(isUsable)

  const targetSet = new Set(targets)
  const missing = [...new Set(frequent)].filter((w) => !targetSet.has(w))

  console.log(
    `\nReport: ${missing.length} parole comuni (top ${FREQUENCY_TOP_N}) assenti da targetWords.`,
  )
  if (missing.length > 0) {
    console.log(`Prime ${Math.min(REPORT_LIMIT, missing.length)}:`)
    console.log(missing.slice(0, REPORT_LIMIT).join(', '))
    console.log('\nAggiungi le parole che vuoi promuovere a EXTRA_WORDS in questo script.')
  }
} catch (err) {
  console.warn(`\nReport saltato: impossibile scaricare la lista di frequenza (${err.message}).`)
}
