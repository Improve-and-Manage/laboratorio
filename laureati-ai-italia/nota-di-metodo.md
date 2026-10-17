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
  dal primo trimestre 2021 al secondo trimestre 2026 (22 trimestri). Prima del 2021 i file pubblici
  non hanno l'area disciplinare del titolo; dopo il 2020 la professione è solo a una cifra.
- **Chi:** titolo terziario (EDULEV = 6, che comprende anche ITS e diplomi AFAM) conseguito da 0 a
  2 anni (QH04MCR = 1), non iscritti a un corso di istruzione formale nelle 4 settimane precedenti
  (EDUCFED4). Pesi COEF_CCP.
- **Aree disciplinari (HATFIELD_D), raggruppate prima di guardare i risultati:** informatica e
  ingegneria industriale e dell'informazione (aree 009 «Informatica e tecnologie ICT» e 010
  «Ingegneria industriale e dell'informazione», le più vicine al decile più esposto del Census; negli
  script il gruppo si chiama ancora «ICT e ingegneria dell'informazione»); economia, diritto, scienze
  sociali, lettere (004-007, esposte per scrittura e analisi); sanità e insegnamento (002 e 013, le
  meno esposte, gruppo di confronto); altre aree (003, 008, 011, 012, 014).
- **Composizione del primo gruppo:** l'area 010, che nei file pubblici non separa l'ingegneria
  dell'informazione da quella industriale, pesa l'82,5% degli occupati del gruppo con i pesi Istat
  (1.465 delle 1.806 osservazioni occupate). I risultati del gruppo parlano soprattutto di ingegneri.
- **Misure:** quota di occupati; fra gli occupati, grande gruppo professionale (1-2 dirigenti e
  professioni intellettuali; 3 tecniche; 4-5 ufficio, commercio e servizi; 6-8 manuali).
- **Confronto:** 2021-2022 contro il periodo dal 2023 al secondo trimestre 2026 (per la
  retribuzione, il solo 2023), e differenza delle differenze rispetto a sanità e insegnamento. Intervalli al 95% con bootstrap per famiglia dentro ogni trimestre.

Codice: `conto_laureati_recenti.py` (2021-2025) e `conto_laureati_recenti_2026q2.py`, che riusa le
stesse funzioni ed estende il «dopo» al secondo trimestre 2026; risultati:
`risultati/risultati-laureati-recenti-2026q2.csv` e `risultati/differenze-laureati-recenti-2026q2.csv`
(i file senza suffisso sono quelli fermi al 2025).

## Primi risultati

Nelle colonne, «prima» è il 2021-2022 e «dopo» il periodo dal 2023 al secondo trimestre 2026.

| Laureati recenti non iscritti | Occupati prima | Occupati dopo | Intellettuali prima | Intellettuali dopo | Manuali prima | Manuali dopo | Osservazioni | Osservazioni occupate |
|---|---|---|---|---|---|---|---|---|
| Informatica e ingegneria industriale e dell'informazione | 77,7% | 83,0% | 63,4% | 61,3% | 2,5% | 5,0% | 878 e 1.358 | 675 e 1.131 |
| Economia, diritto, scienze sociali, lettere | 61,8% | 70,1% | 32,1% | 36,2% | 2,7% | 2,4% | 3.711 e 5.452 | 2.210 e 3.754 |
| Sanità e insegnamento | 78,0% | 82,0% | 42,4% | 43,4% | 1,6% | 1,3% | 1.764 e 2.655 | 1.382 e 2.192 |
| Altre aree | 64,3% | 67,3% | 50,3% | 43,1% | 3,6% | 5,3% | 2.067 e 3.073 | 1.248 e 2.051 |

Differenza delle differenze rispetto a sanità e insegnamento, in punti:

| Gruppo | Occupati | Intellettuali (1-2) | Tecniche (3) | Ufficio, commercio e servizi (4-5) | Manuali (6-8) |
|---|---|---|---|---|---|
| Informatica e ingegneria industriale e dell'informazione | +1,4 [-4,0; +6,6] | -3,1 [-10,4; +4,5] | +2,6 [-4,3; +9,6] | -2,1 [-5,9; +2,0] | +2,7 [+0,5; +4,8] |
| Economia, diritto, scienze sociali, lettere | +4,3 [+0,6; +8,6] | +3,2 [-2,0; +8,5] | -1,8 [-6,9; +3,3] | -1,4 [-5,2; +2,2] | -0,0 [-1,6; +1,4] |
| Altre aree | -1,0 [-5,2; +3,8] | -8,2 [-14,7; -1,9] | +6,7 [+0,7; +12,8] | +0,3 [-3,9; +4,3] | +1,9 [-0,0; +3,9] |

Fermando il «dopo» al 2025, i lavori manuali del primo gruppo davano +1,8 [-0,3; +3,6].

