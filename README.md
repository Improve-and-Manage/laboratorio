# Serie Machine Learning — i widget

I widget interattivi della serie di articoli di Improve and Manage dedicata al
machine learning, dalle origini ai modelli di linguaggio. Ogni cartella
corrisponde a un pezzo della serie: JavaScript puro, zero dipendenze, nessun
dato esce dal browser. Il blog serve copie di questi file da `public/`;
questo repository è la fonte canonica.

## I pezzi della serie

La serie accompagna il lettore dai pionieri (Turing, Rosenblatt) fino alle
architetture moderne (transformer, MoE) e ai motori che le eseguono. I widget
sono gli esperimenti che il lettore può toccare lungo il percorso.

## I widget

### `percettrone/` — il percettrone che legge le cifre

Dal pezzo "Il percettrone: origine, funzionamento e limiti". Si disegna una
cifra col mouse o col dito e i dieci percettroni dell'articolo votano con la
loro somma pesata; vince il voto più alto.

- `widget.js` — il widget (si aggancia agli elementi `pct-*` della pagina)
- `pesi.json` — i pesi addestrati dal programma del repository
  [Improve-and-Manage/percettrone](https://github.com/Improve-and-Manage/percettrone)

Nota: `widget.js` carica i pesi da `/percettrone/pesi.json` (percorso assoluto,
come nel blog). Per provarlo in locale, servire la cartella del sito che
contiene anche `pesi.json`.

### `rete-multistrato/` — la rete 2-2-1 che impara XOR

Dal pezzo "Reti neurali multilivello". La rete parte da pesi casuali e impara
XOR con la retropropagazione davanti al lettore: si sceglie la funzione di
attivazione dello strato nascosto (sigmoide, tanh, ReLU) e il tasso di
apprendimento; la superficie di decisione si piega a ogni giro.

- `widget.js` — il widget (si aggancia agli elementi `rm-*` della pagina)

Il programma Python corrispondente sta nel repository
[Improve-and-Manage/rete-multistrato](https://github.com/Improve-and-Manage/rete-multistrato).

### `segmentatrice/` — la segmentatrice del tokenizzatore

Dal pezzo "Dal testo ai token: il tokenizzatore". Tre passi: un corpus fisso,
una tabella di fusioni imparata dal corpus, e la frase del lettore che viene
soltanto codificata con quella tabella. Tre regole: BPE a caratteri, BPE sui
byte (come GPT-2) e WordPiece.

- `widget.js` — il widget (si aggancia agli elementi `em-*` della pagina)

### `motori/` — "Quale motore per te"

Dal pezzo "I motori che eseguono i pesi". I motori di esecuzione (llama.cpp,
MLX, DwarfStar, vLLM, SGLang, TensorRT-LLM, TGI, Ollama, ExLlama, CTranslate2)
a confronto: si sceglie l'hardware e si danno i pesi alle quattro funzionalità
(facilità, velocità, memoria, serving); il widget segnala il motore migliore
per chi legge. I punteggi (1–5) sono il giudizio della serie, fondato sulle
capacità documentate nel pezzo; i pesi appartengono al lettore.

- `widget.js` — il widget (si aggancia agli elementi `mot-*` della pagina)

### `piccolo-gpt/` — il piccolo GPT che ha letto Dante

Dall'app "Il piccolo GPT che ha letto Dante" (un piccolo transformer, 4 strati,
4 teste, 128 dimensioni, 83 caratteri di vocabolario, quantizzato int8, circa
815.000 parametri), addestrato sui versi della Commedia e messo a scrivere nel
browser.

- `manifest.json` — la configurazione del modello e l'indice dei tensori
- `pesi.bin` — i pesi quantizzati (il modello completo)

Il gioco vive nella pagina dell'app del blog; questo repository conserva i dati
del modello nella loro forma canonica.

## Come si usano

Ogni widget è pensato per essere incorporato in una pagina: il file `widget.js`
si carica con `<script defer>` e cerca i propri elementi nel DOM (gli id
`pct-*`, `rm-*`, `em-*`, `mot-*` secondo il widget). Serve la tabella dei
colori del tema del blog (`--color-*`, `--space-*`, `--font-mono`,
`--hairline`), ma ogni widget dichiara i propri stili in un `<style>` inline.

Nessun widget fa chiamate di rete oltre al caricamento dei propri dati (i pesi
del percettrone, il modello del piccolo GPT): i calcoli avvengono tutti in
locale, nel browser.

## Relazione con gli altri repository

- [Improve-and-Manage/percettrone](https://github.com/Improve-and-Manage/percettrone)
  — i programmi Python dell'articolo sul percettrone (regola di apprendimento,
  caso svolto, addestramento su MNIST)
- [Improve-and-Manage/rete-multistrato](https://github.com/Improve-and-Manage/rete-multistrato)
  — i programmi Python dell'articolo sulle reti multistrato (XOR risolto a
  mano, rete 784-64-10 su MNIST)

Questo repository raccoglie i widget del browser di tutta la serie; i
programmi Python restano nei repository dedicati ai rispettivi argomenti.

## Licenza

MIT — vedi `LICENSE`.
