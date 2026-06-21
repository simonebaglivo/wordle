// Genera src/data/words.ts: una sola lista di parole italiane comuni (le ~60.000
// di napolux, ristrette alle più frequenti e senza frammenti tronchi, + i
// override di include.txt, meno exclude.txt).
// targetWords e validWords sono identiche: ogni parola accettata può uscire.
// Filtri sul dizionario di base: finale in vocale (scarta i tronchi) e presenza
// nella top-N di frequenza d'uso (scarta le forme rare/desuete). include.txt
// aggira entrambi i filtri; exclude.txt rimuove da tutto.
// Eseguire con: node scripts/build-words.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const BASE =
  'https://raw.githubusercontent.com/napolux/paroleitaliane/master/paroleitaliane'
const MIN_LENGTH = 4
// Lunghezza massima accettata. Oltre le 14 lettere le parole sono pochissime
// (nomi composti, avverbi lunghi) e poco adatte alla board, quindi si tagliano.
const MAX_LENGTH = 14

// Dizionario di base: le ~60.000 parole italiane di napolux. Ampio per scelta,
// così non manca quasi mai una parola legittima. La pulizia avviene per
// sottrazione tramite exclude.txt.
const DICTIONARY_FILE = '60000_parole_italiane.txt'

// Soglia di frequenza d'uso. Il dizionario napolux contiene molte forme rare o
// desuete (coniugazioni come "rapii", "osavi", "sedai") che come soluzione del
// giorno sono ingiocabili e anche come tentativo hanno poco senso. Si tengono
// solo le parole presenti tra le prime FREQUENCY_TOP_N della lista di frequenza
// d'uso reale (OpenSubtitles). include.txt BYPASSA questa soglia (override).
const FREQUENCY_URL =
  'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt'
const FREQUENCY_TOP_N = 20000

// Due punti di ingresso editabili a mano (una parola per riga):
//   include.txt — parole sempre presenti tra soluzioni e tentativi validi,
//                 anche se assenti dal dizionario di base.
//   exclude.txt — parole sempre rimosse da tutto: vince sul dizionario e su
//                 include.txt. Per nomi propri, refusi, parole non adatte.
// Dopo aver modificato uno dei due file, rilancia: node scripts/build-words.mjs
const INCLUDE_FILE = 'include.txt'
const EXCLUDE_FILE = 'exclude.txt'

// Il dizionario napolux contiene ~1.600 frammenti tronchi che finiscono in
// consonante: infiniti poetici (aver, andar), radici verbali (oper, popol,
// telefoner) e nomi astratti mozzati (realt → realtà). In italiano una parola
// che finisce in consonante è quasi sempre un troncamento o un prestito.
// Regola: si scartano TUTTE le parole del dizionario che finiscono in
// consonante, tranne la whitelist di prestiti reali qui sotto. La regola NON
// si applica a include.txt (override manuale esplicito).
const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])
const CONSONANT_LOANWORDS = new Set([
  'alcol', 'alcool', 'autobus', 'bazar', 'biberon', 'camion', 'caos',
  'computer', 'gratis', 'lapis', 'nord', 'rebus', 'record', 'referendum',
  'ribes', 'standard', 'tram', 'tunnel', 'valzer', 'wurstel',
])

// Una parola del dizionario di base è accettabile se finisce in vocale oppure
// è un prestito noto. I troncamenti (finale consonantico, non in whitelist)
// vengono scartati.
function endsWell(word) {
  return VOWELS.has(word[word.length - 1]) || CONSONANT_LOANWORDS.has(word)
}

function normalize(word) {
  return word
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

function isUsable(word) {
  return /^[a-z]+$/.test(word) && word.length >= MIN_LENGTH && word.length <= MAX_LENGTH
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

// Scarica le prime `topN` parole della lista di frequenza, normalizzate, come
// insieme: l'appartenenza decide quali parole del dizionario tenere. Le voci
// della lista non sono filtrate per lunghezza (servono solo per il confronto).
async function fetchFrequentSet(topN) {
  const res = await fetch(FREQUENCY_URL)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  const words = text
    .split('\n')
    .slice(0, topN)
    .map((line) => normalize(line.split(/\s+/)[0] ?? ''))
    .filter(Boolean)
  return new Set(words)
}

const dictionaryRaw = await fetchWords(DICTIONARY_FILE)
const frequent = await fetchFrequentSet(FREQUENCY_TOP_N)
// Scarta i frammenti tronchi (finale consonantico non in whitelist) e le forme
// troppo rare (fuori dalla top-N di frequenza). include.txt aggira entrambi.
const dictionary = dictionaryRaw.filter((w) => endsWell(w) && frequent.has(w))
console.log(
  `dizionario di base (${DICTIONARY_FILE}): ${dictionaryRaw.length}, ` +
    `dopo scarto tronchi + soglia top ${FREQUENCY_TOP_N}: ${dictionary.length} ` +
    `(rimossi ${dictionaryRaw.length - dictionary.length})`,
)

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
const targets = [...new Set([...dictionary, ...include])].filter(keep).sort()
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
