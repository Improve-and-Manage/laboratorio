/* Il widget dell'attenzione: la frase di casa dell'articolo - «il gatto
   morde il cane» - e le frasi del lettore. Una parola fa la domanda e
   guarda le altre: punteggi, softmax e somma pesata dei valori, come nel
   calcolo del pezzo. Per la frase di casa, con la domanda sull'ultima
   parola, i numeri sono quelli dell'articolo; per ogni altra frase sono
   una simulazione dichiarata. JavaScript puro, zero dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("at-widget");
  if (!radice || radice.dataset.atAvviato) return;
  radice.dataset.atAvviato = "1";
  const frase = document.getElementById("at-frase");
  const applica = document.getElementById("at-applica");
  const parole = document.getElementById("at-parole");
  const stato = document.getElementById("at-stato");
  const pesi = document.getElementById("at-pesi");
  const somma = document.getElementById("at-somma");
  const maschera = document.getElementById("at-maschera");
  if (!frase || !applica || !parole || !stato || !pesi || !somma || !maschera) return;

  /* I numeri dell'articolo, verificati sulla figura del pezzo. */
  const FRASE_CASA = "il gatto morde il cane";
  const NUMERI = {
    punteggi: [0.2, 1.1, 2.3, 0.4, 0.9],
    pesi: [0.07, 0.17, 0.55, 0.08, 0.13],
    valori: [[0.1, 0.0, 0.2], [0.6, -0.2, 0.1], [-0.1, 0.8, 0.3], [0.2, 0.1, 0.1], [0.5, -0.1, 0.4]],
    uscita: [0.14, 0.4, 0.26],
  };

  /* ---- la frase corrente e la domanda ---- */
  let token = [];                 // le parole, minuscole
  let domanda = -1;               // l'indice della parola che fa la domanda

  function tokenizza(t) {
    return t.trim().split(/\s+/).filter(Boolean).map((p) => p.toLowerCase());
  }

  /* ---- la simulazione per le frasi nuove: vettori fittizi per ruolo ---- */
  const RUOLI = {
    articolo: ["il", "lo", "la", "i", "gli", "le", "un", "uno", "una"],
    preposizione: ["di", "a", "da", "in", "con", "su", "per", "tra", "fra"],
    pronome: ["io", "tu", "lui", "lei", "noi", "voi", "loro", "che", "chi", "mi", "ti", "si", "ci", "vi"],
    verbo: ["morde", "corre", "mangia", "legge", "scrive", "ama", "vede", "dorme", "beve", "cammina", "parla", "gioca", "sa", "vuole", "può", "dice", "fa", "ha", "è", "sono", "era", "erano"],
  };
  const BASE = {
    articolo: [0.15, 0.1, 0.1],
    preposizione: [0.3, 0.2, 0.35],
    pronome: [0.5, 0.3, 0.5],
    verbo: [0.85, 0.45, 0.2],
    nome: [0.5, 0.85, 0.4],
  };
  function ruolo(p) {
    for (const [r, lista] of Object.entries(RUOLI)) if (lista.includes(p)) return r;
    return "nome";
  }
  function hash(p) {
    let h = 0;
    for (let i = 0; i < p.length; i++) h = (h * 31 + p.charCodeAt(i)) | 0;
    return (h >>> 0) / 4294967295;
  }
  /* Il vettore fittizio di una parola: la base del suo ruolo piu' un
     rumore deterministico, perche' due nomi non siano identici. */
  function vettoreParola(p) {
    const b = BASE[ruolo(p)];
    const r = hash(p);
    const v = [
      b[0] + (r - 0.5) * 0.5,
      b[1] + (((r * 7919) | 0) % 1000 / 1000 - 0.5) * 0.5,
      b[2] + (((r * 104729) | 0) % 1000 / 1000 - 0.5) * 0.5,
    ];
    const n = Math.hypot(v[0], v[1], v[2]) || 1;
    return v.map((x) => x / n);
  }

  /* ---- il calcolo ---- */
  function casoArticolo() {
    return token.length === 5 && domanda === 4 && token.join(" ") === FRASE_CASA;
  }
  function calcola() {
    // la frase di casa, con la domanda sull'ultima parola: i numeri del pezzo
    if (casoArticolo()) {
      const n = token.length;
      const punteggi = NUMERI.punteggi.slice();
      const pesiV = NUMERI.pesi.slice();
      const valori = NUMERI.valori.map((v) => v.slice());
      const uscita = NUMERI.uscita.slice();
      const m = maschera.checked;
      if (m) {
        // col futuro escluso cambierebbe anche l'articolo: lo si dice, non si finge
        return { punteggi, pesi: pesiV, valori, uscita, articolo: true, mascherata: m };
      }
      return { punteggi, pesi: pesiV, valori, uscita, articolo: true, mascherata: false };
    }
    // le altre frasi: simulazione dichiarata
    const vettori = token.map(vettoreParola);
    const vDom = vettori[domanda];
    const punteggi = token.map((p, j) => {
      const v = vettori[j];
      const dot = vDom[0] * v[0] + vDom[1] * v[1] + vDom[2] * v[2];
      return (dot + 1) * 1.5;                       // da [-1,1] a [0,3]
    });
    const mascherata = maschera.checked;
    if (mascherata) for (let j = domanda + 1; j < token.length; j++) punteggi[j] = -Infinity;
    let max = -Infinity;
    for (const p of punteggi) if (p > max) max = p;
    let sommaE = 0;
    const esponenziali = punteggi.map((p) => {
      const e = p === -Infinity ? 0 : Math.exp(p - max);
      sommaE += e;
      return e;
    });
    const pesiV = esponenziali.map((e) => e / sommaE);
    const uscita = [0, 0, 0];
    for (let j = 0; j < token.length; j++) {
      for (let c = 0; c < 3; c++) uscita[c] += pesiV[j] * vettori[j][c];
    }
    return { punteggi, pesi: pesiV, valori: vettori, uscita, articolo: false, mascherata };
  }

  /* ---- la resa ---- */
  const it = (x) => (Number.isFinite(x) ? x.toFixed(2).replace(".", ",") : "0,00");
  const pct = (x) => Math.round(x * 100) + "%";

  function rendiParole() {
    parole.innerHTML = "";
    token.forEach((p, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "at-parola";
      b.textContent = p;
      b.setAttribute("aria-pressed", String(i === domanda));
      b.addEventListener("click", () => { domanda = i; rendi(); });
      parole.appendChild(b);
    });
    if (token.length === 0) {
      const vuoto = document.createElement("span");
      vuoto.className = "at-vuoto";
      vuoto.textContent = "Scrivete una frase qui sopra.";
      parole.appendChild(vuoto);
    }
  }

  function rendi() {
    if (token.length < 2 || domanda < 0 || domanda >= token.length) {
      stato.textContent = token.length < 2
        ? "Una frase deve avere almeno due parole."
        : "Cliccate una parola: quella farà la domanda.";
      pesi.innerHTML = "";
      somma.textContent = "";
      rendiParole();
      return;
    }
    const r = calcola();
    rendiParole();
    // lo stato
    if (r.articolo) {
      stato.textContent = r.mascherata
        ? "I numeri qui sotto sono quelli dell'articolo, ma con la maschera causale la domanda di cane non può più guardare il futuro: per l'ultima parola non cambia nulla, per le altre cambierebbe tutto."
        : "La domanda di cane: il peso maggiore (55%) va a morde. Più di metà della nuova rappresentazione di cane arriva dal valore di morde, e un altro sesto da gatto: il vettore che esce dall'attenzione sa di essere il cane che viene morso, e sa da chi.";
    } else {
      const ordine = token.map((p, j) => ({ p, peso: r.pesi[j], j }))
        .sort((a, b2) => b2.peso - a.peso);
      const primi = ordine.slice(0, 3).filter((o) => o.peso > 0.02);
      if (r.mascherata) {
        stato.textContent = "Con la maschera causale la domanda di " + token[domanda] +
          " non vede il futuro: le posizioni dopo di lei hanno peso zero.";
      } else if (primi.length === 0) {
        stato.textContent = "La domanda di " + token[domanda] + " non trova nessuno da guardare.";
      } else {
        stato.textContent = "La domanda di " + token[domanda] + ": il peso maggiore (" +
          pct(primi[0].peso) + ") va a " + primi[0].p + ". La nuova rappresentazione nasce per " +
          pct(primi[0].peso) + " da " + primi[0].p +
          (primi[1] ? ", per " + pct(primi[1].peso) + " da " + primi[1].p : "") +
          (primi[2] ? " e per " + pct(primi[2].peso) + " da " + primi[2].p : "") + ".";
      }
    }
    // le righe dei pesi
    pesi.innerHTML = "";
    token.forEach((p, j) => {
      const riga = document.createElement("div");
      riga.className = "at-riga";
      const esclusa = r.mascherata && j > domanda;
      riga.classList.toggle("at-riga--esclusa", esclusa);
      riga.classList.toggle("at-riga--domanda", j === domanda);
      const nome = document.createElement("span");
      nome.className = "at-nome";
      nome.textContent = j === domanda ? p + " (fa la domanda)" : p;
      const pista = document.createElement("span");
      pista.className = "at-pista";
      const piena = document.createElement("span");
      piena.className = "at-piena";
      piena.style.width = (r.pesi[j] * 100).toFixed(1) + "%";
      pista.appendChild(piena);
      const valore = document.createElement("span");
      valore.className = "at-valore";
      valore.textContent = esclusa ? "esclusa" : it(r.pesi[j]);
      riga.appendChild(nome);
      riga.appendChild(pista);
      riga.appendChild(valore);
      pesi.appendChild(riga);
    });
    // la somma pesata
    const t = r.uscita.map(it).join("  ");
    const maxJ = r.pesi.indexOf(Math.max(...r.pesi));
    somma.textContent = "La nuova rappresentazione di " + token[domanda] + " = [ " + t + " ]" +
      (r.articolo ? "" : " - la somma pesata dei valori, ciascuno col suo peso (il maggiore: " + token[maxJ] + ").");
  }

  function applicaFrase() {
    token = tokenizza(frase.value);
    if (token.length > 0) domanda = token.length - 1;   // si parte dall'ultima parola
    else domanda = -1;
    rendi();
  }
  applica.addEventListener("click", applicaFrase);
  frase.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); applicaFrase(); }
  });
  maschera.addEventListener("change", rendi);

  /* ---- all'avvio: la frase di casa, la domanda sull'ultima parola ---- */
  frase.value = FRASE_CASA;
  applicaFrase();
})();
