"""Prepara la Divina Commedia per l'addestramento a caratteri con nanoGPT.

Fa le stesse operazioni di data/shakespeare_char/prepare.py di nanoGPT, applicate a commedia.txt:
  1. il vocabolario è l'insieme dei caratteri del testo, in ordine di codice Unicode;
  2. ogni carattere diventa il suo indice nel vocabolario;
  3. il primo 90% del testo serve per l'addestramento (train.bin), l'ultimo 10% per la
     validazione (val.bin), come interi senza segno a 16 bit;
  4. meta.pkl conserva la dimensione del vocabolario e le due tabelle di conversione
     (stoi: carattere -> indice, itos: indice -> carattere), come le legge nanoGPT.
A differenza dell'originale usa solo la libreria standard: niente numpy.

Uso:
    python3 prepara_dati.py                      legge dati/commedia.txt e scrive in dati/
    python3 prepara_dati.py TESTO CARTELLA       legge TESTO e scrive in CARTELLA

Per l'addestramento i tre file vanno nella cartella data/commedia_char/ di nanoGPT.
Alla fine il programma confronta il vocabolario con quello di manifest.json, cioè del modello
pubblicato: devono coincidere carattere per carattere e nello stesso ordine.
"""

import json
import pickle
import sys
from array import array
from pathlib import Path

QUI = Path(__file__).resolve().parent


def scrivi_bin(percorso: Path, indici: list[int]) -> None:
    dati = array("H", indici)  # interi senza segno a 16 bit, come np.uint16
    if sys.byteorder == "big":
        dati.byteswap()  # nanoGPT legge i file come little-endian
    with open(percorso, "wb") as f:
        dati.tofile(f)


def main() -> None:
    if len(sys.argv) == 3:
        testo_path, uscita = Path(sys.argv[1]), Path(sys.argv[2])
    else:
        testo_path, uscita = QUI / "dati" / "commedia.txt", QUI / "dati"
    uscita.mkdir(parents=True, exist_ok=True)

    with open(testo_path, encoding="utf-8") as f:
        dati = f.read()
    print(f"lunghezza del testo in caratteri: {len(dati):,}".replace(",", "."))

    caratteri = sorted(set(dati))
    vocab_size = len(caratteri)
    print("caratteri distinti:", "".join(caratteri))
    print(f"dimensione del vocabolario: {vocab_size}")

    stoi = {ch: i for i, ch in enumerate(caratteri)}
    itos = {i: ch for i, ch in enumerate(caratteri)}

    n = len(dati)
    train = [stoi[c] for c in dati[: int(n * 0.9)]]
    val = [stoi[c] for c in dati[int(n * 0.9):]]
    print(f"addestramento: {len(train):,} caratteri".replace(",", "."))
    print(f"validazione: {len(val):,} caratteri".replace(",", "."))

    scrivi_bin(uscita / "train.bin", train)
    scrivi_bin(uscita / "val.bin", val)
    with open(uscita / "meta.pkl", "wb") as f:
        pickle.dump({"vocab_size": vocab_size, "itos": itos, "stoi": stoi}, f)
    print(f"scritti in {uscita}: train.bin, val.bin, meta.pkl")

    manifest = QUI / "manifest.json"
    if manifest.exists():
        pubblicato = json.loads(manifest.read_text(encoding="utf-8"))["vocabolario"]
        if pubblicato == "".join(caratteri):
            print(f"Il vocabolario coincide con quello del modello pubblicato ({vocab_size} caratteri, "
                  "stesso ordine).")
        else:
            print("Attenzione: il vocabolario è diverso da quello del modello pubblicato.")


if __name__ == "__main__":
    main()
