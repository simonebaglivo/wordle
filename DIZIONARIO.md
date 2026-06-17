# Dizionario delle parole

Come è costruito il dizionario del gioco e come si modifica.

## Una lista sola

Il gioco usa **un unico insieme di parole** (~8.900), generato in
`src/data/words.ts`. Le due esportazioni `targetWords` e `validWords` sono
**identiche** per scelta di design:

- **`targetWords`** — le soluzioni possibili (la "parola del giorno" e le
  partite casuali).
- **`validWords`** — i tentativi accettati quando scrivi.

Sono uguali perché vogliamo che **ogni parola accettata possa anche essere la
soluzione**: niente parole che il gioco accetta ma non propone mai. Il pool è
quindi ristretto alle parole **comuni** (niente termini oscuri tipo `abbaino`).

## Fonti

`src/data/words.ts` è **generato** da [`scripts/build-words.mjs`](scripts/build-words.mjs)
— non va modificato a mano. Lo script combina:

1. **1000 parole comuni** (`napolux/paroleitaliane`).
2. **Le ~10.000 parole italiane più frequenti** (lista OpenSubtitles, ordinata
   per uso reale). Coprono termini comuni come `arancione`, `prigionia`, incluse
   quelle accentate (`città` → `citta`, normalizzazione automatica).
3. **`include.txt`** — parole forzate (vedi sotto).

Poi rimuove tutto ciò che è in **`exclude.txt`**.

La dimensione del pool si regola con `FREQUENCY_TOP_N` (attualmente `10000`) in
cima allo script. Più alto = più parole ma meno comuni (e più rumore da
ripulire). La lista 60.000 di napolux **non** è più usata.

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
