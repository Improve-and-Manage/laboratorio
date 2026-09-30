"""Dove lavorano i laureati recenti italiani, per area disciplinare, 2021-2025.

Dati: Istat, Rilevazione sulle forze di lavoro, file mIcro.STAT trimestrali ad uso pubblico,
dal primo trimestre 2021 al quarto trimestre 2025, nella cartella dati/ (si scaricano con
scarica_dati.py e non fanno parte del repository). Licenza Creative Commons Attribuzione;
la responsabilità delle elaborazioni non è da attribuire all'Istat.

Chi si conta: persone con titolo terziario (EDULEV = 6: laurea, ma anche ITS e diplomi AFAM)
conseguito da 0 a 2 anni (QH04MCR = 1). Versione principale: solo chi non è iscritto a un corso
di istruzione formale nelle 4 settimane precedenti (EDUCFED4 diverso da 1), come fa AlmaLaurea;
versione di controllo: tutti. Pesi: COEF_CCP.

Che cosa si misura, per gruppo di aree disciplinari (HATFIELD_D) e periodo:
- quota di occupati (COND3 = 1);
- fra gli occupati dipendenti, il decile della retribuzione lorda media mensile (INCDEC): quota nei
  decili 1-3 e decile medio (diviso per 10 per stare nella stessa colonna delle quote);
  INCDEC viene dai registri amministrativi e l'Istat lo aggiunge con circa 18 mesi di ritardo: nei
  file scaricati c'è per il 2021-2023 e manca per il 2024-2025, quindi il «dopo» della
  retribuzione è il solo 2023;
- fra gli occupati, il grande gruppo professionale (PROF1): 1-2 dirigenti e professioni
  intellettuali; 3 professioni tecniche; 4-5 lavoro d'ufficio, commercio e servizi; 6-8 lavori
  manuali. Il 9 (forze armate) resta nel totale.

Gruppi dichiarati prima di guardare i risultati (vedi nota-di-metodo.md):
- ICT e ingegneria dell'informazione (009, 010): i più vicini al decile più esposto del Census;
- economia, diritto, scienze sociali, lettere (004-007): esposti per scrittura e analisi;
- sanità e insegnamento (002, 013): i meno esposti;
- altre aree (003, 008, 011, 012, 014), riportate a parte.

Intervalli: bootstrap per famiglia dentro ciascun trimestre (MCRFAM), 1.000 repliche. Le stesse
famiglie ricompaiono in trimestri diversi e non si possono collegare nei file pubblici: gli
intervalli sono quindi un po' più stretti del vero.

Uso: python3 conto_laureati_recenti.py
Scrive risultati/risultati-laureati-recenti.csv e risultati/differenze-laureati-recenti.csv e
stampa le tabelle. Richiede Python 3.10 o successivo, senza librerie esterne. Circa due minuti.
"""

import csv
import os
import glob
import io
import random
import zipfile
from pathlib import Path

QUI = Path(__file__).resolve().parent
DATI = Path(os.environ.get("DATI_ISTAT", QUI / "dati"))
RISULTATI = QUI / "risultati"

GRUPPI = {
    "ICT e ingegneria dell'informazione": {"009", "010"},
    "Economia, diritto, scienze sociali, lettere": {"004", "005", "006", "007"},
    "Sanità e insegnamento": {"002", "013"},
    "Altre aree": {"003", "008", "011", "012", "014"},
}
PERIODI = {"2021-2022": {2021, 2022}, "2023-2025": {2023, 2024, 2025}}
PROF = {
    "dirigenti e intellettuali (1-2)": {"1", "2"},
    "tecniche (3)": {"3"},
    "ufficio, commercio e servizi (4-5)": {"4", "5"},
    "manuali (6-8)": {"6", "7", "8"},
}


def gruppo(area: str) -> str | None:
    for nome, codici in GRUPPI.items():
        if area in codici:
            return nome
    return None


def leggi() -> list[dict]:
    righe = []
    for f in sorted(glob.glob(str(DATI / "RCFL_20*_Q*.zip"))):
        z = zipfile.ZipFile(f)
        nome = next(n for n in z.namelist() if n.startswith("MICRODATI") and n.endswith(".txt"))
        for r in csv.DictReader(io.TextIOWrapper(z.open(nome), encoding="latin-1"), delimiter="\t"):
            if r["EDULEV"].strip() != "6" or r["QH04MCR"].strip() != "1":
                continue
            g = gruppo(r["HATFIELD_D"].strip())
            if g is None:
                continue
            anno, trim = int(r["ANNO"]), r["TRIM"].strip()
            righe.append({
                "anno": anno,
                "fam": f"{anno}-{trim}-{r['MCRFAM'].strip()}",
                "gruppo": g,
                "peso": float(r["COEF_CCP"]),
                "occ": r["COND3"].strip() == "1",
                "prof": r["PROF1"].strip(),
                "studia": r["EDUCFED4"].strip() == "1",
                "decile": int(r["INCDEC"]) if r.get("INCDEC", "").strip().isdigit() else None,
            })
    return righe


def misure(righe: list[dict]) -> dict:
    tot = sum(r["peso"] for r in righe)
    occ = [r for r in righe if r["occ"]]
    tocc = sum(r["peso"] for r in occ)
    out = {"occupati": sum(r["peso"] for r in occ) / tot if tot else float("nan")}
    for nome, codici in PROF.items():
        out[nome] = sum(r["peso"] for r in occ if r["prof"] in codici) / tocc if tocc else float("nan")
    # Retribuzione: decile della retribuzione lorda mensile (INCDEC), solo dipendenti che lo hanno.
    ret = [r for r in occ if r.get("decile")]
    tret = sum(r["peso"] for r in ret)
    out["decili bassi della retribuzione (1-3)"] = sum(r["peso"] for r in ret if r["decile"] <= 3) / tret if tret else float("nan")
    out["decile medio della retribuzione (in decimi)"] = sum(r["peso"] * r["decile"] for r in ret) / tret / 10 if tret else float("nan")
    return out


