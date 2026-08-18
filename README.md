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

### `attenzione/` — "Chi guarda chi"

Dal pezzo "Dai vettori alle relazioni: l'attenzione". Si scrive una frase, si
clicca una parola - quella fa la domanda - e si vedono i pesi di attenzione
verso le altre parole: punteggi, softmax e somma pesata dei valori. Per la
frase di casa dell'articolo i numeri sono quelli del pezzo; per le altre frasi
sono una simulazione dichiarata (il conto è vero, i numeri no).

- `widget.js` — il widget (si aggancia agli elementi `at-*` della pagina)

### `embedding/` — lo spazio dei significati

Dal pezzo "Dai token ai vettori: l'embedding". Un corpus minimo italiano e
l'addestramento che dispone le parole davanti al lettore: vicino chi si usa in
contesti simili, lontano chi non si incontra mai. Si clicca una parola per i
vicini, e tre parole per comporre l'analogia `a − b + c`: il punto cade dove
la geometria della mappa dice. Mappa illustrativa, non misurata - come il
pezzo dichiara delle analogie.

- `widget.js` — il widget (si aggancia agli elementi `eb-*` della pagina)

### `transformer/` — "Smonta il modello"

Dal pezzo "Il transformer aperto col cacciavite". Il piccolo GPT della serie
(4 blocchi, 4 teste, 128 dimensioni, 83 caratteri, quantizzato int8) genera
testo con un seme fisso, e il lettore toglie pezzi - connessione residua,
attenzione, MLP, blocchi - per vedere come la generazione si rompe. Stessi
pesi e stesso seme: cambia solo quello che si smonta.

- `widget.js` — il widget (si aggancia agli elementi `sm-*` della pagina)

Nota: `widget.js` carica il modello da `/applicazioni/piccolo-gpt/`
(manifest e pesi, in questo repository nella cartella `piccolo-gpt/`).

### `moe/` — il router e la memoria

Dal pezzo "Le evoluzioni MoE e la cache di chiavi e valori". Due pannelli: il
router instrada ogni token della frase del lettore a due esperti su sei (regole
dichiarate, non il router vero: è la meccanica personificata); la cache mostra
la generazione passo passo, e la differenza fra ricalcolare tutto e ricordare.

- `widget.js` — il widget (si aggancia agli elementi `mc-*` della pagina)

### `architetture/` — "Costruisci la scheda"

Dal pezzo "Le architetture a confronto". Si monta un modello: forma, natura
densa o mista, taglie, attenzione, finestra - e il widget fa il conto che la
serie insegna: memoria dei pesi, moltiplicazioni per token, cache. I preset
sono i modelli del pezzo coi numeri dichiarati nei rapporti (GPT-3, GPT-2,
DeepSeek-V3, Qwen3-235B); si può spegnere la documentazione e guardare che
cosa resta leggibile.

- `widget.js` — il widget (si aggancia agli elementi `sc-*` della pagina)

### `origini/` — la macchina-bambina

Dal pezzo "Le origini del machine learning". La scena di Turing del 1950 presa
alla lettera: una macchina-bambina sceglie fra due azioni, il lettore giudica
ogni scelta con una ricompensa o una punizione, e le probabilità si regolano
da sole. Se il lettore è coerente, la macchina impara la sua regola.

- `widget.js` — il widget (si aggancia agli elementi `mb-*` della pagina)

### `addestramento/` — le quattro fasi

Dall'ultimo pezzo della serie, "L'addestramento che fa la differenza". Lo
stesso prompt passato di fase in fase: preaddestrato (continua il testo),
istruito (risponde), rifinito dalle preferenze (il gusto umano), rinforzato su
ricompense verificabili (ragiona prima di rispondere). Le risposte sono una
simulazione dichiarata; la differenza di carattere è quella del pezzo.

- `widget.js` — il widget (si aggancia agli elementi `ff-*` della pagina)

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
`pct-*`, `rm-*`, `em-*`, `at-*`, `eb-*`, `sm-*`, `mc-*`, `sc-*`, `mb-*`,
`ff-*`, `mot-*` secondo il widget). Serve la tabella dei colori del tema del
blog (`--color-*`, `--space-*`, `--font-mono`, `--hairline`), ma ogni widget
dichiara i propri stili in un `<style>` inline.

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
