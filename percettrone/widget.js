/* Il widget del percettrone: si disegna una cifra col mouse o col dito,
   e i dieci percettroni dell'articolo - coi pesi addestrati dal programma
   del repository (github.com/Improve-and-Manage/percettrone) - votano con
   la loro somma pesata. Vince la piu' alta. JavaScript puro, zero
   dipendenze, nessun dato esce dalla pagina. */
(() => {
  "use strict";
  const radice = document.getElementById("pct-widget");
  if (!radice) return;
  const tela = document.getElementById("pct-tela");
  const mini = document.getElementById("pct-mini");
  const elBarre = document.getElementById("pct-barre");
  const stato = document.getElementById("pct-stato");
  const LATO = 280, G = 28;
  tela.width = LATO; tela.height = LATO;

  /* Il disegno vive in una maschera fuori schermo, solo trasparenza:
     cosi' il riconoscimento non dipende dal colore del tema, e al cambio
     tema basta ritingere. */
  const maschera = document.createElement("canvas");
  maschera.width = LATO; maschera.height = LATO;
  const gm = maschera.getContext("2d", { willReadFrequently: true });
  gm.lineWidth = 20; gm.lineCap = "round"; gm.lineJoin = "round";
  gm.strokeStyle = "#000";
  const gt = tela.getContext("2d");
  const gmini = mini.getContext("2d");

  let inchiostro = null;
  function coloreInchiostro() {
    if (!inchiostro) inchiostro = getComputedStyle(tela).color;
    return inchiostro;
  }
  function ritingi() {
    gt.clearRect(0, 0, LATO, LATO);
    gt.drawImage(maschera, 0, 0);
    gt.globalCompositeOperation = "source-in";
    gt.fillStyle = coloreInchiostro();
    gt.fillRect(0, 0, LATO, LATO);
    gt.globalCompositeOperation = "source-over";
  }
  function cambioTema() { inchiostro = null; ritingi(); disegnaMini(ultimaGriglia); ridisegnaPesi(); }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", cambioTema);
  new MutationObserver(cambioTema).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---- i pesi, dal file esportato dall'addestramento ---- */
  let M = null;
  fetch("/percettrone/pesi.json")
    .then((r) => r.json())
    .then((dati) => {
      M = dati.cifre.map((c) => ({
        pesi: Float32Array.from(c.pesi, (v) => v * c.scala),
        soglia: c.soglia,
      }));
      stato.textContent = "Disegnate una cifra grande, al centro.";
    })
    .catch(() => { stato.textContent = "Non riesco a caricare i pesi."; });

  /* ---- le dieci barre, costruite una volta ---- */
  const righe = [];
  {
    const frag = document.createDocumentFragment();
    for (let c = 0; c < 10; c++) {
      const riga = document.createElement("div");
      riga.className = "pct-riga";
      const g = document.createElement("span"); g.className = "pct-glifo"; g.textContent = c;
      const asta = document.createElement("span"); asta.className = "pct-asta";
      const dentro = document.createElement("i");
      asta.appendChild(dentro);
      const valore = document.createElement("span"); valore.className = "pct-valore";
      riga.append(g, asta, valore);
      frag.appendChild(riga);
      righe.push({ riga, dentro, valore });
    }
    elBarre.appendChild(frag);
  }
  function azzeraBarre() {
    for (const r of righe) {
      r.riga.classList.remove("vince");
      r.dentro.style.width = "0%";
      r.valore.textContent = "";
    }
  }

  /* ---- dal disegno alla griglia 28x28, preparata come MNIST ---- */
  let ultimaGriglia = null;
  function griglia28() {
    const alfa = gm.getImageData(0, 0, LATO, LATO).data;
    // riquadro del tratto, sul canale di trasparenza
    let x0 = LATO, y0 = LATO, x1 = -1, y1 = -1;
    for (let y = 0; y < LATO; y++)
      for (let x = 0; x < LATO; x++)
        if (alfa[(y * LATO + x) * 4 + 3] > 16) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
    if (x1 < 0) return null;
    /* come negli esempi di addestramento: il tratto riscalato a 20 punti
       sul lato lungo, poi centrato sul baricentro nella griglia 28x28 */
    const lw = x1 - x0 + 1, lh = y1 - y0 + 1;
    const scala = 20 / Math.max(lw, lh);
    const dw = Math.max(1, Math.round(lw * scala)), dh = Math.max(1, Math.round(lh * scala));
    const cv = document.createElement("canvas");
    cv.width = G; cv.height = G;
    const cg = cv.getContext("2d", { willReadFrequently: true });
    cg.drawImage(maschera, x0, y0, lw, lh, Math.floor((G - dw) / 2), Math.floor((G - dh) / 2), dw, dh);
    const dati = cg.getImageData(0, 0, G, G).data;
    let v = new Float32Array(G * G);
    let somma = 0, sx = 0, sy = 0;
    for (let i = 0; i < G * G; i++) {
      v[i] = dati[i * 4 + 3] / 255;
      somma += v[i]; sx += v[i] * (i % G); sy += v[i] * Math.floor(i / G);
    }
    if (!somma) return null;
    const dx = Math.round(13.5 - sx / somma), dy = Math.round(13.5 - sy / somma);
    if (dx || dy) {
      const sposta = new Float32Array(G * G);
      for (let y = 0; y < G; y++)
        for (let x = 0; x < G; x++) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < G && ny >= 0 && ny < G)
            sposta[ny * G + nx] = v[y * G + x];
        }
      v = sposta;
    }
    return v;
  }

  function disegnaMini(v) {
    gmini.clearRect(0, 0, G, G);
    if (!v) return;
    const img = gmini.createImageData(G, G);
    const rgb = coloreRGB();
    for (let i = 0; i < G * G; i++) {
      const o = i * 4;
      img.data[o] = rgb[0]; img.data[o + 1] = rgb[1]; img.data[o + 2] = rgb[2];
      img.data[o + 3] = Math.round(v[i] * 255);
    }
    gmini.putImageData(img, 0, 0);
  }
  const cvTinta = document.createElement("canvas");
  cvTinta.width = 1; cvTinta.height = 1;
  function coloreRGB() {
    const g = cvTinta.getContext("2d", { willReadFrequently: true });
    g.clearRect(0, 0, 1, 1);
    g.fillStyle = coloreInchiostro();
    g.fillRect(0, 0, 1, 1);
    return g.getImageData(0, 0, 1, 1).data;
  }

  /* ---- la radiografia: i pesi di ogni cifra, il confronto, il voto ---- */
  const rx = document.getElementById("pct-rx");
  const elPesi = document.getElementById("pct-pesi");
  const cvConfronto = document.getElementById("pct-confronto");
  const rxNota = document.getElementById("pct-rx-nota-viva");
  let cifraFissata = null;   // null: il confronto segue la vincitrice
  let vincitriceOra = null;
  const bottoniPeso = [];
  let tinteRx = null;
  function tinta(classe) {
    const s = document.createElement("span");
    s.className = classe; s.style.display = "none";
    document.body.appendChild(s);
    const colore = getComputedStyle(s).color;
    s.remove();
    const g = cvTinta.getContext("2d", { willReadFrequently: true });
    g.clearRect(0, 0, 1, 1); g.fillStyle = colore; g.fillRect(0, 0, 1, 1);
    return g.getImageData(0, 0, 1, 1).data.slice(0, 3);
  }
  function tinteCorrenti() {
    if (!tinteRx) tinteRx = { piu: tinta("pct-tinta-accento"), meno: tinta("pct-tinta-secondario") };
    return tinteRx;
  }
  /* colore = segno, intensita' = grandezza: la stessa grammatica delle
     strisce del piccolo GPT */
  function quadretto(cv, valori, massimo) {
    const g2 = cv.getContext("2d");
    const img = g2.createImageData(G, G);
    const t = tinteCorrenti();
    for (let i = 0; i < G * G; i++) {
      const val = valori[i] / massimo;
      const c = val >= 0 ? t.piu : t.meno;
      const o = i * 4;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2];
      img.data[o + 3] = Math.min(255, Math.round(Math.abs(val) * 255));
    }
    g2.putImageData(img, 0, 0);
  }
  function disegnaPesi() {
    if (!M || bottoniPeso.length) return;
    for (let c = 0; c < 10; c++) {
      const b = document.createElement("button");
      b.type = "button"; b.className = "pct-peso";
      b.setAttribute("aria-pressed", "false");
      const cv = document.createElement("canvas");
      cv.width = G; cv.height = G;
      const eti = document.createElement("span"); eti.textContent = c;
      b.append(cv, eti);
      let massimo = 1e-9;
      for (const w of M[c].pesi) if (Math.abs(w) > massimo) massimo = Math.abs(w);
      quadretto(cv, M[c].pesi, massimo);
      b.addEventListener("click", () => {
        cifraFissata = cifraFissata === c ? null : c;
        disegnaRx();
      });
      elPesi.appendChild(b);
      bottoniPeso.push({ b, cv, massimo });
    }
  }
  function disegnaRx() {
    if (!rx || !rx.open || !M) return;
    disegnaPesi();
    const scelta = cifraFissata !== null ? cifraFissata : vincitriceOra;
    bottoniPeso.forEach((p, c) => {
      p.b.classList.toggle("attiva", c === scelta);
      p.b.setAttribute("aria-pressed", c === scelta ? "true" : "false");
    });
    const gc = cvConfronto.getContext("2d");
    gc.clearRect(0, 0, G, G);
    if (scelta === null || !ultimaGriglia) {
      rxNota.textContent = "Disegnate: ogni punto della griglia viene moltiplicato per il suo peso, e qui se ne vede il risultato.";
      return;
    }
    const w = M[scelta].pesi, v = ultimaGriglia;
    const prodotto = new Float32Array(G * G);
    let massimo = 1e-9, somma = 0;
    for (let i = 0; i < G * G; i++) {
      prodotto[i] = w[i] * v[i];
      somma += prodotto[i];
      const a = Math.abs(prodotto[i]);
      if (a > massimo) massimo = a;
    }
    quadretto(cvConfronto, prodotto, massimo);
    rxNota.textContent = "Cifra " + scelta + ": la somma di tutti i punti dà " +
      somma.toFixed(1).replace(".", ",") +
      (cifraFissata === null ? " (la vincitrice)" : "");
  }
  function ridisegnaPesi() {
    tinteRx = null;
    bottoniPeso.forEach((p, c) => quadretto(p.cv, M[c].pesi, p.massimo));
    disegnaRx();
  }
  if (rx) rx.addEventListener("toggle", disegnaRx);

  /* ---- il voto: dieci somme pesate, vince la piu' alta ---- */
  function riconosci() {
    if (!M) return;
    const v = griglia28();
    ultimaGriglia = v;
    disegnaMini(v);
    if (!v) { azzeraBarre(); vincitriceOra = null; disegnaRx(); return; }
    const somme = M.map((p) => {
      let s = 0;
      for (let i = 0; i < v.length; i++) s += p.pesi[i] * v[i];
      return s;
    });
    let mn = Infinity, mx = -Infinity, vincitrice = 0;
    somme.forEach((s, c) => {
      if (s < mn) mn = s;
      if (s > mx) { mx = s; vincitrice = c; }
    });
    const ampiezza = mx - mn || 1;
    somme.forEach((s, c) => {
      const r = righe[c];
      r.dentro.style.width = Math.max(2, ((s - mn) / ampiezza) * 100) + "%";
      r.valore.textContent = s.toFixed(1).replace(".", ",");
      r.riga.classList.toggle("vince", c === vincitrice);
    });
    stato.textContent = "La somma più alta dice: " + vincitrice + ".";
    vincitriceOra = vincitrice;
    disegnaRx();
  }

  /* ---- il disegno, con mouse e dito ---- */
  let traccia = false, daRiconoscere = false;
  function punto(e) {
    const r = tela.getBoundingClientRect();
    return [(e.clientX - r.left) * (LATO / r.width), (e.clientY - r.top) * (LATO / r.height)];
  }
  tela.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    try { tela.setPointerCapture(e.pointerId); } catch { /* eventi sintetici */ }
    traccia = true;
    const [x, y] = punto(e);
    gm.beginPath(); gm.moveTo(x, y); gm.lineTo(x + 0.1, y + 0.1); gm.stroke();
    ritingi(); chiedi();
  });
  tela.addEventListener("pointermove", (e) => {
    if (!traccia) return;
    const [x, y] = punto(e);
    gm.lineTo(x, y); gm.stroke();
    ritingi(); chiedi();
  });
  for (const fine of ["pointerup", "pointercancel"])
    tela.addEventListener(fine, () => { traccia = false; riconosci(); });
  function chiedi() {
    // un riconoscimento per fotogramma, non uno per evento
    if (daRiconoscere) return;
    daRiconoscere = true;
    requestAnimationFrame(() => { daRiconoscere = false; riconosci(); });
  }
  document.getElementById("pct-cancella").addEventListener("click", () => {
    gm.clearRect(0, 0, LATO, LATO);
    ultimaGriglia = null;
    vincitriceOra = null;
    ritingi(); disegnaMini(null); azzeraBarre(); disegnaRx();
    stato.textContent = "Disegnate una cifra grande, al centro.";
  });
})();
