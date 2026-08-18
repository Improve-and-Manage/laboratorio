/* La segmentatrice del pezzo sul tokenizzatore. Tre passi: un corpus fisso,
   una tabella di fusioni imparata dal corpus (la scala dalle lettere alle
   parole: la regola sceglie i gradini, il cursore quanti salirne), e la frase
   del lettore che viene soltanto codificata con quella tabella. Tre regole:
   BPE a caratteri, BPE sui byte (base di 256 valori, come GPT-2), regola
   WordPiece (coppia più frequente in rapporto ai suoi pezzi). JavaScript
   puro, zero dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("em-widget");
  if (!radice || radice.dataset.emAvviato) return;
  radice.dataset.emAvviato = "1";
  const campo = document.getElementById("em-frase");
  const cursore = document.getElementById("em-fusioni");
  const elFusioni = document.getElementById("em-fusioni-v");
  const elBase = document.getElementById("em-base");
  const elVoci = document.getElementById("em-voci");
  const elPezzi = document.getElementById("em-pezzi");
  const elStato = document.getElementById("em-stato");
  const elSpiega = document.getElementById("em-regola-spiega");
  const elBaseSpiega = document.getElementById("em-base-spiega");
  const elBaseLista = document.getElementById("em-base-lista");
  const boxFusioni = document.getElementById("em-fusioni-box");
  const elFusioniSpiega = document.getElementById("em-fusioni-spiega");
  const elFusioniLista = document.getElementById("em-fusioni-lista");
  const corpo = document.getElementById("em-corpus");
  if (!campo || !cursore || !elFusioni || !elPezzi || !elStato || !corpo) return;

  /* ---- il corpus: l'apertura del primo capitolo dei Promessi sposi.
     Apostrofi e virgolette si normalizzano - il markdown li rende
     tipografici, la tastiera li scrive dritti: qui sono la stessa cosa ---- */
  const normalizza = (t) => t.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
  const CORPUS = normalizza(corpo.textContent);

  /* Le parole si separano tenendo la punteggiatura per sé: l'apostrofo di
     «ch'i'» conta come segno, non come lettera. Maiuscole e minuscole restano
     distinte; gli spazi delimitano le parole e non diventano token. */
  const separa = (testo) =>
    testo.match(/[\p{L}\p{M}]+|\p{N}+|[^\s\p{L}\p{M}\p{N}]/gu) || [];

  /* Nella regola sui byte ogni parola diventa la fila dei suoi byte UTF-8,
     tenuti come caratteri latin-1 così il codice delle fusioni resta uguale. */
  const codificaByte = new TextEncoder();
  const decodificaByte = new TextDecoder("utf-8", { fatal: true });
  const inByte = (parola) =>
    [...codificaByte.encode(parola)].map((b) => String.fromCharCode(b));

  /* ---- l'addestramento della tabella, una fusione alla volta.
     Il tetto sta sopra la convergenza di tutte le regole su questo corpus
     (BPE a caratteri 2.059, sui byte 2.066, WordPiece 3.626): ogni regola
     si ferma da sola quando ogni parola è un pezzo unico, e la tappa
     «tutte · parole intere» dice il vero con qualunque regola. ---- */
  const MAX = 4000;
  function fondi(pezzi, a, b) {
    const esito = [];
    for (let i = 0; i < pezzi.length; i++) {
      if (i + 1 < pezzi.length && pezzi[i] === a && pezzi[i + 1] === b) {
        esito.push(a + b); i++;
      } else esito.push(pezzi[i]);
    }
    return esito;
  }
  function addestra(nome) {
    const frequenza = new Map();
    for (const p of separa(CORPUS)) frequenza.set(p, (frequenza.get(p) || 0) + 1);
    const parole = [...frequenza].map(([p, f]) => ({
      pezzi: nome === "byte" ? inByte(p) : [...p],
      f,
    }));
    const lettere = new Set();
    if (nome === "byte") {
      for (let b = 0; b < 256; b++) lettere.add(String.fromCharCode(b));
    } else {
      for (const p of parole) for (const c of p.pezzi) lettere.add(c);
    }
    const fusioni = [];
    for (let k = 0; k < MAX; k++) {
      const coppie = new Map();
      const unita = nome === "wordpiece" ? new Map() : null;
      for (const parola of parole) {
        const pezzi = parola.pezzi;
        if (unita) for (const u of pezzi) unita.set(u, (unita.get(u) || 0) + parola.f);
        for (let i = 0; i + 1 < pezzi.length; i++) {
          const chiave = pezzi[i] + " " + pezzi[i + 1];
          coppie.set(chiave, (coppie.get(chiave) || 0) + parola.f);
        }
      }
      /* BPE: vince la coppia più frequente. WordPiece: vince la coppia più
         frequente in rapporto alla frequenza dei suoi due pezzi, così una
         coppia rara ma inseparabile batte una coppia di pezzi comunissimi.
         A parità di punteggio decide la frequenza. */
      let migliore = null, punteggioMax = -1, quanteMax = 0;
      for (const [chiave, n] of coppie) {
        let punteggio = n;
        if (unita) {
          const t = chiave.indexOf(" ");
          punteggio = n / (unita.get(chiave.slice(0, t)) * unita.get(chiave.slice(t + 1)));
        }
        if (punteggio > punteggioMax ||
            (punteggio === punteggioMax && n > quanteMax)) {
          punteggioMax = punteggio; quanteMax = n; migliore = chiave;
        }
      }
      if (!migliore) break;                    // ogni voce è ormai un pezzo solo
      const taglio = migliore.indexOf(" ");
      const a = migliore.slice(0, taglio), b = migliore.slice(taglio + 1);
      fusioni.push({ a, b });
      for (const parola of parole) parola.pezzi = fondi(parola.pezzi, a, b);
    }
    return { fusioni, lettere };
  }

  const numero = (n) => n.toLocaleString("it-IT");

  /* La voce dell'esperto: una frase per regola, mostrata sotto i bottoni.
     Dice da dove parte la scala e come sceglie i gradini. */
  const SPIEGHE = {
    caratteri: "Si parte dalle singole lettere; a ogni gradino si salda la coppia adiacente più frequente del corpus. In cima alla lista, le parole intere.",
    byte: "Si parte dai 256 valori possibili di un byte, così nulla è mai sconosciuto; le accentate però partono in due byte. I gradini: sempre la coppia più frequente.",
    wordpiece: "Stessa scala dalle lettere alle parole, ma vince la coppia più frequente in rapporto ai suoi pezzi: le coppie che vivono solo insieme salgono per prime.",
  };

  /* Le regole si addestrano alla prima richiesta e restano in memoria. */
  const ricette = new Map();
  let ricetta = "caratteri";
  function attiva(nome) {
    ricetta = nome;
    if (!ricette.has(nome)) ricette.set(nome, addestra(nome));
    const r = ricette.get(nome);
    cursore.max = String(r.fusioni.length);
    if (parseInt(cursore.value, 10) > r.fusioni.length) {
      cursore.value = String(r.fusioni.length);
    }
    if (elSpiega) elSpiega.textContent = SPIEGHE[nome];
    /* I segni di partenza si spiegano mostrandoli: l'alfabeto del corpus
       nelle regole a caratteri, la base fissa dei byte nell'altra. */
    if (elBaseSpiega) {
      elBaseSpiega.textContent = nome === "byte"
        ? "I 256 valori possibili di un byte, che compaiano o no nel corpus: " +
          "qualunque testo è fatto solo di questi. Con zero fusioni ogni token " +
          "è un singolo byte, e una lettera accentata ne occupa due."
        : "L'alfabeto del corpus: i " + numero(r.lettere.size) + " segni distinti " +
          "che vi compaiono - lettere minuscole e maiuscole, accentate, cifre e " +
          "punteggiatura. Con zero fusioni ogni token è uno di questi.";
    }
    if (elBaseLista) {
      elBaseLista.textContent = "";
      elBaseLista.hidden = nome === "byte";
      if (nome !== "byte") {
        for (const s of [...r.lettere].sort((a, b) => a.localeCompare(b, "it"))) {
          const chip = document.createElement("span");
          chip.className = "em-pezzo";
          chip.textContent = s;
          elBaseLista.appendChild(chip);
        }
      }
    }
    return r;
  }
  attiva(ricetta);

  /* ---- la segmentazione di una frase con le prime k fusioni ---- */
  function segmenta(parola, k, fusioni) {
    let pezzi = ricetta === "byte" ? inByte(parola) : [...parola];
    for (let i = 0; i < k && pezzi.length > 1; i++) {
      pezzi = fondi(pezzi, fusioni[i].a, fusioni[i].b);
    }
    return pezzi;
  }

  /* Un token della regola sui byte si mostra come testo se i suoi byte
     formano una sequenza UTF-8 completa; altrimenti come byte in esadecimale,
     che è il modo onesto di far vedere una lettera accentata tagliata in due. */
  function aspettoDelPezzo(pezzo) {
    if (ricetta !== "byte") return { testo: pezzo, grezzo: false };
    const byte = Uint8Array.from([...pezzo].map((c) => c.charCodeAt(0)));
    try {
      return { testo: decodificaByte.decode(byte), grezzo: false };
    } catch {
      return {
        testo: [...byte].map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" "),
        grezzo: true,
      };
    }
  }

  /* ---- il disegno ---- */
  function mostra() {
    const r = ricette.get(ricetta);
    const fusioni = r.fusioni;
    const simboli = r.lettere;
    const k = Math.min(fusioni.length, Math.max(0, parseInt(cursore.value, 10) || 0));
    const frase = normalizza(campo.value);
    elFusioni.textContent = numero(k);
    if (elBase) elBase.textContent = numero(simboli.size);
    if (elVoci) elVoci.textContent = numero(simboli.size + k);

    const parole = separa(frase);
    const sconosciuti = new Set();
    const fresca = k > 0 ? fusioni[k - 1].a + fusioni[k - 1].b : null;
    elPezzi.textContent = "";
    let conto = 0;
    for (const parola of parole) {
      for (const pezzo of segmenta(parola, k, fusioni)) {
        const chip = document.createElement("span");
        const ignoto = [...pezzo].some((segno) => !simboli.has(segno));
        const aspetto = aspettoDelPezzo(pezzo);
        chip.className = ignoto ? "em-pezzo em-pezzo--sconosciuto" : "em-pezzo";
        if (aspetto.grezzo) chip.className += " em-pezzo--byte";
        if (!ignoto && pezzo === fresca) chip.className += " em-pezzo--nuovo";
        chip.textContent = aspetto.testo;
        if (ignoto) {
          chip.title = "Segno assente dal corpus di addestramento";
          for (const segno of [...pezzo]) if (!simboli.has(segno)) sconosciuti.add(segno);
        }
        if (aspetto.grezzo) chip.title = "Byte di una sequenza UTF-8 ancora da ricomporre";
        elPezzi.appendChild(chip);
        conto++;
      }
    }
    if (!conto) {
      elPezzi.textContent = "Scrivete una frase qui sopra.";
      elPezzi.className = "em-pezzi em-vuoto";
    } else {
      elPezzi.className = "em-pezzi";
    }

    const segniFrase = parole.reduce(
      (s, p) => s + (ricetta === "byte" ? codificaByte.encode(p).length : [...p].length),
      0,
    );
    const unitaIniziali = ricetta === "byte" ? "byte" : (segniFrase === 1 ? "segno" : "segni");
    elStato.textContent = conto
      ? "La frase richiede " + numero(conto) + " token invece di " +
        numero(segniFrase) + " " + unitaIniziali + " iniziali." +
        (sconosciuti.size ? " Restano fuori dal vocabolario: " + [...sconosciuti].join(" ") + "." : "")
      : "Scrivete una frase e muovete il cursore.";

    /* Le fusioni applicate si spiegano mostrando le ultime righe della
       tabella arrivate sotto il cursore, dalla più recente. Si aggiorna
       solo a ripiegabile aperto: dieci nodi, nessun peso. */
    if (boxFusioni && boxFusioni.open && elFusioniSpiega && elFusioniLista) {
      elFusioniSpiega.textContent = k
        ? "Le prime " + numero(k) + " righe della tabella imparata dal corpus: " +
          "ogni riga salda una coppia di pezzi in un pezzo nuovo, che diventa " +
          "una voce del vocabolario. Qui sotto le ultime applicate, dalla più recente."
        : "Il cursore è a zero: nessuna fusione applicata, e ogni token resta " +
          "un segno di partenza.";
      elFusioniLista.textContent = "";
      for (const f of fusioni.slice(Math.max(0, k - 10), k).reverse()) {
        const voce = document.createElement("span");
        voce.className = "em-pezzo";
        voce.textContent = f.a + " + " + f.b + " → " + f.a + f.b;
        elFusioniLista.appendChild(voce);
      }
    }

  }

  let attesa = null;
  const rimanda = () => {
    if (attesa) cancelAnimationFrame(attesa);
    attesa = requestAnimationFrame(() => { attesa = null; mostra(); });
  };
  campo.addEventListener("input", rimanda);
  cursore.addEventListener("input", rimanda);
  if (boxFusioni) boxFusioni.addEventListener("toggle", () => { if (boxFusioni.open) mostra(); });
  for (const b of radice.querySelectorAll(".em-regola")) {
    b.addEventListener("click", () => {
      for (const x of radice.querySelectorAll(".em-regola")) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      }
      attiva(b.dataset.ricetta);
      mostra();
    });
  }

  mostra();
})();
