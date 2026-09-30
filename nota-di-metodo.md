# Dove lavorano i laureati recenti italiani dopo ChatGPT: un primo conto

Nota di metodo. Improve and Manage, settembre 2026.

## La domanda

Negli Stati Uniti uno studio del Census Bureau (Orr, Tucker e Warren, CES WP 26-56, settembre 2026)
trova che dopo ChatGPT i laureati dei corsi più esposti all'AI trovano lavoro meno spesso subito e,
quando lo trovano, entrano più spesso in settori che pagano meno. In Italia nessuno ha fatto lo
stesso conto. Questa nota prova una prima versione con dati pubblici: **i laureati recenti delle
aree più esposte entrano più spesso di prima in professioni meno qualificate?**

## Dati e universo

- **Fonte:** Istat, Rilevazione sulle forze di lavoro, file mIcro.STAT trimestrali ad uso pubblico,
  dal primo trimestre 2021 al quarto trimestre 2025 (20 trimestri). Prima del 2021 i file pubblici
  non hanno l'area disciplinare del titolo; dopo il 2020 la professione è solo a una cifra.
- **Chi:** titolo terziario (EDULEV = 6, che comprende anche ITS e diplomi AFAM) conseguito da 0 a
  2 anni (QH04MCR = 1), non iscritti a un corso di istruzione formale nelle 4 settimane precedenti
  (EDUCFED4). Pesi COEF_CCP.
- **Aree disciplinari (HATFIELD_D), raggruppate prima di guardare i risultati:** ICT e ingegneria
  dell'informazione (le più vicine al decile più esposto del Census); economia, diritto, scienze
  sociali, lettere (esposte per scrittura e analisi); sanità e insegnamento (le meno esposte, gruppo
  di confronto); altre aree.
- **Misure:** quota di occupati; fra gli occupati, grande gruppo professionale (1-2 dirigenti e
  professioni intellettuali; 3 tecniche; 4-5 ufficio, commercio e servizi; 6-8 manuali).
- **Confronto:** 2021-2022 contro 2023-2025, e differenza delle differenze rispetto a sanità e
  insegnamento. Intervalli al 95% con bootstrap per famiglia dentro ogni trimestre.

Codice: `conto_laureati_recenti.py`; risultati: `risultati/risultati-laureati-recenti.csv` e
`risultati/differenze-laureati-recenti.csv`.

## Primi risultati

| Laureati recenti non iscritti | Occupati 2021-22 | Occupati 2023-25 | Intellettuali 2021-22 | Intellettuali 2023-25 | Osservazioni occupate |
|---|---|---|---|---|---|
| ICT e ingegneria dell'informazione | 77,7% | 83,6% | 63,4% | 61,4% | 675 e 984 |
| Economia, diritto, scienze sociali, lettere | 61,8% | 70,1% | 32,1% | 35,5% | 2.210 e 3.306 |
| Sanità e insegnamento | 78,0% | 81,9% | 42,4% | 43,3% | 1.382 e 1.882 |
| Altre aree | 64,3% | 67,9% | 50,3% | 42,9% | 1.248 e 1.833 |

Differenza delle differenze rispetto a sanità e insegnamento, in punti:

| Gruppo | Occupati | Intellettuali (1-2) | Ufficio, commercio e servizi (4-5) |
|---|---|---|---|
| ICT e ingegneria dell'informazione | +2,0 [-3,3; +7,2] | -3,0 [-10,3; +4,2] | -1,6 [-5,6; +2,7] |
| Economia, diritto, scienze sociali, lettere | +4,4 [+0,2; +8,7] | +2,5 [-2,4; +7,9] | +0,2 [-3,6; +4,0] |
| Altre aree | -0,3 [-4,7; +4,5] | -8,3 [-14,7; -2,1] | +1,7 [-2,6; +5,8] |

**Retribuzione.** I file pubblici hanno, per i dipendenti, il decile della retribuzione lorda
mensile (INCDEC), che non dipende dalla classificazione delle professioni. L'Istat lo ricava dai
registri amministrativi e lo aggiunge con circa 18 mesi di ritardo: c'è per tutti i dipendenti dal
2021 al 2023 e manca nel 2024 e nel 2025, quindi per questa misura il «dopo» è solo il 2023. Fra i laureati recenti
in ICT e ingegneria dell'informazione la quota nei decili 1-3 scende dal 18,6% al 13,5%, il decile
medio passa da 5,9 a 6,0; differenza delle differenze rispetto a sanità e insegnamento: -2,6 punti
[-10,5; +5,5] per i decili bassi, 0,0 decili [-0,5; +0,5] per il decile medio. 

**Lettura provvisoria.** Per i laureati recenti in ICT e ingegneria dell'informazione non si vede
l'ingresso al ribasso trovato negli Stati Uniti: l'occupazione cresce come negli altri gruppi e la
quota in professioni intellettuali non cambia in modo distinguibile. Gli intervalli però escludono
solo spostamenti grandi: un calo di qualche punto non si distinguerebbe da zero. L'unico cambiamento
con un intervallo che esclude lo zero è nelle «altre aree», e viene da arte e design (dal 45% al 27%
in professioni intellettuali) e dall'area agraria (dal 49% al 33%); su quindici confronti uno può
uscire così per caso, e l'area agraria non ha una storia plausibile legata all'AI.

**Due osservazioni esplorative, da non leggere come risultati.** Fra tutti i laureati occupati, di
qualunque anno di laurea, la quota nelle professioni intellettuali resta ferma fra il 47,9% e il
48,7% dal 2021 al 2025: non si vede un salto di codifica nel 2023, quando entra in vigore la
classificazione CP2021. Fra i laureati in informatica di qualunque anno, invece, quella quota scende
dal 56,0% del 2021 al 45-47% del 2024-2025, e sale la quota nelle professioni tecniche. Il calo fa un
gradino proprio al passaggio alla CP2021 (primo trimestre 2023): può essere un cambiamento reale del
lavoro informatico o un effetto della nuova codifica, e con la professione a una cifra non si può
distinguere.

## Limiti

- **Cambio di classificazione sul confine.** La rilevazione passa dalla CP2011 alla CP2021 nel primo
  trimestre 2023, cioè esattamente fra il «prima» e il «dopo». Per i laureati in informatica la
  quota in professioni intellettuali fa un gradino proprio lì (dal 52,5% al 46,3% fra il quarto
  trimestre 2022 e il primo 2023, laureati di ogni anno); per ingegneria no. Per questo la misura
  robusta è l'occupazione, e il grande gruppo professionale va letto con cautela.

- Professione solo a una cifra; nessuna retribuzione e nessun settore dettagliato nel file pubblico.
- «Titolo terziario» comprende ITS e AFAM; «0-2 anni» è una classe, non una data.
- Il «prima» (2021-2022) è ancora uscita dalla pandemia.
- Le stesse famiglie compaiono in trimestri successivi e non si collegano: intervalli un po' troppo
  stretti.
- I gruppi di aree sono una scelta ragionata, non un indice di esposizione misurato.
