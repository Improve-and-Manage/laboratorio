# Il percettrone

Il programma che accompagna l'articolo
[Il percettrone: la prima macchina che impara i propri pesi](https://www.improveandmanage.com/il-percettrone-origine-funzionamento-e-limiti/)
di Improve and Manage: la stessa anatomia (pesi, soglia, gradino), la stessa
regola di apprendimento e la stessa scelta per somma pesata più alta descritte
nel pezzo, senza nient'altro.

Nessuna dipendenza: basta Python 3. Le immagini delle cifre non sono nel
repository: vengono dalla raccolta pubblica [MNIST](https://storage.googleapis.com/cvdf-datasets/mnist/)
(cifre scritte a mano, 28 × 28 punti) e si scaricano da internet alla prima
esecuzione, nella cartella `dati/`.

## I due programmi

**`esempio_svolto.py`** riproduce il caso svolto dell'articolo, numero per
numero: ingressi 1, 0 e 1, pesi 0,5, -0,3 e 0,1, soglia 0,8. Un errore, una
correzione, e l'esempio è imparato - col secondo peso che non si muove, perché
il suo ingresso era spento.

```
$ python3 esempio_svolto.py
Somma pesata: 0.6  (soglia 0.8) -> risposta 0
Risposta giusta: 1 -> errore 1
Pesi corretti: [1.0, -0.3, 0.6]  (il secondo non si muove)
Soglia corretta: 0.3
Stesso esempio: somma 1.6 > soglia 0.3 -> risposta 1
Un errore, una correzione: imparato.
```

**`percettrone.py`** addestra dieci percettroni - uno per cifra, 784 pesi
ciascuno - a leggere le cifre scritte a mano, e li mette alla prova su
diecimila immagini mai viste. I semi casuali sono fissati, quindi l'esito è
riproducibile al decimale:

```
$ python3 percettrone.py
Dieci percettroni, 60000 esempi di addestramento.
Giro 1: 76.2% di cifre riconosciute su 10000 mai viste.
Giro 2: 83.2% di cifre riconosciute su 10000 mai viste.
Giro 3: 74.5% di cifre riconosciute su 10000 mai viste.
Pesi del giro migliore (2, 83.2%) salvati in pesi.json.
```

## Il widget: disegnate un numero

**`widget.html`** è lo stesso widget pubblicato nell'articolo: si disegna una
cifra col mouse o col dito, e i dieci percettroni votano in diretta con le
loro somme pesate - la più alta si accende, e un riquadro mostra ciò che il
modello vede davvero (la griglia 28 × 28, riscalata e centrata come gli
esempi di addestramento). La radiografia, ripiegata sotto il widget, mostra i
pesi di ogni cifra rimessi in griglia - il ritratto che ogni percettrone ha
della sua cifra - e il disegno sovrapposto a quei pesi: dove guadagna punti e
dove li perde. Usa i pesi di `pesi.json`: quelli del giro migliore
dell'addestramento, quantizzati a 8 bit (la stessa accuratezza, 83,2%,
verificata dopo la quantizzazione). Per provarlo in locale:

```
$ python3 -m http.server
```

e poi aprite <http://localhost:8000/widget.html>. Quando sbaglia - capiterà:
un percettrone è una retta - guardate le barre: spesso la cifra giusta è lì,
seconda per un soffio.

## Perché il punteggio oscilla invece di salire

Non è un difetto del programma: è il teorema dell'articolo visto dal lato in
cui non vale. La convergenza del percettrone è garantita solo se gli esempi
sono linearmente separabili - «purché quella divisione sia fra le capacità del
percettrone», diceva Novikoff - e le dieci cifre di MNIST **non lo sono**:
nessun insieme di rette divide perfettamente un 4 da un 9 in tutte le grafie.
Fuori dalla garanzia, la regola continua a correggere senza potersi assestare,
e il punteggio sale e scende a ogni giro. Come si impara anche quando nessuna
retta basta è il tema del pezzo successivo della serie, sulle reti multistrato.

## Licenza

[MIT](LICENSE).
