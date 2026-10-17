# Laboratorio di Improve and Manage

Il codice pubblicato con gli articoli del blog
[Improve and Manage](https://www.improveandmanage.com/).

## Perché esiste

Improve and Manage è una rete di professionisti che fa consulenza su intelligenza artificiale e
organizzazione. Nel blog scriviamo quello che impariamo lavorando, e gli articoli mostrano riga per
riga come ragioniamo: ogni cifra dice da dove viene.

Questo repository porta lo stesso principio dal testo al codice. Quando un articolo riporta un
numero, descrive un modello o mostra un widget, qui c'è il programma che lo produce. Chi legge può
rifare i numeri sul proprio computer e vedere il meccanismo all'opera, invece di fidarsi della
nostra parola.

## Che cosa contiene

Ogni cartella è un progetto a sé, con il suo README.

- [`percettrone/`](percettrone/): il percettrone in Python puro. Un programma rifà numero per
  numero il caso svolto dell'articolo, un altro addestra dieci percettroni a riconoscere le cifre
  scritte a mano. C'è anche il widget in cui si disegna una cifra e la si fa votare. Articolo:
  [Il percettrone](https://www.improveandmanage.com/il-percettrone-origine-funzionamento-e-limiti/).
- [`rete-multistrato/`](rete-multistrato/): la rete minima che risolve la funzione XOR, con i pesi
  scritti a mano, e una rete con uno strato nascosto addestrata sulle stesse cifre del percettrone.
  Il widget mostra la rete che impara XOR passo per passo. Articolo:
  [Le reti multistrato](https://www.improveandmanage.com/reti-neurali-multilivello/).
- [`widget-machine-learning/`](widget-machine-learning/): i widget interattivi della serie sul
  machine learning, uno per articolo, dalla macchina-bambina di Turing alle fasi dell'addestramento
  dei modelli di linguaggio. Sono le stesse copie pubblicate dal sito, e il README della cartella
  collega ciascuno al suo articolo.
- [`piccolo-gpt/`](piccolo-gpt/): il piccolo GPT che ha letto Dante, un modello di linguaggio
  minuscolo addestrato sulla Divina Commedia che genera testo nel browser. Contiene i pesi
  pubblicati, una pagina per farlo girare in locale e la ricetta per riaddestrarlo con nanoGPT.
  Pagina sul sito:
  [Il piccolo GPT che ha letto Dante](https://www.improveandmanage.com/applicazioni/piccolo-gpt/).
- [`laureati-ai-italia/`](laureati-ai-italia/): un'analisi sui microdati Istat dei laureati recenti,
  per capire se dopo ChatGPT quelli delle aree più esposte all'intelligenza artificiale trovano
  lavoro meno spesso, guadagnano meno o entrano in professioni meno qualificate. Articolo in
  preparazione.

## Come si usa

Quasi tutto gira con Python 3 e la sola libreria standard, oppure in JavaScript nel browser senza
librerie. L'unica eccezione è il riaddestramento del piccolo GPT, che richiede PyTorch e nanoGPT.

I dati non sono inclusi nel repository. Ogni progetto li scarica dalla fonte originale: le cifre
scritte a mano dalla raccolta pubblica MNIST, la Divina Commedia da Project Gutenberg, i microdati
della Rilevazione sulle forze di lavoro dal sito dell'Istat. I file scaricati finiscono in una
cartella `dati/` che Git ignora.

I widget e le pagine nel browser vanno aperti attraverso un server locale, perché il browser non
carica i pesi da un file aperto direttamente. Dalla cartella del progetto basta:

```bash
python3 -m http.server
```

e poi l'indirizzo indicato nel README della cartella.

## Licenze

Il codice è sotto licenza MIT (vedi [`LICENSE`](LICENSE)). Le cartelle che hanno un proprio file
`LICENSE` lo conservano. I risultati e la nota di metodo dell'analisi sui laureati sono sotto
licenza Creative Commons Attribuzione 4.0 (CC BY 4.0), come spiega il README di quella cartella. I
dati delle fonti restano soggetti ai termini di chi li pubblica.

## Il sito

Gli articoli che accompagnano questo codice sono su <https://www.improveandmanage.com/>.
