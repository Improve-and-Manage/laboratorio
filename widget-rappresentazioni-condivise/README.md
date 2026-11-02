# Cinque esperimenti sulle rappresentazioni condivise

Questi widget accompagnano il primo articolo di una serie di Improve and Manage su JEPA,
rappresentazioni condivise e lettura interna delle reti neurali. Non eseguono un modello: isolano
cinque idee e permettono di manipolarle nel browser.

- **Che cosa resta in comune?** Confronta coppie costruite in tre modi. L'esempio chiarisce perché
  una coppia utile deve offrire due viste diverse dello stesso oggetto, non soltanto due frammenti
  vicini.
- **La stessa mappa, girata.** Sovrappone due costellazioni identiche a meno di una rotazione. È una
  ricostruzione didattica del criterio usato da
  [`prh-proof`](https://github.com/facebookresearch/prh-proof), non il risultato di una sua
  esecuzione.
- **La porta conta più della distanza.** Confronta la direzione più corta con un percorso che tiene
  conto della struttura dell'ambiente. Riprende il problema *Two Rooms* di
  [`eb_jepa`](https://github.com/facebookresearch/eb_jepa), con geometria e traiettorie ridisegnate.
- **Il concetto che cambia la risposta.** Ricostruisce l'esperimento pubblicato nel lavoro sul
  J-space: la Jacobian lens rende visibile `ragno`; lo scambio con `formica` cambia la risposta
  più probabile da 8 a 6. Non esegue il modello e non ricostruisce dati non pubblicati.
- **Togli un passaggio dal circuito.** Riduce a quattro nodi il sottografo Dallas documentato da
  Neuronpedia e permette di confrontare i tre esiti pubblicati. La fascia tratteggiata conserva
  visibile l'incompletezza della ricostruzione.

I punti, le frasi e le traiettorie sono dati sintetici e deterministici. Servono a spiegare un
meccanismo, non misurano le prestazioni dei progetti citati. I casi del J-space e di Dallas
ricostruiscono risultati attribuiti alle fonti, senza presentarli come esecuzioni nostre. Il codice è JavaScript puro, non usa
librerie, non invia dati e non fa richieste di rete.

## Provarli

Dalla radice del repository:

```bash
python3 -m http.server 8000
```

Aprire poi <http://127.0.0.1:8000/widget-rappresentazioni-condivise/anteprima.html>.

La pagina supporta tema chiaro e scuro, tastiera e `prefers-reduced-motion`. Gli stessi file
JavaScript e CSS sono copiati nel sito di Improve and Manage per essere caricati dall'articolo.

## Licenza

MIT, come il resto del repository.
