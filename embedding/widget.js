/* Il widget «Lo spazio dei significati» del pezzo sull'embedding: un
   corpus minimo italiano, le parole che co-occorrono si attraggono, le
   coppie mai vicine si respingono - e la mappa si dispone da sola, come
   l'addestramento del pezzo dispone gli embedding per somiglianza d'uso.
   Si clicca una parola per i vicini, e tre parole per comporre
   l'analogia: il punto a - b + c cade dove la geometria della mappa
   dice. La mappa e' illustrativa, non misurata: la classica
   re - uomo + donna ~ regina regge con molti semi e non con tutti,
   come il pezzo dichiara delle analogie. JavaScript puro, zero
   dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("eb-widget");
  if (!radice || radice.dataset.ebAvviato) return;
  radice.dataset.ebAvviato = "1";
  const tela = document.getElementById("eb-tela");
  const stato = document.getElementById("eb-stato");
  const elScelta = document.getElementById("eb-scelta");
  const elEsito = document.getElementById("eb-esito");
  const btnAddestra = document.getElementById("eb-addestra");
  const btnRicomincia = document.getElementById("eb-ricomincia");
  const btnRimescola = document.getElementById("eb-rimescola");
  const btnClassica = document.getElementById("eb-classica");
  const btnAzzera = document.getElementById("eb-azzera");
  if (!tela || !stato || !elScelta || !elEsito || !btnAddestra ||
      !btnRicomincia || !btnRimescola || !btnClassica || !btnAzzera) return;

  /* ---- il corpus minimo: 10 parole visibili, contesti nascosti ---- */
  const VISIBILI = ["re", "regina", "uomo", "donna", "caldo", "freddo", "brodo", "ghiaccio", "sole", "neve"];
  const PAROLE = [...VISIBILI, "governa", "cammina", "è", "e", "il", "la", "l", "regno", "casa", "strada", "giardino", "maschio", "femmina", "un", "una"];
  const idx = {}; PAROLE.forEach((p, i) => idx[p] = i);
  const N = PAROLE.length;
  const V = VISIBILI.map((p) => idx[p]);
  const FRASI = [
    "il re governa il regno", "la regina governa il regno",
    "il re cammina nel giardino", "la regina cammina nel giardino",
    "l uomo governa la casa", "la donna governa la casa",
    "l uomo cammina per strada", "la donna cammina per strada",
    "il re e la regina", "l uomo e la donna",
    "il re è un uomo", "la regina è una donna",
    "il brodo è caldo", "il ghiaccio è freddo",
    "il sole è caldo", "la neve è fredda",
  ];
  const coppie = new Set();
  const peso = new Map();
  FRASI.forEach((frase) => {
    const t = frase.split(" ");
    for (let i = 0; i < t.length; i++) {
      if (idx[t[i]] === undefined) continue;
      for (let j = Math.max(0, i - 2); j <= Math.min(t.length - 1, i + 2); j++) {
        if (j === i || idx[t[j]] === undefined) continue;
        const a = idx[t[i]], b = idx[t[j]];
        const k = Math.min(a, b) * N + Math.max(a, b);
        coppie.add(k);
        peso.set(k, (peso.get(k) || 0) + 1);
      }
    }
  });

  /* ---- i numeri casuali col seme, per ripetere o rimescolare ---- */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let seme = 104729;             // il seme di casa: l'analogia regge
  let v = null, giri = 0, corsa = null, selezionate = [];
  let sceltaVicini = null;       // la parola cliccata per i vicini

  function ricomincia(conSeme) {
    if (conSeme) seme = conSeme;
    const rnd = mulberry32(seme);
    v = PAROLE.map(() => [rnd() * 2 - 1, rnd() * 2 - 1]);
    giri = 0;
  }

  /* ---- un giro di addestramento: attrazione e repulsione ---- */
  function unGiro(eta) {
    for (const [k, w] of peso) {
      const a = Math.floor(k / N), b = k % N;
      const va = v[a], vb = v[b];
      const dx = vb[0] - va[0], dy = vb[1] - va[1];
      const d = Math.hypot(dx, dy) + 1e-9;
      const f = eta * w;
      va[0] += dx / d * f; va[1] += dy / d * f;
      vb[0] -= dx / d * f; vb[1] -= dy / d * f;
    }
    for (let ii = 0; ii < V.length; ii++) {
      for (let jj = ii + 1; jj < V.length; jj++) {
        const i = V[ii], j = V[jj];
        if (coppie.has(i * N + j)) continue;
        const dx = v[j][0] - v[i][0], dy = v[j][1] - v[i][1];
        const d = Math.hypot(dx, dy) + 1e-9;
        const f = eta * 0.5 / (d * d + 0.5);
        v[i][0] -= dx / d * f; v[i][1] -= dy / d * f;
        v[j][0] += dx / d * f; v[j][1] += dy / d * f;
      }
    }
    giri++;
  }

  /* ---- l'analogia: a - b + c, e la parola piu' vicina ---- */
  function calcolaAnalogia() {
    if (selezionate.length !== 3) return null;
    const [a, b, c] = selezionate;
    const va = v[idx[a]], vb = v[idx[b]], vc = v[idx[c]];
    const tx = va[0] - vb[0] + vc[0], ty = va[1] - vb[1] + vc[1];
    let migliore = null, dist = Infinity;
    for (const p of VISIBILI) {
      if (selezionate.includes(p)) continue;
      const d = Math.hypot(v[idx[p]][0] - tx, v[idx[p]][1] - ty);
      if (d < dist) { dist = d; migliore = p; }
    }
    return { tx, ty, migliore, dist };
  }

  /* ---- colori del tema, con ritinta al cambio ---- */
  let tinte = null;
  const cvTinta = document.createElement("canvas");
  cvTinta.width = 1; cvTinta.height = 1;
  function tinta(classe) {
    const s = document.createElement("span");
    s.className = classe; s.style.display = "none";
    document.body.appendChild(s);
    const colore = getComputedStyle(s).color;
    s.remove();
    const gc = cvTinta.getContext("2d", { willReadFrequently: true });
    gc.clearRect(0, 0, 1, 1); gc.fillStyle = colore; gc.fillRect(0, 0, 1, 1);
    return gc.getImageData(0, 0, 1, 1).data.slice(0, 3);
  }
  function tinteCorrenti() {
    if (!tinte) tinte = {
      testo: tinta("eb-tinta-testo"),
      tenue: tinta("eb-tinta-tenue"),
      accento: tinta("eb-tinta-accento"),
      superficie: tinta("eb-tinta-superficie"),
    };
    return tinte;
  }
  const alCambioTema = () => { tinte = null; disegna(); };
  const schema = window.matchMedia("(prefers-color-scheme: dark)");
  if (schema.addEventListener) schema.addEventListener("change", alCambioTema);
  else if (schema.addListener) schema.addListener(alCambioTema);
  new MutationObserver(alCambioTema).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---- la tela, con la scala giusta per lo schermo ---- */
  const g = tela.getContext("2d");
  let L = 560, A = 380, scala = 1;
  function misura() {
    scala = Math.min(window.devicePixelRatio || 1, 3);
    L = tela.clientWidth || 560;
    A = Math.round(L * 380 / 560);
    tela.width = Math.round(L * scala);
    tela.height = Math.round(A * scala);
  }
  if ("ResizeObserver" in window) {
    new ResizeObserver(() => { misura(); disegna(); }).observe(tela);
  }
  function px(x) { return (x + 1.35) / 2.7 * L; }
  function py(y) { return (1.35 - y) / 2.7 * A; }
  const it = (x) => x.toFixed(2).replace(".", ",");

  function disegna() {
    if (!g) return;
    const t = tinteCorrenti();
    const rgb = (c) => "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
    g.setTransform(scala, 0, 0, scala, 0, 0);
    g.clearRect(0, 0, L, A);
    // i vicini della parola cliccata: linee dalla parola alle piu' vicine
    if (sceltaVicini) {
      const vi = idx[sceltaVicini];
      const vicini = viciniDi(sceltaVicini, 3);
      g.strokeStyle = rgb(t.tenue); g.lineWidth = 1;
      g.setLineDash([3, 3]);
      for (const vv of vicini) {
        g.beginPath();
        g.moveTo(px(v[vi][0]), py(v[vi][1]));
        g.lineTo(px(v[idx[vv]][0]), py(v[idx[vv]][1]));
        g.stroke();
      }
      g.setLineDash([]);
      // i cerchi dei vicini
      g.fillStyle = rgb(t.tenue);
      for (const vv of vicini) {
        g.beginPath();
        g.arc(px(v[idx[vv]][0]), py(v[idx[vv]][1]), 5, 0, 2 * Math.PI);
        g.fill();
      }
    }
    // la parola piu' vicina alla selezione, se ce n'e' una
    const anal = calcolaAnalogia();
    if (anal) {
      g.strokeStyle = rgb(t.accento); g.lineWidth = 1.5;
      g.setLineDash([4, 3]);
      g.beginPath();
      g.moveTo(px(anal.tx), py(anal.ty));
      g.lineTo(px(v[idx[anal.migliore]][0]), py(v[idx[anal.migliore]][1]));
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = rgb(t.accento);
      g.beginPath(); g.arc(px(anal.tx), py(anal.ty), 4, 0, 2 * Math.PI); g.fill();
    }
    // i punti e le etichette delle parole visibili
    for (const p of VISIBILI) {
      const i = idx[p];
      const x = px(v[i][0]), y = py(v[i][1]);
      const scelta = selezionate.indexOf(p);
      g.fillStyle = scelta >= 0 ? rgb(t.accento) : rgb(t.testo);
      g.beginPath(); g.arc(x, y, scelta >= 0 ? 4.5 : 3, 0, 2 * Math.PI); g.fill();
      g.font = "11px ui-monospace, monospace";
      g.textAlign = "left";
      g.fillText((scelta >= 0 ? (scelta + 1) + "·" : "") + p, x + 7, y - 6);
    }
  }
  /* le k parole piu' vicine a p, senza contare p stessa */
  function viciniDi(p, k) {
    const i = idx[p];
    return VISIBILI
      .filter((q) => q !== p)
      .map((q) => ({ q, d: Math.hypot(v[idx[q]][0] - v[i][0], v[idx[q]][1] - v[i][1]) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, k)
      .map((o) => o.q);
  }

  /* ---- l'animazione dell'addestramento ---- */
  let inVista = true, daRidisegnare = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((voci) => {
      inVista = voci[0].isIntersecting;
      if (inVista && daRidisegnare) { daRidisegnare = false; disegna(); }
    }).observe(radice);
  }
  function giroDiCorsa() {
    if (!inVista) { daRidisegnare = true; corsa = null; return; }
    unGiro(0.05);
    disegna();
    if (giri < 500) corsa = requestAnimationFrame(giroDiCorsa);
    else {
      corsa = null;
      btnAddestra.textContent = "Addestra";
      stato.textContent = "Fatto: le parole vicine si usano in contesti simili. Cliccate una parola e vedete chi le sta vicino.";
    }
  }
  function avvia() {
    if (corsa) { cancelAnimationFrame(corsa); corsa = null; btnAddestra.textContent = "Addestra"; return; }
    btnAddestra.textContent = "Ferma";
    stato.textContent = "La mappa si sta disponendo: le parole che si usano insieme si avvicinano…";
    corsa = requestAnimationFrame(giroDiCorsa);
  }
  btnAddestra.addEventListener("click", avvia);
  btnRicomincia.addEventListener("click", () => {
    if (corsa) { cancelAnimationFrame(corsa); corsa = null; }
    ricomincia();
    selezionate = [];
    sceltaVicini = null;
    btnAddestra.textContent = "Addestra";
    stato.textContent = "Mappa nuova, stesso seme. Premete «Addestra» per vederla disporsi, o «La classica» per l'analogia.";
    disegna();
  });
  btnRimescola.addEventListener("click", () => {
    if (corsa) { cancelAnimationFrame(corsa); corsa = null; }
    seme = (Math.random() * 1e9) | 0;
    ricomincia();
    selezionate = [];
    sceltaVicini = null;
    btnAddestra.textContent = "Addestra";
    stato.textContent = "Seme nuovo: " + seme + ". Un'altra mappa possibile, un'altra geometria.";
    disegna();
  });
  btnAzzera.addEventListener("click", () => {
    selezionate = [];
    sceltaVicini = null;
    elScelta.textContent = "Scegliete tre parole cliccandole (o usate «La classica»).";
    elEsito.textContent = "";
    disegna();
  });
  btnClassica.addEventListener("click", () => {
    selezionate = ["re", "uomo", "donna"];
    sceltaVicini = null;
    elScelta.textContent = "Analogia: re − uomo + donna = ?";
    const anal = calcolaAnalogia();
    elEsito.textContent = anal
      ? "Il punto cade vicino a «" + anal.migliore + "». " +
        (anal.migliore === "regina"
          ? "La classica regge: re − uomo + donna ≈ regina."
          : "Qui non regge: le analogie sono una regolarità, non una legge - e questo seme la mostra.")
      : "";
    disegna();
  });

  /* ---- clic sulle parole: vicini subito, analogia con tre parole ---- */
  tela.addEventListener("click", (e) => {
    const r = tela.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width * L;
    const my = (e.clientY - r.top) / r.height * A;
    let migliore = null, dist = Infinity;
    for (const p of VISIBILI) {
      const i = idx[p];
      const d = Math.hypot(px(v[i][0]) - mx, py(v[i][1]) - my);
      if (d < dist) { dist = d; migliore = p; }
    }
    if (dist > 30) return;
    sceltaVicini = migliore;
    const vicini = viciniDi(migliore, 3);
    if (selezionate.length < 3) {
      selezionate.push(migliore);
      if (selezionate.length < 3) {
        elScelta.textContent = "«" + migliore + "» sta vicino a: " + vicini.join(", ") +
          ". È la " + (selezionate.length === 1 ? "prima" : "seconda") +
          " parola dell'analogia - ne servono " + (3 - selezionate.length) + " (o premete «La classica»).";
      } else {
        elScelta.textContent = "Analogia: " + selezionate[0] + " − " + selezionate[1] + " + " + selezionate[2] + " = ?";
        const anal = calcolaAnalogia();
        elEsito.textContent = anal
          ? "Il punto cade vicino a «" + anal.migliore + "». " +
            (anal.migliore === "regina"
              ? "Qui la geometria regge, come nella classica."
              : "Qui non regge: le analogie sono una regolarità, non una legge.")
          : "";
      }
    } else {
      elScelta.textContent = "«" + migliore + "» sta vicino a: " + vicini.join(", ") +
        ". Per un'altra analogia, «Azzera» e ripartite.";
    }
    disegna();
  });

  /* ---- all'avvio: mappa pronta, senza animazione ---- */
  misura();
  ricomincia();
  for (let i = 0; i < 500; i++) unGiro(0.05);
  disegna();
  stato.textContent = "La mappa è pronta. Cliccate una parola: vedete chi le sta vicino. O premete «La classica»: re − uomo + donna.";
})();
