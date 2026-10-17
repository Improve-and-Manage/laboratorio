"""Scarica la Divina Commedia da Project Gutenberg e la ripulisce per l'addestramento.

Il testo è l'eBook #1012 di Project Gutenberg, in pubblico dominio. La pulizia è la stessa usata
per il piccolo GPT:
  1. i fine riga in stile Windows (\\r\\n) diventano \\n;
  2. si tiene solo il testo fra la riga «*** START OF THE PROJECT GUTENBERG EBOOK ...» e la riga
     «*** END OF THE PROJECT GUTENBERG EBOOK ...», escluse;
  3. tre o più a capo di fila diventano due, cioè al più una riga vuota fra un blocco e l'altro;
  4. si tolgono spazi e righe vuote all'inizio e alla fine, e si chiude con un solo a capo.
Il risultato comincia con «LA DIVINA COMMEDIA» e conserva in fondo la nota sui caratteri del
trascrittore: il modello è stato addestrato anche su quella.

Uso:
    python3 scarica_corpus.py              scrive dati/commedia_raw.txt e dati/commedia.txt
    python3 scarica_corpus.py CARTELLA     scrive i due file in CARTELLA

Solo libreria standard. Il file scaricato pesa circa 600 KB.
"""

import hashlib
import re
import sys
import urllib.request
from pathlib import Path

URL = "https://www.gutenberg.org/cache/epub/1012/pg1012.txt"
INIZIO = "*** START OF THE PROJECT GUTENBERG EBOOK"
FINE = "*** END OF THE PROJECT GUTENBERG EBOOK"
# Impronta SHA-256 del testo ripulito usato per addestrare il modello pubblicato.
IMPRONTA_ATTESA = "22cf888fea5f2270f6138c424c5d32f6ee92692c8795a2e9fba2884ddf57d8cd"


def ripulisci(grezzo: str) -> str:
    testo = grezzo.lstrip("\ufeff").replace("\r\n", "\n")
    inizio = testo.index(INIZIO)
    inizio = testo.index("\n", inizio) + 1
    fine = testo.index(FINE)
    corpo = testo[inizio:fine]
    return re.sub(r"\n{3,}", "\n\n", corpo).strip() + "\n"


def main() -> None:
    cartella = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent / "dati"
    cartella.mkdir(parents=True, exist_ok=True)
    richiesta = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(richiesta, timeout=120) as risposta:
        dati = risposta.read()
    (cartella / "commedia_raw.txt").write_bytes(dati)
    pulito = ripulisci(dati.decode("utf-8")).encode("utf-8")
    (cartella / "commedia.txt").write_bytes(pulito)
    impronta = hashlib.sha256(pulito).hexdigest()
    print(f"commedia_raw.txt  {len(dati):,} byte".replace(",", "."))
    print(f"commedia.txt      {len(pulito):,} byte".replace(",", "."))
    if impronta == IMPRONTA_ATTESA:
        print("Il testo ripulito coincide con quello usato per addestrare il modello pubblicato.")
    else:
        print("Attenzione: il testo ripulito è diverso da quello usato per il modello pubblicato "
              "(Project Gutenberg potrebbe aver aggiornato l'eBook).")
        print(f"impronta SHA-256: {impronta}")


if __name__ == "__main__":
    main()
