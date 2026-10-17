# La rete multistrato

I programmi che accompagnano l'articolo
[Le reti multistrato: oltre il muro del percettrone](https://www.improveandmanage.com/reti-neurali-multilivello/)
di Improve and Manage. Nessuna dipendenza: basta Python 3. Le immagini delle
cifre vengono dalla raccolta pubblica [MNIST](https://storage.googleapis.com/cvdf-datasets/mnist/)
e si scaricano da internet alla prima esecuzione, nella cartella `dati/` -
come nel [repository gemello del percettrone](https://github.com/Improve-and-Manage/percettrone).

## I due programmi

**`xor.py`** è la rete minima che abbatte il muro del percettrone: due
ingressi, due neuroni nascosti («almeno uno» e «entrambi»), un'uscita. I
pesi sono scritti a mano, e il programma rifà la tabella dei quattro casi
dell'articolo:

```
$ python3 xor.py
a b | almeno uno  entrambi | uscita (XOR)
0 0 |     0          0     |   0
0 1 |     1          0     |   1
1 0 |     1          0     |   1
1 1 |     1          1     |   0
```

**`rete_multistrato.py`** addestra con la retropropagazione una rete
784-64-10 (uno strato nascosto di 64 neuroni con sigmoide, dieci uscite con
softmax, 50.890 parametri) sulle stesse cifre su cui il repository gemello
misura il percettrone all'83,2%. I semi casuali sono fissati e l'esito è
riproducibile al decimale:

```
$ python3 rete_multistrato.py
Rete 784-64-10, 50890 parametri, 60000 esempi di addestramento.
Giro 1: 95.8% di cifre riconosciute su 10000 mai viste.
Giro 2: 95.1% di cifre riconosciute su 10000 mai viste.
Giro 3: 96.3% di cifre riconosciute su 10000 mai viste.
```

Tredici punti sopra il percettrone, sugli stessi dati e con lo stesso metro:
la differenza è lo strato nascosto, che deforma lo spazio finché le dieci
cifre diventano separabili. L'addestramento in Python puro richiede qualche
minuto per giro: la lentezza è il prezzo della leggibilità, e il motivo per
cui il mestiere usa acceleratori di calcolo.

## Il widget: la rete che impara davanti a voi

**`widget.html`** è il widget pubblicato nell'articolo: la rete 2-2-1 parte da
pesi a caso e impara XOR con la retropropagazione, mostrando la superficie di
decisione che si piega a ogni giro. Si sceglie la curva dello strato nascosto
(sigmoide, tanh, ReLU) e il tasso di apprendimento: la sigmoide impara con
calma, la tanh di solito più in fretta, e la ReLU ogni tanto si incaglia - in
quel caso il widget rimescola i pesi da solo e conta i tentativi. Per provarlo
in locale:

```
$ python3 -m http.server
```

e poi aprite <http://localhost:8000/widget.html>.

## Licenza

[MIT](LICENSE).
