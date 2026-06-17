# Wordle Italiano — Design

**Data:** 2026-06-12
**Stato:** approvato dall'utente (in attesa di revisione finale del documento)

## Obiettivo

Clone di Wordle in italiano, single-player, con parole di lunghezza variabile estratte da un dizionario curato di parole comuni. Web app statica, nessun backend, statistiche persistenti in locale.

## Stack tecnologico

- **React 18 + Vite + TypeScript**
- **CSS Modules** per gli stili (nessuna libreria UI esterna)
- Nessun backend: deploy statico (Vercel/Netlify o equivalente)

## Dizionario

Fonte: lista `parole_comuni` (~6.000 parole) del repository [napolux/paroleitaliane](https://github.com/napolux/paroleitaliane), scaricata una volta e inclusa nel bundle come modulo TypeScript (`src/data/words.ts`). Niente API esterne a runtime.

Due insiemi:

- **`targetWords`** — parole comuni che possono essere estratte come soluzione. Curate per evitare parole sconosciute.
- **`validWords`** — sovrainsieme di `targetWords`: tutte le parole accettate come tentativo.

Le parole sono normalizzate: minuscole, senza accenti (es. `perché` → `perche`), solo lettere a–z. Lunghezza variabile, con un minimo di **4 lettere** (parole più corte renderebbero il gioco troppo semplice); nessun massimo.

## Logica di gioco

### Selezione della parola

- **Parola del giorno:** deterministica dalla data corrente: `index = giorniDaEpoca % targetWords.length` (calcolato in ora locale). Stessa parola per tutti i dispositivi e tutte le schede, senza server. Cambia automaticamente a mezzanotte.
- **Nuova parola:** pulsante nel modale di fine partita che estrae una parola casuale (diversa da quella corrente) per partite extra illimitate.

### Regole

- **6 tentativi**, indipendentemente dalla lunghezza della parola.
- La griglia ha tante colonne quante le lettere della parola target; si adatta dinamicamente.
- Ogni tentativo deve essere una parola di `validWords` della lunghezza giusta; altrimenti la riga fa un'animazione *shake* e appare il messaggio "Parola non trovata" (toast temporaneo).
- **Feedback per lettera:**
  - Verde — lettera corretta in posizione corretta
  - Giallo — lettera presente ma in posizione sbagliata
  - Grigio — lettera assente
- **Duplicati:** regola Wordle standard. Prima si assegnano i verdi, poi i gialli da sinistra a destra finché ci sono occorrenze residue della lettera nella parola target; le occorrenze in eccesso restano grigie.

### Fine partita

- **Vittoria:** tentativo identico alla parola target.
- **Sconfitta:** 6 tentativi falliti; la parola viene rivelata.
- In entrambi i casi il modale statistiche si apre automaticamente dopo 1.5 secondi.

## Input

- **Tastiera fisica:** lettere a–z, Invio per confermare, Backspace per cancellare.
- **Tastiera virtuale:** layout QWERTY a 3 righe con tasti Invio e Backspace, cliccabile. I tasti si colorano in base allo stato migliore noto della lettera (verde > giallo > grigio), fungendo da riepilogo delle lettere usate.

## Statistiche (`localStorage`)

- Partite giocate, vittorie, percentuale di vittorie
- Streak corrente e streak massima
- Distribuzione dei tentativi (istogramma 1–6)
- Le partite "nuova parola" contano nelle statistiche come quelle del giorno.
- Chiave di storage versionata (es. `wordle-it-stats-v1`) per future migrazioni.

## Struttura del progetto

```
src/
  data/
    words.ts          ← targetWords + validWords (generato dalla lista parole_comuni)
  hooks/
    useGame.ts        ← stato di gioco: parola target, tentativi, valutazione lettere, fine partita
    useStats.ts       ← lettura/scrittura statistiche su localStorage
  components/
    Board.tsx         ← griglia 6 × N
    Row.tsx           ← riga singola
    Tile.tsx          ← cella singola con animazione flip
    Keyboard.tsx      ← tastiera virtuale QWERTY colorata
    StatsModal.tsx    ← modale statistiche + pulsante "Nuova parola"
    Header.tsx        ← titolo + pulsante statistiche
  App.tsx
```

**Flusso dati:** `useGame` è la fonte di verità per lo stato della partita; i componenti sono presentazionali e ricevono stato e callback via props. `useStats` è indipendente e viene aggiornato da `App` alla fine di ogni partita.

## Animazioni

- **Flip** sequenziale delle celle alla conferma di un tentativo (rivela i colori una lettera alla volta).
- **Shake** della riga per tentativo non valido.
- Transizione di colore sui tasti della tastiera virtuale.

## Gestione errori

- Tentativo troppo corto → toast "Lettere insufficienti" + shake.
- Tentativo non nel dizionario → toast "Parola non trovata" + shake.
- `localStorage` non disponibile o corrotto → il gioco funziona comunque, le statistiche ripartono da zero.

## Test

- **Unit test (Vitest):** valutazione dei tentativi (inclusi i casi con lettere duplicate), selezione deterministica della parola del giorno, calcolo delle statistiche e degli streak, validazione dei tentativi.
- **Component test (Testing Library):** flusso di una partita completa (input → flip → vittoria/sconfitta → modale), input da tastiera fisica e virtuale.

## Fuori scope

- Account utente, multiplayer, leaderboard, condivisione risultati
- Modalità "parola difficile" (hard mode)
- PWA / offline esplicito (il bundle statico funziona comunque offline una volta cachato)
