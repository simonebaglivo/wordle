# Processo di pulizia del dizionario

Guida operativa per ripulire il pool di parole da termini che non dovrebbero
esserci (nomi propri, inglese puro, refusi da sottotitoli). Pensata per essere
ripetuta ogni volta che si rigenera o si allarga il pool.

> Contesto delle due liste e delle fonti: vedi [DIZIONARIO.md](../DIZIONARIO.md).

## Perché serve

Il pool attinge dalla lista di frequenza **OpenSubtitles** (`it_50k.txt`): è
ordinata per uso reale, quindi ottima per trovare parole comuni, ma essendo
fatta di **dialoghi di film/serie** contiene molto rumore:

- **Nomi propri** — persone (`andrea`, `alex`), città/nazioni (`berlino`,
  `francia`), incluso nomi lunghi che sfuggono (`alexander`, `christopher`).
- **Inglese** — sia puro (`that`, `with`, `world`) sia anglicismi (`film`,
  `sport`): questi ultimi **si tengono**.
- **Refusi/artefatti** dei file `.srt` — sigle dei gruppi di sottotitolaggio
  (`subsfactory`, `subspedia`), marcatori di sync (`resynch`, `synch`).

Più si alza `FREQUENCY_TOP_N`, più rumore entra (si scende nella coda di
frequenza). Quindi **ogni volta che si alza la soglia, va rifatta la pulizia**
sulle parole nuove entrate.

## Politica decisa (cosa togliere e cosa tenere)

| Categoria | Azione |
|---|---|
| Nomi propri (persone, città, nazioni) | **Escludi** — anche quelli italiani |
| Parole che sono ANCHE un nome ma hanno senso comune | **Tieni** — es. `gloria`, `serena`, `vittoria`, `rosa`, `viola`, `stella`, `regina`, `pietra`, `luce`, `vita`, `irene`, `perla`, `fine`, `date`, `star` |
| Marchi | **Tieni** — es. `batman`, `ford`, `google`, `ncis` |
| Anglicismi ormai italiani | **Tieni** — es. `film`, `sport`, `hotel`, `okay`, `email`, `weekend`, `club`, `baby` |
| Inglese puro | **Escludi** — es. `that`, `with`, `your`, `world`, `look`, `time`, `girl`, `love` |
| Refusi / sigle sottotitoli | **Escludi** — es. `resynch`, `synch`, `subsfactory`, `subspedia`, `iscrew` |

La regola d'oro per i nomi: **togli i nomi propri, ma tieni le parole che
significano qualcosa in italiano anche quando coincidono con un nome.** Questo
richiede una revisione a mano: il match automatico NON è affidabile da solo.

## Metodo (3 setacci)

Tutti i comandi sono `node --input-type=module -e '...'` lanciati dalla root
del repo, dopo aver rigenerato `src/data/words.ts`.

### 1. Nomi propri — match automatico + revisione

Incrocia i target con una lista di nomi propri (copre soprattutto nomi US brevi,
molto presenti nei sottotitoli):

```js
import { readFileSync } from "node:fs";
const t = readFileSync("src/data/words.ts","utf8");
const ts = new Set(JSON.parse(t.match(/targetWords: string\[\] = (\[.*?\])\n/s)[1]));
const norm = w => w.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const r = await fetch("https://raw.githubusercontent.com/dominictarr/random-name/master/first-names.txt");
const names = new Set((await r.text()).split("\n").map(norm).filter(Boolean));
console.log([...ts].filter(w => names.has(w)).sort().join(", "));
```

**Poi revisiona a mano** l'output: scarta dalla lista-da-escludere le parole
con senso comune (vedi tabella sopra) prima di scriverle in `exclude.txt`.

⚠️ Limiti del match automatico: NON copre nomi lunghi (`alexander`,
`christopher`) né città/nazioni (`berlino`, `francia`). Per quelli serve una
lista curata a mano — controlla candidati noti con uno script ad-hoc che fa
`ts.has(w)` su un elenco di nomi/città/nazioni sospetti.

### 2. Inglese — lista curata + scelta keep/exclude

Non c'è una fonte pulita: si parte da un elenco a mano di parole inglesi
plausibili nei sottotitoli, si filtra con `ts.has(w)`, e si divide tra
**anglicismi da tenere** e **inglese puro da escludere** (vedi tabella).

### 3. Refusi — a vista

Sono pochi e riconoscibili (sigle di gruppi sub, marcatori di sync). Si trovano
scorrendo le parole "non presenti nel dizionario di riferimento" (il vecchio
metodo: confronto coi 60k di napolux dà molti falsi positivi ma fa emergere i
refusi veri).

## Dove finiscono le decisioni

- Parole da togliere → [`scripts/exclude.txt`](../scripts/exclude.txt),
  nelle sezioni commentate (`# --- Nomi propri`, `# --- Inglese puro`,
  `# --- Refusi`).
- Parole comuni che mancano e vanno aggiunte → [`scripts/include.txt`](../scripts/include.txt).

Poi sempre: `node scripts/build-words.mjs && npm test`.

> ⚠️ La pulizia è **best-effort, non esaustiva**: possono restare nomi propri
> lunghi o stranieri sfuggiti ai setacci. Quando se ne nota uno giocando, si
> aggiunge a `exclude.txt` e si rigenera. È un processo incrementale.
