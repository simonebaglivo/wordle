# Parole extra robuste + report parole comuni mancanti

Data: 2026-06-15

## Obiettivo

Migliorare `scripts/build-words.mjs` in due modi:

1. **Parole extra sempre incluse** — un array `EXTRA_WORDS` curato a mano (es. `guanto`,
   `retina`) viene sempre unito sia a `targetWords` (soluzioni del giorno) sia a
   `validWords` (tentativi accettati). Sopravvive a ogni rigenerazione dello script,
   risolvendo il problema per cui aggiunte manuali a `src/data/words.ts` venivano perse.

2. **Report "comuni assenti da target"** — lo script scarica una lista di frequenza
   italiana, ne prende le top N, e stampa quali parole comuni NON sono presenti in
   `targetWords`. È un report informativo a console: non modifica le liste. L'utente
   legge l'output e decide cosa promuovere aggiungendolo a `EXTRA_WORDS`.

## Flusso dello script

```
fetch common (1000_parole_italiane_comuni) + all (60000_parole_italiane)
  → normalize + filtro (lunghezza >= 4, solo [a-z])
EXTRA_WORDS
  → stessa normalize + stesso filtro (scarta e segnala parole non valide)
targets = unione(common, EXTRA_WORDS) ordinata, dedup
valid   = unione(all, targets) ordinata, dedup
scrivi src/data/words.ts
─── report (best effort) ───
fetch frequency top N
  → normalize + filtro
mancanti = freq − targets
stampa conteggio totale + prime 100 mancanti
```

## Dettagli

- **`EXTRA_WORDS`**: array in cima allo script, commentato. Contenuto iniziale:
  `guanto`, `retina`. Passa per la stessa `normalize` e gli stessi vincoli (lunghezza
  >= 4, niente accenti via NFD, solo `[a-z]`). Parole non valide vengono scartate con
  un warning a console.

- **Fonte frequenza**:
  `https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt`
  Formato `parola conteggio` per riga, già ordinato per frequenza decrescente
  (OpenSubtitles). Si prendono le **top 5000** parole.

- **Report**: le parole di frequenza passano per la stessa `normalize` + regex
  `^[a-z]+$` + `length >= 4`, così sono confrontabili con le liste interne. Stampa
  quante parole comuni mancano da `targetWords` e le **prime 100** (per non intasare il
  terminale).

- **Niente rete al build dell'app**: lo script resta uno strumento manuale
  (`node scripts/build-words.mjs`). Il report gira nella stessa esecuzione.

- **Resilienza del report**: `words.ts` viene scritto PRIMA del report. Se il fetch
  della lista di frequenza fallisce, lo script stampa solo un warning sul report e
  termina con successo (le liste sono già state generate correttamente).

## Fuori scope (YAGNI)

- Promozione automatica delle parole comuni in `targetWords` (resta decisione manuale
  via `EXTRA_WORDS`).
- File di config separato per le parole extra.
- Modifiche al runtime del gioco.

## Note di stato

Il file `src/data/words.ts` è stato già modificato a mano in precedenza aggiungendo
`retina`. Rigenerarlo con il nuovo script produce lo stesso risultato in modo
riproducibile: `retina` e `guanto` arrivano da `EXTRA_WORDS`.