def bootstrap(righe: list[dict], n: int = 1000, seme: int = 1) -> dict:
    fam: dict[str, list[dict]] = {}
    for r in righe:
        fam.setdefault(r["fam"], []).append(r)
    chiavi = list(fam)
    rnd = random.Random(seme)
    repliche = []
    for _ in range(n):
        campione = [r for k in (rnd.choice(chiavi) for _ in chiavi) for r in fam[k]]
        repliche.append(misure(campione))
    ic = {}
    for m in repliche[0]:
        v = sorted(x[m] for x in repliche)
        ic[m] = (v[int(0.025 * n)], v[int(0.975 * n) - 1])
    return ic


def main() -> None:
    RISULTATI.mkdir(exist_ok=True)
    tutte = leggi()
    if not tutte:
        raise SystemExit(f"Nessun file in {DATI}: scaricali prima con python3 scarica_dati.py")
    tabella = []
    for universo, righe in (("non iscritti a un corso", [r for r in tutte if not r["studia"]]),
                            ("tutti", tutte)):
        tabella += tabelle(universo, righe)
    with open(RISULTATI / "risultati-laureati-recenti.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(tabella[0]))
        w.writeheader()
        w.writerows(tabella)
    for t in tabella:
        if t["periodo"] in PERIODI:
            print(f"{t['universo'][:10]:10s} {t['gruppo'][:32]:32s} {t['periodo']}  {t['misura'][:34]:34s} "
                  f"{100 * t['valore']:5.1f}%  [{100 * t['ic_basso']:5.1f}, {100 * t['ic_alto']:5.1f}]  "
                  f"n={t['osservazioni']} occ={t['occupati_osservati']}")


def tabelle(universo: str, righe: list[dict]) -> list[dict]:
    tabella = []
    for g in GRUPPI:
        for p, anni in PERIODI.items():
            sel = [r for r in righe if r["gruppo"] == g and r["anno"] in anni]
            m, ic = misure(sel), bootstrap(sel)
            occ = sum(1 for r in sel if r["occ"])
            for k in m:
                tabella.append({"universo": universo, "gruppo": g, "periodo": p, "misura": k, "valore": round(m[k], 4),
                                "ic_basso": round(ic[k][0], 4), "ic_alto": round(ic[k][1], 4),
                                "osservazioni": len(sel), "occupati_osservati": occ})
        for anno in range(2021, 2026):
            sel = [r for r in righe if r["gruppo"] == g and r["anno"] == anno]
            m = misure(sel)
            for k in m:
                tabella.append({"universo": universo, "gruppo": g, "periodo": str(anno), "misura": k, "valore": round(m[k], 4),
                                "ic_basso": "", "ic_alto": "", "osservazioni": len(sel),
                                "occupati_osservati": sum(1 for r in sel if r["occ"])})
    return tabella




def differenza_delle_differenze(righe: list[dict], esposto: str, confronto: str, n: int = 1000, seme: int = 2) -> dict:
    """(dopo - prima) nel gruppo esposto meno (dopo - prima) nel gruppo di confronto, con bootstrap
    per famiglia fatto separatamente in ciascuna delle quattro celle."""
    celle = {(g, p): [r for r in righe if r["gruppo"] == g and r["anno"] in anni]
             for g in (esposto, confronto) for p, anni in PERIODI.items()}

    def dd(c: dict) -> dict:
        m = {k: misure(v) for k, v in c.items()}
        pre, post = list(PERIODI)
        return {x: (m[(esposto, post)][x] - m[(esposto, pre)][x]) - (m[(confronto, post)][x] - m[(confronto, pre)][x])
                for x in m[(esposto, pre)]}

    stima = dd(celle)
    rnd = random.Random(seme)
    fam = {k: {} for k in celle}
    for k, v in celle.items():
        for r in v:
            fam[k].setdefault(r["fam"], []).append(r)
    repliche = []
    for _ in range(n):
        c = {}
        for k, d in fam.items():
            chiavi = list(d)
            c[k] = [r for kk in (rnd.choice(chiavi) for _ in chiavi) for r in d[kk]]
        repliche.append(dd(c))
    out = {}
    for x in stima:
        v = sorted(r[x] for r in repliche)
        out[x] = (stima[x], v[int(0.025 * n)], v[int(0.975 * n) - 1])
    return out


def scrivi_differenze() -> None:
    righe = [r for r in leggi() if not r["studia"]]
    out = []
    for g in ("ICT e ingegneria dell'informazione", "Economia, diritto, scienze sociali, lettere", "Altre aree"):
        for misura, (stima, lo, hi) in differenza_delle_differenze(righe, g, "Sanità e insegnamento").items():
            out.append({"gruppo": g, "confronto": "Sanità e insegnamento", "misura": misura,
                        "differenza_delle_differenze": round(stima, 4), "ic_basso": round(lo, 4), "ic_alto": round(hi, 4)})
    with open(RISULTATI / "differenze-laureati-recenti.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(out[0]))
        w.writeheader()
        w.writerows(out)


if __name__ == "__main__":
    main()
    scrivi_differenze()
