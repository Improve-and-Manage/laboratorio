# I widget della serie sul machine learning

Questa cartella raccoglie i widget interattivi della serie di articoli di Improve and Manage sul
machine learning, dalle origini ai modelli di linguaggio. Un widget è un piccolo programma che
gira nella pagina dell'articolo e lascia provare con le mani il meccanismo descritto nel testo.
Sono scritti in JavaScript puro, senza librerie, e fanno tutti i calcoli nel browser: nessun dato
di chi legge esce dalla pagina.

I file sono le stesse copie che il sito pubblica oggi: ognuno è stato confrontato byte per byte
con la versione in linea.

## I widget, articolo per articolo

- `origini/widget.js`: la macchina-bambina di Turing sceglie fra due azioni e chi legge la premia o
  la punisce, finché impara la sua regola. Articolo:
  [Le origini del machine learning](https://www.improveandmanage.com/le-origini-del-machine-learning-dalle-visioni-dei-pionieri-alle-applicazioni-moderne/).
- `percettrone/widget.js` con `percettrone/pesi.json`: si disegna una cifra e dieci percettroni la
  votano con la loro somma pesata. Articolo:
  [Il percettrone](https://www.improveandmanage.com/il-percettrone-origine-funzionamento-e-limiti/).
- `rete-multistrato/widget.js`: una rete con due ingressi, due neuroni nascosti e un'uscita impara
  la funzione XOR davanti a chi legge, che sceglie la funzione di attivazione e il tasso di
  apprendimento. Articolo: [Le reti multistrato](https://www.improveandmanage.com/reti-neurali-multilivello/).
- `segmentatrice/duello.js`: il duello dei vocabolari, cioè la stessa frase tagliata in token da un
  tokenizzatore addestrato sui Promessi sposi e da quello dei modelli recenti di OpenAI. Articolo:
  [Dal testo ai token](https://www.improveandmanage.com/dal-testo-ai-token-il-tokenizzatore/).
- `embedding/widget.js`: un piccolo corpus italiano dispone le parole su una mappa, dove si cercano
  i vicini di una parola e si compongono analogie. Articolo:
  [Dai token ai vettori](https://www.improveandmanage.com/dai-token-ai-vettori-lembedding/).
- `attenzione/widget.js`: si clicca una parola di una frase e si vedono i pesi con cui guarda le
  altre. Articolo: [Dai vettori alle relazioni](https://www.improveandmanage.com/dai-vettori-alle-relazioni-lattenzione/).
- `transformer/widget.js`: il piccolo GPT addestrato sulla Divina Commedia genera testo, e chi legge
  gli toglie dei componenti per vedere come la generazione si rompe. Articolo:
  [Il Transformer, aperto col cacciavite](https://www.improveandmanage.com/il-transformer-aperto-col-cacciavite/).
- `moe/widget.js`: un instradatore manda ogni parola a due esperti su sei, e una seconda scena mostra
  la generazione passo per passo con e senza la cache di chiavi e valori. Articolo:
  [Le evoluzioni: MoE e cache di chiavi e valori](https://www.improveandmanage.com/le-evoluzioni-moe-e-cache-di-chiavi-e-valori/).
- `architetture/widget.js`: si monta la scheda di un modello e il widget calcola memoria dei pesi,
  moltiplicazioni per token e dimensione della cache. Articolo:
  [Le architetture a confronto](https://www.improveandmanage.com/le-architetture-a-confronto/).
- `motori/widget.js`: si sceglie l'hardware e si pesano facilità, velocità, memoria e servizio, e il
  widget indica il motore di esecuzione più adatto. Articolo:
  [I motori che eseguono i pesi](https://www.improveandmanage.com/i-motori-che-eseguono-i-pesi/).
- `addestramento/widget.js`: lo stesso prompt passa per le quattro fasi dell'addestramento, con
  risposte simulate e dichiarate come tali. Articolo:
  [L'addestramento che fa la differenza](https://www.improveandmanage.com/l-addestramento-che-fa-la-differenza/).

La cartella `piccolo-gpt/` contiene i pesi e la descrizione del modello che il widget del
Transformer carica.

## La segmentatrice è diventata un duello

Nella prima versione l'articolo sul tokenizzatore usava `segmentatrice/widget.js`, che imparava una
tabella di fusioni da un corpus fisso e la applicava alla frase di chi legge. Il sito l'ha sostituita
con `segmentatrice/duello.js` e ha tolto la vecchia versione. Questa cartella segue il sito: il file
attuale è il duello, e la segmentatrice resta consultabile nella storia del repository, nei commit
precedenti a quello che l'ha rimossa. Il duello non addestra niente nel browser: i tagli dei due
vocabolari sono stati misurati una volta e stanno nel file come dati.

## Come si usano

Ogni widget si carica nella pagina con `<script src="..." defer>` e cerca nel documento i propri
elementi, riconoscibili dal prefisso degli identificativi (`mb-`, `pct-`, `rm-`, `tk-`, `eb-`,
`at-`, `sm-`, `mc-`, `sc-`, `mw-`, `ff-`). La struttura della pagina non è in questa cartella:
sta negli articoli del sito. Gli stili usano le variabili di colore e di spaziatura del tema del
blog.

Due widget leggono dati con un indirizzo assoluto, come nel sito: il percettrone legge
`/percettrone/pesi.json`, il Transformer legge `/applicazioni/piccolo-gpt/manifest.json` e
`/applicazioni/piccolo-gpt/pesi.bin`. Per provarli fuori dal sito bisogna servire quei file agli
stessi indirizzi.

Per provare un widget completo, con la sua pagina, conviene partire dalle cartelle
[`../percettrone/`](../percettrone/) e [`../rete-multistrato/`](../rete-multistrato/), che hanno
un `widget.html` autonomo.

## Licenza

MIT, vedi [`LICENSE`](LICENSE).
