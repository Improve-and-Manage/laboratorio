"""Dieci percettroni leggono le cifre scritte a mano.

Accompagna l'articolo "Il percettrone: la prima macchina che impara i propri
pesi" su improveandmanage.com: stessa anatomia (pesi, soglia, gradino), stessa
regola di apprendimento, stessa scelta per somma pesata piu' alta.

Le immagini vengono dalla raccolta pubblica MNIST (cifre scritte a mano,
28 x 28 punti) e si scaricano da internet alla prima esecuzione. Nessuna
dipendenza: basta Python 3.
"""

import gzip
import json
import random
import struct
import urllib.request
from pathlib import Path

# La copia pubblica della raccolta MNIST (mirror di Google Cloud, stabile).
ORIGINE = "https://storage.googleapis.com/cvdf-datasets/mnist/"
FILE = {
    "addestramento-immagini": "train-images-idx3-ubyte.gz",
    "addestramento-etichette": "train-labels-idx1-ubyte.gz",
    "prova-immagini": "t10k-images-idx3-ubyte.gz",
    "prova-etichette": "t10k-labels-idx1-ubyte.gz",
}
DATI = Path(__file__).parent / "dati"

TASSO = 0.1   # tasso di apprendimento
GIRI = 3      # quante volte si ripassa l'intera raccolta (le "epoche")


class Percettrone:
    """Un neurone artificiale che impara: pesi, soglia, gradino."""

    def __init__(self, quanti_ingressi):
        a_caso = random.Random(1958)
        self.pesi = [a_caso.uniform(-0.05, 0.05) for _ in range(quanti_ingressi)]
        self.soglia = 0.0

    def somma_pesata(self, punti):
        return sum(self.pesi[i] * valore for i, valore in punti)

    def risponde(self, punti):
        return 1 if self.somma_pesata(punti) > self.soglia else 0

    def impara(self, punti, risposta_giusta):
        """La regola di apprendimento del percettrone, una riga per peso:
        nuovo peso = peso + tasso di apprendimento x errore x ingresso.
        I pesi si spostano solo dove l'ingresso era acceso; la soglia
        si aggiusta in direzione opposta."""
        errore = risposta_giusta - self.risponde(punti)
        if errore:
            for i, valore in punti:
                self.pesi[i] += TASSO * errore * valore
            self.soglia -= TASSO * errore


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
    # Ogni immagine diventa l'elenco dei suoi punti accesi: (posizione,
    # luminosita' da 0 a 1). I punti spenti si saltano, perche' con
    # ingresso zero non contribuiscono ne' alla somma ne' alla correzione.
    immagini = []
    for n in range(quante):
        base = n * lato
        immagini.append([
            (i, crude[base + i] / 255)
            for i in range(lato)
            if crude[base + i]
        ])
    return immagini


def leggi_etichette(nome):
    with gzip.open(DATI / FILE[nome]) as f:
        _, quante = struct.unpack(">II", f.read(8))
        return list(f.read(quante))


def cifra_prevista(percettroni, punti):
    """Fra le dieci risposte vince la somma pesata piu' alta: il gradino
    potrebbe accenderne tre o nessuna, la somma ordina sempre."""
    return max(range(10), key=lambda c: percettroni[c].somma_pesata(punti))


def accuratezza(percettroni, immagini, etichette):
    giuste = sum(
        1
        for punti, vera in zip(immagini, etichette)
        if cifra_prevista(percettroni, punti) == vera
    )
    return giuste / len(immagini)


def esporta(esito, giro, stato, dove=Path(__file__).parent / "pesi.json"):
    """Salva i pesi del giro migliore, quantizzati a 8 bit: per ogni cifra
    una scala, i 784 pesi interi (peso = intero x scala) e la soglia.
    Il file alimenta il widget che disegna e riconosce."""
    cifre = []
    for pesi, soglia in stato:
        scala = (max(abs(p) for p in pesi) or 1.0) / 127
        cifre.append({
            "scala": round(scala, 8),
            "soglia": round(soglia, 6),
            "pesi": [round(p / scala) for p in pesi],
        })
    dove.write_text(json.dumps(
        {"griglia": 28, "giro": giro, "accuratezza": round(esito, 4), "cifre": cifre},
        separators=(",", ":"),
    ))
    print(f"Pesi del giro migliore ({giro}, {esito:.1%}) salvati in {dove.name}.")


def principale():
    scarica()
    addestramento = leggi_immagini("addestramento-immagini")
    etichette = leggi_etichette("addestramento-etichette")
    prova = leggi_immagini("prova-immagini")
    etichette_prova = leggi_etichette("prova-etichette")

    percettroni = [Percettrone(28 * 28) for _ in range(10)]
    print(f"Dieci percettroni, {len(addestramento)} esempi di addestramento.")

    ordine = list(range(len(addestramento)))
    mescola = random.Random(1969)
    migliore = None
    for giro in range(1, GIRI + 1):
        mescola.shuffle(ordine)
        for n in ordine:
            punti, vera = addestramento[n], etichette[n]
            for cifra in range(10):
                percettroni[cifra].impara(punti, 1 if cifra == vera else 0)
        esito = accuratezza(percettroni, prova, etichette_prova)
        print(f"Giro {giro}: {esito:.1%} di cifre riconosciute "
              f"su {len(prova)} mai viste.")
        if migliore is None or esito > migliore[0]:
            migliore = (esito, giro, [(list(p.pesi), p.soglia) for p in percettroni])
    esporta(*migliore)


if __name__ == "__main__":
    principale()
