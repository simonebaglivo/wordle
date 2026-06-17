// Genera src/data/words.ts: una sola lista di parole comuni (le 1000 di
// napolux + le più frequenti da OpenSubtitles + include.txt, meno exclude.txt).
// targetWords e validWords sono identiche: ogni parola accettata può uscire.
// Eseguire con: node scripts/build-words.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const BASE =
  'https://raw.githubusercontent.com/napolux/paroleitaliane/master/paroleitaliane'
const MIN_LENGTH = 4

// Due punti di ingresso editabili a mano (una parola per riga):
//   include.txt — parole sempre presenti tra soluzioni e tentativi validi,
//                 anche se assenti dalle liste sorgente.
//   exclude.txt — parole sempre rimosse da tutto: vince su comuni, frequenti
//                 e include.txt. Per nomi propri, refusi, parole non adatte.
// Dopo aver modificato uno dei due file, rilancia: node scripts/build-words.mjs
const INCLUDE_FILE = 'include.txt'
const EXCLUDE_FILE = 'exclude.txt'

// Lista di frequenza italiana (OpenSubtitles, ordinata per frequenza d'uso).
// Le parole più frequenti vengono promosse a soluzioni (targetWords), così il
// pool del "parola del giorno" copre termini comuni assenti dalle 1000 parole
// di base (es. arancione, prigionia), incluse quelle accentate che la
// normalizzazione NFD rende a-z (es. città → citta).
const FREQUENCY_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt'
// Quante parole più frequenti includere nel pool. Più alto = più parole ma
// meno comuni. Poiché ogni parola del pool può essere soluzione, si resta
// su una soglia moderata.
const FREQUENCY_TOP_N = 10000

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

// Legge un file lista (include.txt / exclude.txt): una parola per riga,
// ignorando righe vuote e commenti (#). Restituisce le parole normalizzate.
function readWordList(file) {
  let text
  try {
    text = readFileSync(new URL(`./${file}`, import.meta.url), 'utf8')
  } catch {
    return []
  }
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map(normalize)
}

async function fetchWords(file) {
  const res = await fetch(`${BASE}/${file}`)
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`)
  const text = await res.text()
  return text.split('\n').map(normalize).filter(isUsable)
}

// Scarica le prime `topN` parole della lista di frequenza, normalizzate e
// filtrate, preservando l'ordine di frequenza (le più usate prima).
async function fetchFrequent(topN) {
  const res = await fetch(FREQUENCY_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const words = text
    .split('\n')
    .slice(0, topN)
    .map((line) => normalize(line.split(/\s+/)[0] ?? ''))
    .filter(isUsable)
  return [...new Set(words)]
}

const common = await fetchWords('1000_parole_italiane_comuni.txt')

// Parole frequenti promosse a soluzione. Best effort: se il download fallisce
// si continua con le sole liste di base (il pool sarà più piccolo).
let frequent = []
try {
  frequent = await fetchFrequent(FREQUENCY_TOP_N)
  console.log(`frequenti caricate (top ${FREQUENCY_TOP_N}): ${frequent.length}`)
} catch (err) {
  console.warn(`Frequenti saltate: ${err.message}. Pool ridotto alle liste di base.`)
}

// include.txt: parole da forzare nel pool. Scarta (segnalando) quelle non
// valide (troppo corte o con caratteri non a-z dopo la normalizzazione).
const include = []
for (const word of readWordList(INCLUDE_FILE)) {
  if (isUsable(word)) {
    include.push(word)
  } else {
    console.warn(`${INCLUDE_FILE}: scartata "${word}" (serve >= ${MIN_LENGTH} lettere, solo a-z)`)
  }
}

// exclude.txt: parole da rimuovere da tutto. Niente filtro di lunghezza —
// anche una parola "non valida" va comunque tolta se presente nelle fonti.
const exclude = new Set(readWordList(EXCLUDE_FILE))

// Una sola lista: ogni parola accettata come tentativo può anche essere la
// soluzione. validWords è identica a targetWords. exclude.txt vince su tutto.
const keep = (word) => !exclude.has(word)
const targets = [...new Set([...common, ...frequent, ...include])].filter(keep).sort()
const valid = targets

const out = `// Generato da scripts/build-words.mjs — non modificare a mano.
export const targetWords: string[] = ${JSON.stringify(targets)}

export const validWords: string[] = ${JSON.stringify(valid)}
`
writeFileSync(new URL('../src/data/words.ts', import.meta.url), out)
console.log(`targetWords: ${targets.length}, validWords: ${valid.length}`)

// Report informativo: distribuzione delle soluzioni per lunghezza, così è
// chiaro quante parole sono disponibili per ogni modalità di gioco (4-14
// lettere). Non modifica le liste.
const byLength = {}
for (const w of targets) {
  byLength[w.length] = (byLength[w.length] ?? 0) + 1
}
console.log('\nSoluzioni (targetWords) per lunghezza:')
for (const len of Object.keys(byLength).sort((a, b) => a - b)) {
  console.log(`  ${len} lettere: ${byLength[len]}`)
}
