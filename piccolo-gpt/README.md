# Il piccolo GPT che ha letto Dante

Un modello di linguaggio minuscolo, addestrato sulla Divina Commedia un carattere alla volta, che
genera testo direttamente nel browser di chi legge. Sul sito è l'applicazione
[Il piccolo GPT che ha letto Dante](https://www.improveandmanage.com/applicazioni/piccolo-gpt/);
gli articoli della serie sul machine learning lo usano come esempio, in particolare
[Il Transformer, aperto col cacciavite](https://www.improveandmanage.com/il-transformer-aperto-col-cacciavite/).

Questa cartella contiene i pesi pubblicati, gli strumenti per rifare i dati di addestramento, la
configurazione usata con nanoGPT, gli script che hanno esportato i pesi e una pagina che fa girare
il modello senza il resto del sito.

## Che cosa c'è

- `pesi.bin` e `manifest.json`: il modello pubblicato, identico byte per byte ai file serviti dal
  sito. `manifest.json` descrive la configurazione, il vocabolario di 83 caratteri e la posizione
  di ogni tensore dentro `pesi.bin`.
- `pagina/index.html`: la pagina autonoma. Markup, stili e programma di inferenza sono copiati
  dalla pagina del sito; cambiano solo l'indirizzo dei pesi e le variabili del tema.
- `scarica_corpus.py`: scarica la Divina Commedia da Project Gutenberg (eBook #1012) e la ripulisce.
- `prepara_dati.py`: trasforma il testo nei file che nanoGPT legge per l'addestramento.
- `config/train_commedia_char.py`: la configurazione di addestramento per nanoGPT.
- `esportazione/`: gli script che hanno convertito il modello addestrato nei pesi pubblicati e
  hanno confrontato le due quantizzazioni provate.

## Provarlo nel browser

Serve solo Python 3, per avere un server locale:

```bash
cd piccolo-gpt
python3 -m http.server
```

e poi aprite <http://localhost:8000/pagina/>. La pagina carica `../manifest.json` e `../pesi.bin`
e fa tutti i calcoli in JavaScript, senza librerie e senza chiamate ad altri servizi. Aperta
direttamente come file, senza server, il browser blocca il caricamento dei pesi.

## L'architettura

È un GPT a livello di carattere, cioè un modello che legge e scrive un carattere alla volta invece
che pezzi di parola. La configurazione è in `config/train_commedia_char.py` e in `manifest.json`:

- 4 blocchi, ciascuno con 4 teste di attenzione;
- vettori di 128 numeri (`n_embd = 128`);
- una finestra di 128 caratteri (`block_size = 128`): il modello vede al più gli ultimi 128;
- un vocabolario di 83 caratteri, quelli che compaiono nel testo;
- nessun termine di scostamento negli strati (`bias = False`) e dropout 0,1 durante
  l'addestramento;
- 5.000 passi di addestramento, con lotti di 64 finestre e tasso di apprendimento che scende da
  0,001 a 0,0001.

I parametri sono 814.592; nanoGPT ne dichiara 0,80 milioni perché nel conteggio non mette gli
embedding delle posizioni (16.384). La perdita di validazione del modello pubblicato è 1,48.

I pesi sono quantizzati a 8 bit per riga: ogni riga di ogni matrice è salvata come interi da -127
a 127 più un fattore di scala, mentre i vettori delle normalizzazioni restano numeri a 32 bit. Il
file pesa 837 KB. Prima di pubblicarlo il modello quantizzato è stato confrontato con l'originale
su 128 posizioni: il carattere più probabile coincide nel 100% dei casi e le probabilità
differiscono al massimo di 0,02. È stata provata anche una quantizzazione a 4 bit, a gruppi di 32
valori: il file scendeva a 501 KB, ma il carattere più probabile coincideva solo nell'86,7% dei
casi e le probabilità differivano fino a 0,44. Poiché la pagina mostra proprio la classifica delle
probabilità, la prova dei 4 bit è stata scartata. Gli script `esporta_pesi4.py` e
`confronto_quant.py` documentano quella prova.

## Rifare l'addestramento con nanoGPT

Il modello è stato addestrato con [nanoGPT](https://github.com/karpathy/nanoGPT) di Andrej Karpathy
(licenza MIT), che serve insieme a PyTorch. Gli articoli della serie citano il codice di nanoGPT al
commit
[`3adf61e1`](https://github.com/karpathy/nanoGPT/tree/3adf61e154c3fe3fca428ad6bc3818b27a3b8291);
il commit esatto usato per l'addestramento non è stato annotato.

```bash
# 1. il testo e i dati di addestramento (solo libreria standard)
python3 scarica_corpus.py      # scrive dati/commedia_raw.txt e dati/commedia.txt
python3 prepara_dati.py        # scrive dati/train.bin, dati/val.bin, dati/meta.pkl

# 2. nanoGPT, fuori da questo repository
git clone https://github.com/karpathy/nanoGPT
cd nanoGPT && git checkout 3adf61e154c3fe3fca428ad6bc3818b27a3b8291
mkdir -p data/commedia_char
cp ../dati/train.bin ../dati/val.bin ../dati/meta.pkl data/commedia_char/
cp ../config/train_commedia_char.py config/
python train.py config/train_commedia_char.py
```

La configurazione usa `device = 'mps'`, cioè la scheda grafica dei Mac con processore Apple; su
altre macchine va cambiato in `'cuda'` o `'cpu'`.

`scarica_corpus.py` controlla l'impronta del testo ripulito: se coincide, il testo è identico a
quello usato per il modello pubblicato. Il testo comprende anche la nota finale del trascrittore
sui caratteri accentati, perché anche il modello pubblicato l'ha letta. `prepara_dati.py` fa le
stesse operazioni dello script `prepare.py` di nanoGPT per Shakespeare, senza bisogno di numpy, e
alla fine controlla che il vocabolario coincida con quello di `manifest.json`.

Per esportare i pesi, gli script di `esportazione/` vanno eseguiti da una cartella che contiene il
clone `nanoGPT/` con il checkpoint addestrato (`nanoGPT/out-commedia-char/ckpt.pt`) e
`nanoGPT/data/commedia_char/meta.pkl`; `confronto_quant.py` vuole anche `commedia.txt` nella stessa
cartella. Richiedono PyTorch e numpy. `esporta_pesi.py` scrive `export/pesi.bin` e
`export/manifest.json`; `verifica_export.py` confronta i pesi esportati con il modello originale.

## Che cosa non è stato conservato

Il programma di addestramento così come è stato eseguito, il checkpoint del modello addestrato
(`ckpt.pt`) e il file del vocabolario (`meta.pkl`) prodotto allora non sono stati conservati.
Restano la configurazione, i pesi pubblicati e gli script di esportazione.

Per questo riaddestrando si ottiene un modello dello stesso tipo, con la stessa architettura, lo
stesso vocabolario e, ci si aspetta, una perdita vicina a 1,48, ma non gli stessi pesi: l'addestramento dipende dai numeri
casuali e dalla macchina su cui gira. Gli script di `esportazione/` leggono un checkpoint che va
prima riprodotto con la ricetta qui sopra: applicati al nuovo checkpoint producono pesi nuovi, non
quelli di `pesi.bin`.

## Licenze

Il codice di questa cartella è sotto licenza MIT, come il resto del repository. Il testo della
Divina Commedia è in pubblico dominio e non è incluso: si scarica da Project Gutenberg con
`scarica_corpus.py`. nanoGPT è un progetto di Andrej Karpathy con licenza MIT propria.
