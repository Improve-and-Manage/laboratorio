"""Lo stesso conto di conto_laureati_recenti.py, con il «dopo» esteso al secondo trimestre 2026.

Non cambia nulla del metodo: stesse persone, stessi gruppi, stesse misure, stessi semi del
ricampionamento (1 per gli intervalli delle singole stime, 2 per le differenze delle differenze).
Le funzioni si prendono dallo script principale, che resta com'è; qui cambiano solo:
- le cartelle da cui si leggono i file (più di una: i trimestri 2021-2025 e quelli del 2026);
- il periodo «dopo», che diventa 2023 - secondo trimestre 2026 (etichetta «2023-2026T2»);
- le righe annuali, che arrivano al 2026 (solo primo e secondo trimestre, etichetta «2026T1-T2»);
- i nomi dei file scritti, con il suffisso -2026q2, accanto ai vecchi senza sovrascriverli.
INCDEC (retribuzione) nei file del 2024, 2025 e 2026 è vuoto: per la retribuzione il «dopo» resta
il solo 2023 e quelle stime non cambiano.

Uso:
    python3 -I conto_laureati_recenti_2026q2.py CARTELLA_DATI [CARTELLA_DATI ...]
    python3 -I conto_laureati_recenti_2026q2.py --controllo USCITA CARTELLA_DATI [...]
Senza cartelle, legge data/istat-rcfl e data/istat-rcfl-2026 (dossier) oppure dati/ (repository).
Con --controllo rifà il conto vecchio (2023-2025, file fino al 2025) e lo scrive in USCITA con i
nomi vecchi, per confrontarlo con i CSV già pubblicati.
"""

import csv
import importlib.util
import sys
from pathlib import Path

QUI = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("conto_base", QUI / "conto_laureati_recenti.py")
base = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(base)
_leggi_una_cartella = base.leggi


def configura(cartelle: list[Path], ultimo_anno: int, periodo_dopo: str) -> None:
    def leggi() -> list[dict]:
        righe = []
        for c in cartelle:
            base.DATI = c
            righe += [r for r in _leggi_una_cartella() if r["anno"] <= ultimo_anno]
        return righe

    base.leggi = leggi
    base.PERIODI = {"2021-2022": {2021, 2022}, periodo_dopo: set(range(2023, ultimo_anno + 1))}

    def tabelle(universo: str, righe: list[dict]) -> list[dict]:
        tabella = []
        for g in base.GRUPPI:
            for p, anni in base.PERIODI.items():
                sel = [r for r in righe if r["gruppo"] == g and r["anno"] in anni]
                m, ic = base.misure(sel), base.bootstrap(sel)
                occ = sum(1 for r in sel if r["occ"])
                for k in m:
                    tabella.append({"universo": universo, "gruppo": g, "periodo": p, "misura": k,
                                    "valore": round(m[k], 4), "ic_basso": round(ic[k][0], 4),
                                    "ic_alto": round(ic[k][1], 4), "osservazioni": len(sel),
                                    "occupati_osservati": occ})
            for anno in range(2021, ultimo_anno + 1):
                sel = [r for r in righe if r["gruppo"] == g and r["anno"] == anno]
                m = base.misure(sel)
                etichetta = "2026T1-T2" if anno == 2026 else str(anno)
                for k in m:
                    tabella.append({"universo": universo, "gruppo": g, "periodo": etichetta, "misura": k,
                                    "valore": round(m[k], 4), "ic_basso": "", "ic_alto": "",
                                    "osservazioni": len(sel),
                                    "occupati_osservati": sum(1 for r in sel if r["occ"])})
        return tabella

    base.tabelle = tabelle


def scrivi(percorso: Path, righe: list[dict]) -> None:
    with open(percorso, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(righe[0]))
        w.writeheader()
        w.writerows(righe)


def conto(uscita: Path, suffisso: str) -> None:
    tutte = base.leggi()
    if not tutte:
        raise SystemExit("Nessun file trovato nelle cartelle indicate.")
    trimestri = sorted({r["fam"].rsplit("-", 1)[0] for r in tutte})
    print(f"{len(trimestri)} trimestri, dal {trimestri[0]} al {trimestri[-1]}")
    tabella = []
    for universo, righe in (("non iscritti a un corso", [r for r in tutte if not r["studia"]]),
                            ("tutti", tutte)):
        tabella += base.tabelle(universo, righe)
    scrivi(uscita / f"risultati-laureati-recenti{suffisso}.csv", tabella)
    non_iscritti = [r for r in tutte if not r["studia"]]
    out = []
    for g in ("ICT e ingegneria dell'informazione", "Economia, diritto, scienze sociali, lettere", "Altre aree"):
        for misura, (stima, lo, hi) in base.differenza_delle_differenze(non_iscritti, g, "Sanità e insegnamento").items():
            out.append({"gruppo": g, "confronto": "Sanità e insegnamento", "misura": misura,
                        "differenza_delle_differenze": round(stima, 4), "ic_basso": round(lo, 4),
                        "ic_alto": round(hi, 4)})
    scrivi(uscita / f"differenze-laureati-recenti{suffisso}.csv", out)
    print(f"scritti in {uscita}: risultati-laureati-recenti{suffisso}.csv, differenze-laureati-recenti{suffisso}.csv")


def main() -> None:
    args = sys.argv[1:]
    controllo = None
    if args[:1] == ["--controllo"]:
        controllo, args = Path(args[1]), args[2:]
    if args:
        cartelle = [Path(a) for a in args]
    elif hasattr(base, "RADICE"):
        cartelle = [base.RADICE / "data" / "istat-rcfl", base.RADICE / "data" / "istat-rcfl-2026"]
    else:
        cartelle = [base.DATI]
    if controllo:
        configura(cartelle, 2025, "2023-2025")
        controllo.mkdir(parents=True, exist_ok=True)
        conto(controllo, "")
    else:
        configura(cartelle, 2026, "2023-2026T2")
        conto(getattr(base, "RISULTATI", QUI), "-2026q2")


if __name__ == "__main__":
    main()