**Retribuzione.** I file pubblici hanno, per i dipendenti, il decile della retribuzione lorda
mensile (INCDEC), che non dipende dalla classificazione delle professioni. L'Istat lo ricava dai
registri amministrativi e lo aggiunge con circa 18 mesi di ritardo: c'è per tutti i dipendenti dal
2021 al 2023 e manca nel 2024, nel 2025 e nel 2026, quindi per questa misura il «dopo» è solo il 2023. Fra i laureati recenti
in informatica e ingegneria industriale e dell'informazione la quota nei decili 1-3 scende dal 18,6%
al 13,5%, il decile medio passa da 5,9 a 6,0; differenza delle differenze rispetto a sanità e
insegnamento: -2,6 punti [-10,5; +5,5] per i decili bassi, 0,0 decili [-0,5; +0,4] per il decile
medio (con i file fino al 2025 l'intervallo del decile medio era [-0,5; +0,5]: cambia solo il
ricampionamento, non la stima). 

**Lettura provvisoria.** Per i laureati recenti in informatica e ingegneria industriale e
dell'informazione non si vede l'ingresso al ribasso trovato negli Stati Uniti nell'occupazione,
nella retribuzione e nella quota in professioni intellettuali: l'occupazione cresce come negli altri
gruppi e la quota in professioni intellettuali non cambia in modo distinguibile. Gli intervalli però
escludono solo spostamenti grandi: un calo di qualche punto non si distinguerebbe da zero.

**Il segnale dei lavori manuali.** La quota nei lavori manuali (grandi gruppi 6-8) del primo gruppo
sta fra l'1,4% e il 4,2% in ciascun anno dal 2021 al 2025 (nei singoli trimestri fra lo 0,5% e
l'8,0%) e sale al 10,1% nel primo trimestre 2026 e al 16,6% nel secondo: 6 osservazioni su 67
occupate e 8 su 80, 14 in tutto, in parte forse le stesse persone intervistate due volte. Dodici
sono dell'area 010 e due dell'area 009; sette nel grande gruppo 6, una nel 7, cinque nell'8. Fra
tutti i laureati occupati di ogni anno di laurea la quota resta intorno al 3,7% anche nel 2026,
quindi non sembra un cambiamento generale di codifica; fra i laureati recenti sale nel 2026 in tutti
i gruppi, ma meno (economia 2,0% → 4,0%; sanità e insegnamento 1,5% → 3,9%; altre aree 6,5% →
12,7%). Va ricontrollato con il terzo trimestre 2026.

**Ventuno confronti.** Su 21 confronti (3 gruppi per 7 misure, sempre rispetto a sanità e
insegnamento) quattro hanno un intervallo che esclude lo zero; il caso da solo ne darebbe in media
uno. Oltre ai lavori manuali del primo gruppo: l'occupazione in economia e aree vicine (+4,3), e
nelle altre aree il passaggio dalle professioni intellettuali (-8,2) a quelle tecniche (+6,7), che
cade sul cambio di classificazione. Dentro le altre aree, in calcoli a parte che non fanno parte dei
21 confronti, la quota in professioni intellettuali scende in arte e design (dal 45,2% al 26,5%) e
nell'area agraria (dal 48,8% al 35,5%), che non ha una storia plausibile legata all'AI.

**Due osservazioni esplorative, da non leggere come risultati.** Fra tutti i laureati occupati, di
qualunque anno di laurea, la quota nelle sole professioni intellettuali (grande gruppo 2, senza i
dirigenti) resta ferma fra il 47,9% e il 48,9% dal 2021 al primo semestre 2026: non si vede un salto
di codifica nel 2023, quando entra in vigore la classificazione CP2021. Fra i laureati dell'area 009
(informatica) di qualunque anno, invece, quella quota scende dal 56,0% del 2021 al 45-47% del
2024-2025, e sale la quota nelle professioni tecniche; nel primo semestre 2026 risale al 51,5%. Il calo fa un
gradino proprio al passaggio alla CP2021 (primo trimestre 2023): può essere un cambiamento reale del
lavoro informatico o un effetto della nuova codifica, e con la professione a una cifra non si può
distinguere.

## Limiti

- **Cambio di classificazione sul confine.** La rilevazione passa dalla CP2011 alla CP2021 nel primo
  trimestre 2023, cioè esattamente fra il «prima» e il «dopo». Per i laureati in informatica la
  quota nel grande gruppo 2 fa un gradino proprio lì (dal 52,5% al 46,3% fra il quarto trimestre
  2022 e il primo 2023, laureati di ogni anno dell'area 009); per l'area 010 no (fra il 56% e il 64%
  in tutti i trimestri, senza un salto duraturo). Per questo la misura
  robusta è l'occupazione, e il grande gruppo professionale va letto con cautela.

- Professione solo a una cifra; nessuna retribuzione e nessun settore dettagliato nel file pubblico.
- «Titolo terziario» comprende ITS e AFAM; «0-2 anni» è una classe, non una data.
- Il «prima» (2021-2022) è ancora uscita dalla pandemia.
- Le stesse famiglie compaiono in trimestri successivi e non si collegano: intervalli un po' troppo
  stretti.
- I gruppi di aree sono una scelta ragionata, non un indice di esposizione misurato.
