/* Il duello dei vocabolari.
   Due tokenizzatori sulla stessa frase: uno addestrato sull'apertura dei
   Promessi sposi (BPE, 1177 fusioni, lo stesso corpus di prima), l'altro e'
   o200k_base, il tokenizzatore dei modelli OpenAI recenti. I due tagli non si
   calcolano qui: sono stati misurati una volta con tiktoken e con un BPE
   addestrato sul corpus, e stanno qui sotto come dati. Cosi' il widget non
   deve addestrare niente nel browser, e i numeri sono verificabili. */
const SFIDE = [{"t": "l'Illustrissimo ed Eccellentissimo Signore", "tipo": "manzoni", "nota": "Il vocabolario dei Promessi sposi conosce «Illustrissimo» e «Eccellentissimo» come pezzi interi: li ha letti decine di volte. Per OpenAI sono parole rare, da montare sillaba per sillaba.", "m": ["l'Illustrissimo", "ed", "Eccellentissimo", "Signor", "e"], "o": ["l", "'", "Illustr", "issimo", " ed", " E", "cc", "ellent", "issimo", " Sign", "ore"]}, {"t": "il modello di linguaggio produce token", "tipo": "oggi", "nota": "Qui si rovescia: nel Seicento di Manzoni non esistono «linguaggio automatico» né «token», e il vocabolario ottocentesco deve compitare lettera per lettera.", "m": ["il", "m", "o", "dello", "di", "l", "in", "gu", "aggio", "pro", "du", "ce", "t", "o", "k", "en"], "o": ["il", " modello", " di", " lingu", "aggio", " produce", " token"]}, {"t": "tra due catene non interrotte di monti", "tipo": "manzoni", "nota": "Sono le parole d'apertura del romanzo: il vocabolario le ha imparate tutte intere.", "m": ["tra", "due", "catene", "non", "interrotte", "di", "monti"], "o": ["tra", " due", " cat", "ene", " non", " inter", "rot", "te", " di", " mont", "i"]}, {"t": "Scarica l'applicazione e attiva le notifiche", "tipo": "oggi", "nota": "Parole che nel 1840 non esistevano. Il vocabolario manzoniano le sbriciola; quello di OpenAI, addestrato sul web di oggi, le conosce già.", "m": ["S", "c", "ar", "i", "ca", "l'", "app", "li", "ca", "zion", "e", "e", "att", "i", "va", "le", "no", "ti", "fi", "che"], "o": ["Scar", "ica", " l", "'app", "lic", "azione", " e", " att", "iva", " le", " notific", "he"]}, {"t": "don Abbondio, curato d'una delle terre", "tipo": "manzoni", "nota": "«don Abbondio» compare in ogni pagina del corpus: per il vocabolario è ormai una parola sola.", "m": ["don", "Abbondio,", "cur", "ato", "d'una", "delle", "terr", "e"], "o": ["don", " Abb", "ond", "io", ",", " cur", "ato", " d", "'una", " delle", " terre"]}, {"t": "Il preventivo del gestionale arriva domani", "tipo": "oggi", "nota": "L'italiano d'ufficio è lontano dal romanzo quanto l'inglese: esattamente il doppio dei token.", "m": ["Il", "pre", "v", "enti", "v", "o", "del", "g", "est", "i", "on", "ale", "ar", "riva", "d", "om", "an", "i"], "o": ["Il", " prevent", "ivo", " del", " gestion", "ale", " arriva", " dom", "ani"]}, {"t": "precipitevolissimevolmente", "tipo": "sorpresa", "nota": "La parola più lunga dell'italiano non è la più cara: entrambi la spezzano, perché nessuno dei due l'ha mai vista abbastanza spesso.", "m": ["pre", "ci", "pi", "t", "e", "vol", "i", "ssim", "e", "vol", "mente"], "o": ["prec", "ip", "ite", "vol", "issime", "vol", "mente"]}, {"t": "bravi", "tipo": "sorpresa", "nota": "Nei Promessi sposi i «bravi» sono ovunque, e infatti al vocabolario del romanzo basta un token solo. A OpenAI ne servono due.", "m": ["bravi"], "o": ["br", "avi"]}, {"t": "Quel ramo del lago di Como", "tipo": "manzoni", "nota": "Il pareggio: la frase più famosa del romanzo è fatta di parole comuni, che tutti e due i vocabolari conoscono bene.", "m": ["Quel", "ramo", "del", "lago", "di", "Com", "o"], "o": ["Quel", " ramo", " del", " lago", " di", " Como"]}];

const $ = (s) => document.querySelector(s);
const arena = $("#tk");
if (arena) {
  let giro = 0;

  const frase = $("#tk-frase");
  const bottone = $("#tk-scopri");
  const esito = $("#tk-esito");
  const verdetto = $("#tk-verdetto");
  const punteggio = $("#tk-punteggio");
  const rigaM = $("#tk-riga-m");
  const rigaO = $("#tk-riga-o");
  const contoM = $("#tk-conto-m");
  const contoO = $("#tk-conto-o");
  const pezziM = $("#tk-pezzi-m");
  const pezziO = $("#tk-pezzi-o");
  const nota = $("#tk-nota");

  const sfida = () => SFIDE[giro % SFIDE.length];

  /* I chip dei token. Lo spazio iniziale che il tokenizzatore di OpenAI tiene
     attaccato alla parola si vede: e' meta' della spiegazione. */
  const chip = (p) => {
    const s = document.createElement("span");
    s.className = "tk-chip";
    s.textContent = p.replace(/ /g, "\u00b7");
    return s;
  };

  const disegna = () => {
    const s = sfida();
    frase.textContent = s.t;
    svela();
  };

  const svela = () => {
    const s = sfida();
    const veroO = s.o.length;
    const veroM = s.m.length;
    const largo = Math.max(veroM, veroO);

    pezziM.replaceChildren(...s.m.map(chip));
    pezziO.replaceChildren(...s.o.map(chip));
    contoM.textContent = veroM;
    contoO.textContent = veroO;
    rigaM.style.setProperty("--quota", (veroM / largo) * 100 + "%");
    rigaO.style.setProperty("--quota", (veroO / largo) * 100 + "%");
    rigaM.dataset.vince = String(veroM < veroO);
    rigaO.dataset.vince = String(veroO < veroM);

    const scarto = Math.abs(veroM - veroO);
    const quante = (n) => n + (n === 1 ? " token" : " token");
    verdetto.textContent =
      veroM === veroO
        ? "Pareggio: " + quante(veroM) + " per tutti e due."
        : veroM < veroO
          ? "Vince il vocabolario dei Promessi sposi: " +
            quante(veroM) + " contro " + veroO + ", " + scarto + " in meno."
          : "Vince il vocabolario di OpenAI: " +
            quante(veroO) + " contro " + veroM + ", " + scarto + " in meno.";
    nota.textContent = s.nota;
    punteggio.textContent =
      "Sfida " + ((giro % SFIDE.length) + 1) + " di " + SFIDE.length;

    esito.hidden = false;
  };

  bottone.addEventListener("click", () => {
    giro += 1;
    disegna();
  });

  disegna();
}
