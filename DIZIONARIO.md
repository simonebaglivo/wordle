# Dizionario delle parole

Come è costruito il dizionario del gioco e come si modifica.

## Una lista sola

Il gioco usa **un unico insieme di parole** (~10.500), generato in
`src/data/words.ts`. Le due esportazioni `targetWords` e `validWords` sono
**identiche** per scelta di design:

- **`targetWords`** — le soluzioni possibili (la "parola del giorno" e le
  partite casuali).
- **`validWords`** — i tentativi accettati quando scrivi.

Sono uguali perché vogliamo che **ogni parola accettata possa anche essere la
soluzione**: niente parole che il gioco accetta ma non propone mai.

## Approccio: blacklist, non whitelist

Il dizionario parte **ampio** (le ~60.000 parole italiane) e si **toglie** ciò
che non va bene, invece di partire ristretti e dover aggiungere a mano ogni
parola mancante. Il lavoro residuo è solo **escludere** man mano le parole non
adatte che saltano fuori (via `exclude.txt`).

Sul dizionario di base si applicano poi due **filtri di qualità** automatici
(vedi sotto): si scartano i frammenti tronchi e le forme troppo rare. Il
risultato è un pool di parole **comuni e giocabili** (~10.500): ogni soluzione
del giorno è una parola riconoscibile, non una coniugazione desueta come
`rapii`. Le parole che questi filtri tagliano per errore si recuperano con
`include.txt`, che li **aggira**.

## Fonti

`src/data/words.ts` è **generato** da [`scripts/build-words.mjs`](scripts/build-words.mjs)
— non va modificato a mano. Lo script combina:

1. **Le ~60.000 parole italiane** di `napolux/paroleitaliane` (dizionario di
   base, ampio). Accenti normalizzati automaticamente (`città` → `citta`).
2. **`include.txt`** — parole forzate, per eventuali mancanze del dizionario
   (vedi sotto).

Poi rimuove tutto ciò che è in **`exclude.txt`**.

Sono accettate solo parole da **4 a 14 lettere** (`MIN_LENGTH`/`MAX_LENGTH` in
cima allo script): oltre le 14 le parole sono pochissime e poco adatte alla
board.

## Scarto dei frammenti tronchi (finale in consonante)

Il dizionario napolux contiene ~1.600 **frammenti** che finiscono in consonante:
infiniti poetici (`aver`, `andar`), radici verbali (`oper`, `popol`,
`telefoner`) e nomi astratti mozzati (`realt` → realtà). Non sono parole
giocabili. Poiché in italiano una parola che finisce in consonante è quasi
sempre un troncamento o un prestito, lo script **scarta dal dizionario di base
tutte le parole con finale consonantico**, tranne una whitelist di prestiti
reali (`CONSONANT_LOANWORDS`: `alcol`, `computer`, `autobus`, `tunnel`,
`record`…). La regola **non** si applica a `include.txt`: lì puoi forzare a mano
anche una parola in consonante. Se un prestito legittimo viene scartato, basta
aggiungerlo a `CONSONANT_LOANWORDS` (o a `include.txt`).

## Soglia di frequenza (scarto delle forme rare)

Anche tolti i tronchi, il dizionario napolux contiene molte forme **rare o
desuete** — soprattutto coniugazioni come `rapii`, `osavi`, `sedai` — che come
soluzione del giorno sarebbero ingiocabili. Lo script tiene quindi solo le
parole presenti tra le prime **`FREQUENCY_TOP_N`** (attualmente `20000`) della
lista di frequenza d'uso reale (OpenSubtitles, `hermitdave/FrequencyWords`).

Più bassa la soglia = pool più piccolo e comune; più alta = più parole ma più
rumore. A `20000` il pool finale è ~10.500 parole, tutte riconoscibili. Anche
questo filtro **non** si applica a `include.txt`: una parola lì è sempre tenuta,
anche se sotto soglia. Se una parola comune venisse esclusa per errore (perché
poco frequente nei sottotitoli), aggiungila a `include.txt`.

## Includere ed escludere parole a mano

Due file di testo, una parola per riga (righe vuote e righe con `#` ignorate;
accenti normalizzati automaticamente):

- **[`scripts/include.txt`](scripts/include.txt)** — parole sempre presenti,
  anche se assenti dalle liste sorgente (es. `arancione`, `pera`).
- **[`scripts/exclude.txt`](scripts/exclude.txt)** — parole sempre rimosse.
  **Vince su tutto**. Contiene nomi propri, refusi da sottotitoli e inglese
  puro. **Tenuti di proposito** (non vanno qui): marchi (`batman`, `google`),
  anglicismi ormai comuni (`film`, `sport`, `hotel`, `okay`) e le parole che
  coincidono con un nome ma hanno senso comune (`gloria`, `serena`, `vittoria`,
  `rosa`, `viola`, `stella`…).

## Workflow

Dopo aver modificato `include.txt`, `exclude.txt` o lo script:

```sh
node scripts/build-words.mjs   # rigenera src/data/words.ts
npm test                       # verifica che non si sia rotto nulla
```

Per il processo di pulizia dei termini strani (nomi, inglese, refusi) vedi
[docs/PULIZIA-DIZIONARIO.md](docs/PULIZIA-DIZIONARIO.md).
