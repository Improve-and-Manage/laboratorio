"""Una rete multistrato legge le cifre scritte a mano.

Accompagna l'articolo sulle reti multistrato di improveandmanage.com:
784 ingressi (la griglia 28 x 28), uno strato nascosto di 64 neuroni con
attivazione sigmoide, 10 uscite con softmax. Si addestra con la
retropropagazione e la discesa del gradiente, un esempio alla volta.

Le immagini vengono dalla raccolta pubblica MNIST e si scaricano da
internet alla prima esecuzione, come nel repository gemello `percettrone`
(che sugli stessi dati misura l'83,2%). Nessuna dipendenza: basta Python 3.
"""

import gzip
import math
import random
import struct
import urllib.request
from pathlib import Path

ORIGINE = "https://storage.googleapis.com/cvdf-datasets/mnist/"
FILE = {
    "addestramento-immagini": "train-images-idx3-ubyte.gz",
    "addestramento-etichette": "train-labels-idx1-ubyte.gz",
    "prova-immagini": "t10k-images-idx3-ubyte.gz",
    "prova-etichette": "t10k-labels-idx1-ubyte.gz",
}
DATI = Path(__file__).parent / "dati"

INGRESSI = 28 * 28
NASCOSTI = 64
USCITE = 10
TASSO = 0.1
GIRI = 3


def scarica():
    DATI.mkdir(exist_ok=True)
    for nome in FILE.values():
        destinazione = DATI / nome
        if not destinazione.exists():
            print(f"Scarico {nome}...")
            urllib.request.urlretrieve(ORIGINE + nome, destinazione)


def leggi_immagini(nome):
    with gzip.open(DATI / FILE[nome]) as f:
        _, quante, righe, colonne = struct.unpack(">IIII", f.read(16))
        crude = f.read(quante * righe * colonne)
    lato = righe * colonne
    # ogni immagine come elenco dei punti accesi (posizione, luminosita' 0..1):
    # i punti spenti non contribuiscono ne' in avanti ne' alla correzione
    return [
        [(i, crude[n * lato + i] / 255) for i in range(lato) if crude[n * lato + i]]
        for n in range(quante)
    ]


def leggi_etichette(nome):
    with gzip.open(DATI / FILE[nome]) as f:
        _, quante = struct.unpack(">II", f.read(8))
        return list(f.read(quante))


def sigmoide(z):
    if z < -30:
        return 0.0
    if z > 30:
        return 1.0
    return 1.0 / (1.0 + math.exp(-z))


class ReteMultistrato:
    """784 -> 64 (sigmoide) -> 10 (softmax), un esempio alla volta."""

    def __init__(self):
        a_caso = random.Random(1986)
        scala1 = 1.0 / math.sqrt(INGRESSI)
        scala2 = 1.0 / math.sqrt(NASCOSTI)
        # pesi1[j] = i pesi del neurone nascosto j verso i 784 ingressi
        self.pesi1 = [
            [a_caso.uniform(-scala1, scala1) for _ in range(INGRESSI)]
            for _ in range(NASCOSTI)
        ]
        self.soglie1 = [0.0] * NASCOSTI
        self.pesi2 = [
            [a_caso.uniform(-scala2, scala2) for _ in range(NASCOSTI)]
            for _ in range(USCITE)
        ]
        self.soglie2 = [0.0] * USCITE

    def in_avanti(self, punti):
        nascosti = []
        for j in range(NASCOSTI):
            pesi = self.pesi1[j]
            z = -self.soglie1[j]
            for i, valore in punti:
                z += pesi[i] * valore
            nascosti.append(sigmoide(z))
        somme = []
        for k in range(USCITE):
            pesi = self.pesi2[k]
            z = -self.soglie2[k]
            for j in range(NASCOSTI):
                z += pesi[j] * nascosti[j]
            somme.append(z)
        # softmax: dalle somme alle probabilita' (stabile: si toglie il massimo)
        massimo = max(somme)
        esponenziali = [math.exp(z - massimo) for z in somme]
        totale = sum(esponenziali)
        probabilita = [e / totale for e in esponenziali]
        return nascosti, probabilita

    def cifra_prevista(self, punti):
        _, probabilita = self.in_avanti(punti)
        return max(range(USCITE), key=lambda k: probabilita[k])

    def impara(self, punti, vera):
        nascosti, probabilita = self.in_avanti(punti)
        # errore in uscita: probabilita' data meno risposta giusta (0 o 1)
        errori_uscita = [
            probabilita[k] - (1 if k == vera else 0) for k in range(USCITE)
        ]
        # retropropagazione: l'errore di ogni neurone nascosto e' la somma
        # degli errori in uscita, pesata dai suoi collegamenti, per la
        # pendenza della sigmoide nel punto in cui lavora
        errori_nascosti = []
        for j in range(NASCOSTI):
            errore = 0.0
            for k in range(USCITE):
                errore += errori_uscita[k] * self.pesi2[k][j]
            errori_nascosti.append(errore * nascosti[j] * (1 - nascosti[j]))
        # discesa del gradiente: ogni peso si sposta contro il suo errore
        for k in range(USCITE):
            pesi = self.pesi2[k]
            passo = TASSO * errori_uscita[k]
            for j in range(NASCOSTI):
                pesi[j] -= passo * nascosti[j]
            self.soglie2[k] += passo
        for j in range(NASCOSTI):
            pesi = self.pesi1[j]
            passo = TASSO * errori_nascosti[j]
            for i, valore in punti:
                pesi[i] -= passo * valore
            self.soglie1[j] += passo


def accuratezza(rete, immagini, etichette):
    giuste = sum(
        1
        for punti, vera in zip(immagini, etichette)
        if rete.cifra_prevista(punti) == vera
    )
    return giuste / len(immagini)


def principale():
    scarica()
    addestramento = leggi_immagini("addestramento-immagini")
    etichette = leggi_etichette("addestramento-etichette")
    prova = leggi_immagini("prova-immagini")
    etichette_prova = leggi_etichette("prova-etichette")

    rete = ReteMultistrato()
    parametri = NASCOSTI * (INGRESSI + 1) + USCITE * (NASCOSTI + 1)
    print(f"Rete 784-64-10, {parametri} parametri, "
          f"{len(addestramento)} esempi di addestramento.")

    ordine = list(range(len(addestramento)))
    mescola = random.Random(1969)
    for giro in range(1, GIRI + 1):
        mescola.shuffle(ordine)
        for n in ordine:
            rete.impara(addestramento[n], etichette[n])
        esito = accuratezza(rete, prova, etichette_prova)
        print(f"Giro {giro}: {esito:.1%} di cifre riconosciute "
              f"su {len(prova)} mai viste.")


if __name__ == "__main__":
    principale()
