# Dove lavorano i laureati recenti italiani dopo ChatGPT

Una prima analisi descrittiva sui microdati ad uso pubblico dell'Istat. Le domande sono tre: i
laureati con titolo da 0 a 2 anni, divisi per area di studio, lavorano più o meno di prima? Sono
pagati più o meno degli altri dipendenti? In quale grande gruppo professionale entrano? Il
confronto è fra il 2021-2022 e il periodo che va dal 2023 al secondo trimestre 2026.

L'analisi accompagna un articolo di Improve and Manage in preparazione. Nasce come risposta
italiana allo studio dello U.S. Census Bureau
[*Graduating into Disruption*](https://www.census.gov/library/working-papers/2026/adrm/CES-WP-26-56.html)
(CES Working Paper 26-56, settembre 2026).

## In breve

Fra i laureati recenti in informatica e ingegneria industriale e dell'informazione che non studiano
più:

| Misura | 2021-2022 | Dopo ChatGPT |
|---|---|---|
| Occupati | 77,7% | 83,0% (2023 - secondo trimestre 2026) |
| Dipendenti nei tre decili di retribuzione più bassi | 18,6% | 13,5% (solo 2023) |
| Occupati in professioni intellettuali | 63,4% | 61,3% (2023 - secondo trimestre 2026) |
| Occupati in lavori manuali | 2,5% | 5,0% (2023 - secondo trimestre 2026) |

Il gruppo comprende le aree 009 «Informatica e tecnologie ICT» e 010 «Ingegneria industriale e
dell'informazione» della classificazione Istat. Nei file pubblici l'area 010 non separa
l'ingegneria dell'informazione da quella industriale e pesa per l'82,5% degli occupati del gruppo:
i risultati parlano soprattutto di ingegneri. Negli script e nei CSV il gruppo conserva il vecchio
nome, «ICT e ingegneria dell'informazione».

Rispetto al gruppo di confronto (sanità e insegnamento), l'occupazione, la retribuzione e la quota
nelle professioni intellettuali non cambiano in modo distinguibile da zero: gli intervalli
escludono un peggioramento grande, non uno di pochi punti. Fa eccezione la quota nei lavori
manuali, che cresce di 2,7 punti più che nel gruppo di confronto, con un intervallo al 95% da +0,5
a +4,8. Fermando il «dopo» al 2025 la stessa differenza era di +1,8 punti e non si distingueva da
zero: il salto viene dal primo semestre 2026, dove i laureati del gruppo nei lavori manuali sono 14
osservazioni. Va ricontrollato con il terzo trimestre 2026. Tabelle complete, intervalli e limiti
sono nella [nota di metodo](nota-di-metodo.md) e nella cartella [`risultati/`](risultati/).

## Due limiti da conoscere prima di usare i numeri

- **Classificazione delle professioni.** Dal primo trimestre 2023 la rilevazione usa la
  classificazione CP2021 al posto della CP2011. Il cambio cade proprio sul confine del confronto, e
  per informatica la quota nelle professioni intellettuali fa un gradino in quel punto. Le misure
  più solide sono l'occupazione e la retribuzione.
- **Retribuzione.** Il decile della retribuzione lorda (la variabile INCDEC) viene dai registri
  amministrativi, e l'Istat lo aggiunge con circa 18 mesi di ritardo: nei file disponibili c'è fino
  al 2023. Per la retribuzione il «dopo» è quindi il solo 2023.

## Come rifare l'analisi

Serve Python 3.10 o successivo, senza librerie esterne.

```bash
python3 scarica_dati.py                       # circa 220 MB dal sito Istat, nella cartella dati/
python3 conto_laureati_recenti_2026q2.py      # fino al secondo trimestre 2026
python3 conto_laureati_recenti.py             # la prima versione, ferma al 2025
```

Il primo programma di analisi scrive in `risultati/` i file con il suffisso `-2026q2`; il secondo
riscrive i file senza suffisso, quelli fermi al 2025. Ciascuno richiede qualche minuto.

I microdati **non** sono in questo repository: si scaricano dall'Istat con `scarica_dati.py`.
L'Istat chiede a chi li usa di non tentare l'identificazione delle persone, di usarli per soli
scopi statistici e di citare la fonte. Il 2026 è ancora incompleto: `scarica_dati.py` scarica i
trimestri già pubblicati e si ferma al primo che manca, senza errore. Con `--elenco` mostra i file
e gli indirizzi senza scaricare niente. Se l'indirizzo di scaricamento cambia, i file sono sulla
[pagina dei microdati trimestrali](https://www.istat.it/microdati/rilevazione-sulle-forze-di-lavoro-dati-trasversali-trimestrali/).
Per usare file già scaricati altrove, la variabile `DATI_ISTAT` indica la cartella:
`DATI_ISTAT=/percorso/dei/file python3 conto_laureati_recenti_2026q2.py`.

## Fonte dei dati e responsabilità

Elaborazione di Improve and Manage su dati Istat, Rilevazione sulle forze di lavoro, file
mIcro.STAT ad uso pubblico, licenza Creative Commons Attribuzione. **Le analisi e le elaborazioni
sono di Improve and Manage e la responsabilità non è da attribuire all'Istat.**

## Licenze

- Codice: MIT, vedi [`LICENSE`](LICENSE).
- Risultati (cartella `risultati/`) e nota di metodo: Creative Commons Attribuzione 4.0
  Internazionale (CC BY 4.0), citando Improve and Manage e l'Istat come sopra.

## Commenti e correzioni

È una prima analisi descrittiva: non è uno studio causale e non è stata rivista da esterni.
Segnalazioni di errori e proposte di analisi più complete sono benvenute.
