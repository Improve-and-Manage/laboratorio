"""Scarica dal sito dell'Istat i file mIcro.STAT della Rilevazione sulle forze di lavoro.

I file sono ad uso pubblico e si scaricano liberamente, ma non li ridistribuiamo: chi li usa li
prende dalla fonte e ne accetta i termini d'uso
(https://www.istat.it/microdati/rilevazione-sulle-forze-di-lavoro-dati-trasversali-trimestrali/):
non tentare l'identificazione delle persone, usare i dati per soli scopi statistici, citare la
fonte dichiarando che la responsabilità delle elaborazioni non è dell'Istat.

Uso:
    python3 scarica_dati.py                 scarica i trimestri dal 2021 al 2026 in dati/
    python3 scarica_dati.py 2021 2025       solo gli anni dal 2021 al 2025
    python3 scarica_dati.py --elenco        elenca i file e gli indirizzi senza scaricare niente
    DATI_ISTAT=/tmp/istat python3 scarica_dati.py   scarica in un'altra cartella

Circa 10 MB per trimestre, 220 MB in tutto. I file già presenti non si riscaricano.

L'ultimo anno può essere incompleto: l'Istat pubblica i trimestri uno alla volta, qualche mese dopo
la loro fine. Se nell'ultimo anno richiesto un trimestre non è ancora disponibile, il programma lo
dice e si ferma lì, senza errore. Negli anni precedenti un trimestre mancante resta un errore.
"""

import os
import sys
import urllib.error
import urllib.request
import zipfile
from pathlib import Path

QUI = Path(__file__).resolve().parent
DATI = Path(os.environ.get("DATI_ISTAT", QUI / "dati"))
URL = ("https://www.istat.it/wp-content/themes/EGPbs5-child/microdata/download.php"
       "?file=%2F2%2F{anno}%2F{trim}%2F{trim}.zip&filename=RCFL_{anno}_Q{trim}.zip")


class NonDisponibile(Exception):
    """Il sito Istat non restituisce un archivio per quel trimestre."""


def scarica(anno: int, trim: int) -> Path:
    dest = DATI / f"RCFL_{anno}_Q{trim}.zip"
    if dest.exists() and zipfile.is_zipfile(dest):
        return dest
    req = urllib.request.Request(URL.format(anno=anno, trim=trim), headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            dest.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        raise NonDisponibile(f"risposta HTTP {e.code}") from e
    if not zipfile.is_zipfile(dest):
        dest.unlink()
        raise NonDisponibile("il file ricevuto non è un archivio zip")
    return dest


def main() -> None:
    args = sys.argv[1:]
    elenco = "--elenco" in args
    args = [a for a in args if a != "--elenco"]
    da, a = (int(args[0]), int(args[1])) if len(args) == 2 else (2021, 2026)
    if elenco:
        for anno in range(da, a + 1):
            for trim in range(1, 5):
                print(f"RCFL_{anno}_Q{trim}.zip  {URL.format(anno=anno, trim=trim)}")
        print(f"Cartella di destinazione: {DATI}")
        return
    DATI.mkdir(parents=True, exist_ok=True)
    for anno in range(da, a + 1):
        for trim in range(1, 5):
            try:
                f = scarica(anno, trim)
            except NonDisponibile as e:
                if anno == a:
                    print(f"{anno}, trimestre {trim}: non ancora disponibile sul sito Istat ({e}). "
                          "Mi fermo qui: i trimestri precedenti sono scaricati.")
                    return
                raise SystemExit(f"Il file del {anno} trimestre {trim} non è disponibile ({e}): il sito "
                                 "Istat potrebbe aver cambiato indirizzo. Scaricalo a mano dalla pagina "
                                 "dei microdati.")
            print(f"{f.name}  {f.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
