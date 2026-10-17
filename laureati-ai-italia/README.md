# Dove lavorano i laureati recenti italiani dopo ChatGPT

Un primo conto descrittivo sui microdati ad uso pubblico dell'Istat: i laureati con titolo da 0 a
2 anni, divisi per area di studio, lavorano più o meno di prima, sono pagati più o meno degli altri
dipendenti, e in quale grande gruppo professionale entrano? Confronto fra il 2021-2022 e il
2023-2025.

È il conto raccontato nell'articolo di Improve and Manage
[«Laureati e AI: in Italia, finora, nessun segno che entrino peggio nel lavoro»](https://www.improveandmanage.com/)
*(collegamento da aggiornare alla pubblicazione)*. Nasce come risposta italiana allo studio dello
U.S. Census Bureau [*Graduating into Disruption*](https://www.census.gov/library/working-papers/2026/adrm/CES-WP-26-56.html)
(CES Working Paper 26-56, settembre 2026).

## In breve

Fra i laureati recenti in informatica e ingegneria dell'informazione che non studiano più:

| Misura | 2021-2022 | Dopo ChatGPT |
|---|---|---|
| Occupati | 77,7% | 83,6% (2023-2025) |
| Dipendenti nei tre decili di retribuzione più bassi | 18,6% | 13,5% (solo 2023) |
| Occupati in professioni intellettuali | 63,4% | 61,4% (2023-2025) |

Rispetto al gruppo di confronto (sanità e insegnamento) nessuna differenza si distingue da zero.
Si esclude un peggioramento grande, non uno di pochi punti. Tabelle complete, intervalli al 95% e
limiti in [`nota-di-metodo.md`](nota-di-metodo.md) e nella cartella [`risultati/`](risultati/).

## Due limiti da conoscere prima di usare i numeri

- **Classificazione delle professioni.** Dal primo trimestre 2023 la rilevazione usa la CP2021 al
  posto della CP2011: il cambio cade sul confine del confronto, e per informatica la quota nelle
  professioni intellettuali fa un gradino proprio lì. Le misure più solide sono l'occupazione e la
  retribuzione.
- **Retribuzione.** Il decile della retribuzione lorda (INCDEC) viene dai registri amministrativi e
  l'Istat lo aggiunge con circa 18 mesi di ritardo: nei file scaricati a settembre 2026 c'è fino al
  2023.

## Come rifare il conto

Serve Python 3.10 o successivo, senza librerie esterne.

```bash
python3 scarica_dati.py            # circa 200 MB dal sito Istat, nella cartella dati/
python3 conto_laureati_recenti.py  # circa due minuti; scrive risultati/
```

I microdati **non** sono in questo repository: si scaricano dall'Istat, che chiede a chi li usa di
non tentare l'identificazione delle persone, di usarli per soli scopi statistici e di citare la
fonte. Se l'indirizzo di scaricamento cambia, i file sono sulla
[pagina dei microdati trimestrali](https://www.istat.it/microdati/rilevazione-sulle-forze-di-lavoro-dati-trasversali-trimestrali/).
Per usare file già scaricati altrove: `DATI_ISTAT=/percorso/dei/file python3 conto_laureati_recenti.py`.

## Fonte dei dati e responsabilità

Elaborazione di Improve and Manage su dati Istat, Rilevazione sulle forze di lavoro, file
mIcro.STAT ad uso pubblico, licenza Creative Commons Attribuzione. **Le analisi e le elaborazioni
sono di Improve and Manage e la responsabilità non è da attribuire all'Istat.**

## Licenze

- Codice: MIT, vedi [`LICENSE`](LICENSE).
- Risultati (cartella `risultati/`) e nota di metodo: Creative Commons Attribuzione 4.0
  Internazionale (CC BY 4.0), citando Improve and Manage e l'Istat come sopra.

## Commenti e correzioni

È un primo conto, non uno studio causale né rivisto da esterni. Segnalazioni di errori e proposte
di analisi più complete sono benvenute nelle *issue* di questo repository.
