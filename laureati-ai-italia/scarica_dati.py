"""Scarica dal sito dell'Istat i file mIcro.STAT della Rilevazione sulle forze di lavoro.

I file sono ad uso pubblico e si scaricano liberamente, ma non li ridistribuiamo: chi li usa li
prende dalla fonte e ne accetta i termini d'uso
(https://www.istat.it/microdati/rilevazione-sulle-forze-di-lavoro-dati-trasversali-trimestrali/):
non tentare l'identificazione delle persone, usare i dati per soli scopi statistici, citare la
fonte dichiarando che la responsabilità delle elaborazioni non è dell'Istat.

Uso:
    python3 scarica_dati.py                 scarica i trimestri dal 2021 al 2025 in dati/
    python3 scarica_dati.py 2021 2025       stesso intervallo, esplicito

Circa 10 MB per trimestre, 200 MB in tutto. I file già presenti non si riscaricano.
"""

import sys
import urllib.request
import zipfile
from pathlib import Path

QUI = Path(__file__).resolve().parent
DATI = QUI / "dati"
URL = ("https://www.istat.it/wp-content/themes/EGPbs5-child/microdata/download.php"
       "?file=%2F2%2F{anno}%2F{trim}%2F{trim}.zip&filename=RCFL_{anno}_Q{trim}.zip")


def scarica(anno: int, trim: int) -> Path:
    dest = DATI / f"RCFL_{anno}_Q{trim}.zip"
    if dest.exists() and zipfile.is_zipfile(dest):
        return dest
    req = urllib.request.Request(URL.format(anno=anno, trim=trim), headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=300) as r:
        dest.write_bytes(r.read())
    if not zipfile.is_zipfile(dest):
        dest.unlink()
        raise SystemExit(f"Il file del {anno} trimestre {trim} non è un archivio valido: il sito Istat "
                         "potrebbe aver cambiato indirizzo. Scaricalo a mano dalla pagina dei microdati.")
    return dest


def main() -> None:
    da, a = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) == 3 else (2021, 2025)
    DATI.mkdir(exist_ok=True)
    for anno in range(da, a + 1):
        for trim in range(1, 5):
            f = scarica(anno, trim)
            print(f"{f.name}  {f.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
