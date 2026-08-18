/* Il widget delle reti multistrato: la rete 2-2-1 dell'articolo parte da
   pesi casuali e impara XOR con la retropropagazione, davanti al lettore.
   Si sceglie la funzione di attivazione dello strato nascosto (sigmoide,
   tanh, ReLU) e il tasso di apprendimento; la superficie di decisione si
   piega a ogni giro. JavaScript puro, zero dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("rm-widget");
  if (!radice || radice.dataset.rmAvviato) return;
  radice.dataset.rmAvviato = "1";
  const tela = document.getElementById("rm-tela");
  const stato = document.getElementById("rm-stato");
  const elGiri = document.getElementById("rm-giri");
  const elErrore = document.getElementById("rm-errore");
  const bottoni = [...radice.querySelectorAll(".rm-att")];
  const elGiuste = document.getElementById("rm-giuste");
  const verdetto = document.getElementById("rm-verdetto");
  const tasso = document.getElementById("rm-tasso");
  const tassoV = document.getElementById("rm-tasso-v");
  const btnAddestra = document.getElementById("rm-addestra");
  const btnPasso = document.getElementById("rm-passo");
  const btnRicomincia = document.getElementById("rm-ricomincia");
  const elPesi = document.getElementById("rm-pesi");
  if (!tela || !stato || !elGiri || !elErrore || !elGiuste || !tasso ||
      !tassoV || !btnAddestra || !btnPasso || !btnRicomincia) return;
  let posA = 0, posB = 0;   // 0 = giu', 1 = su
  const G = 56;                      // celle della superficie
  tela.width = G; tela.height = G;
  const g = tela.getContext("2d");
  if (!g) return;
  const img = g.createImageData(G, G);   // riusata a ogni ridisegno

  const ESEMPI = [[0, 0, 0], [0, 1, 1], [1, 0, 1], [1, 1, 0]];

  /* ---- le curve e le loro pendenze ---- */
  const CURVE = {
    sigmoide: { f: (z) => 1 / (1 + Math.exp(-z)), df: (z, a) => a * (1 - a) },
    tanh: { f: Math.tanh, df: (z, a) => 1 - a * a },
    relu: { f: (z) => (z > 0 ? z : 0), df: (z) => (z > 0 ? 1 : 0) },
  };
  let curva = "sigmoide";

  /* ---- la rete: 2 ingressi, 2 nascosti, 1 uscita (sempre sigmoide) ---- */
  let P = null, giri = 0, esito = "corre", tentativi = 1;
  let storia = [];
  function ricomincia(mantieniTentativi) {
    const c = () => Math.random() * 2 - 1;
    P = { w1: [[c(), c()], [c(), c()]], s1: [c(), c()], w2: [c(), c()], s2: c() };
    giri = 0; esito = "corre"; storia = [];
    if (!mantieniTentativi) tentativi = 1;
  }
  function inAvanti(x, y) {
    const att = CURVE[curva];
    const z = [0, 1].map((j) => P.w1[j][0] * x + P.w1[j][1] * y + P.s1[j]);
    const a = z.map(att.f);
    const z2 = P.w2[0] * a[0] + P.w2[1] * a[1] + P.s2;
    const p = 1 / (1 + Math.exp(-z2));
    return { z, a, p };
  }
  // solo la probabilita', senza allocare: e' la via battuta dalle 3136 celle
  function previsione(x, y) {
    const f = CURVE[curva].f;
    const a0 = f(P.w1[0][0] * x + P.w1[0][1] * y + P.s1[0]);
    const a1 = f(P.w1[1][0] * x + P.w1[1][1] * y + P.s1[1]);
    return 1 / (1 + Math.exp(-(P.w2[0] * a0 + P.w2[1] * a1 + P.s2)));
  }
  function tassoCorrente() {
    const v = parseFloat(tasso.value);
    return Number.isFinite(v) ? v : 2;
  }
  function unGiro() {
    // un giro = i quattro esempi insieme (gradiente accumulato, poi il passo)
    const att = CURVE[curva];
    const eta = tassoCorrente() / ESEMPI.length;
    const gw1 = [[0, 0], [0, 0]], gs1 = [0, 0], gw2 = [0, 0];
    let gs2 = 0, errore = 0, giuste = 0;
    for (const [x, y, t] of ESEMPI) {
      const { z, a, p } = inAvanti(x, y);
      const d2 = p - t;                       // errore in uscita
      errore += Math.abs(d2);
      if ((p > 0.5) === (t === 1)) giuste++;
      for (const j of [0, 1]) {
        gw2[j] += d2 * a[j];
        const d1 = d2 * P.w2[j] * att.df(z[j], a[j]);   // l'errore ripartito
        gw1[j][0] += d1 * x; gw1[j][1] += d1 * y; gs1[j] += d1;
      }
      gs2 += d2;
    }
    for (const j of [0, 1]) {
      P.w2[j] -= eta * gw2[j];
      P.w1[j][0] -= eta * gw1[j][0]; P.w1[j][1] -= eta * gw1[j][1];
      P.s1[j] -= eta * gs1[j];
    }
    P.s2 -= eta * gs2;
    giri++;
    const e = errore / ESEMPI.length;
    storia.push(e);
    return { errore: e, giuste };
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
      si: tinta("rm-tinta-accento"),
      no: tinta("rm-tinta-secondario"),
      punto: tinta("rm-tinta-testo"),
    };
    return tinte;
  }
  const alCambioTema = () => { tinte = null; disegna(); };
  const schema = window.matchMedia("(prefers-color-scheme: dark)");
  if (schema.addEventListener) schema.addEventListener("change", alCambioTema);
  else if (schema.addListener) schema.addListener(alCambioTema);
  new MutationObserver(alCambioTema).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  /* ---- fuori dallo schermo non si disegna: il ridisegno aspetta il rientro ---- */
  let inVista = true, daRidisegnare = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((voci) => {
      inVista = voci[0].isIntersecting;
      if (inVista && daRidisegnare) { daRidisegnare = false; disegna(); }
    }).observe(radice);
  }

  /* ---- la superficie di decisione: ruggine dove dice 1 ---- */
  const MIN = -0.25, LARG = 1.5;
  function disegna() {
    if (!inVista) { daRidisegnare = true; return; }
    const t = tinteCorrenti();
    for (let r = 0; r < G; r++) {
      const y = MIN + LARG * (1 - r / (G - 1));
      for (let c2 = 0; c2 < G; c2++) {
        const x = MIN + LARG * (c2 / (G - 1));
        const p = previsione(x, y);
        const colore = p > 0.5 ? t.si : t.no;
        const o = (r * G + c2) * 4;
        img.data[o] = colore[0]; img.data[o + 1] = colore[1]; img.data[o + 2] = colore[2];
        img.data[o + 3] = Math.round(Math.min(1, Math.abs(p - 0.5) * 2) * 210);
      }
    }
    g.putImageData(img, 0, 0);
    giocata();
    disegnaGrafici();
    // i quattro punti sulla mappa: pieni = va accesa, vuoti = va spenta
    for (const [x, y, tv] of ESEMPI) {
      const px = (x - MIN) / LARG * (G - 1);
      const py = (1 - (y - MIN) / LARG) * (G - 1);
      g.beginPath();
      g.arc(px, py, 2.6, 0, 2 * Math.PI);
      const inchiostro = "rgb(" + t.punto.join(",") + ")";
      if (tv === 1) { g.fillStyle = inchiostro; g.fill(); }
      else { g.lineWidth = 1.2; g.strokeStyle = inchiostro; g.stroke(); }
    }
  }

  /* ---- i comandi ---- */
  let corsa = null;
  function aggiorna(errore, giuste) {
    elGiri.textContent = giri;
    elGiuste.textContent = giuste + "/4";
    elErrore.textContent = errore.toFixed(3).replace(".", ",");
    if (giuste === 4 && errore < 0.05 && esito === "corre") {
      esito = "imparato";
      const n = (v) => v.toFixed(1).replace(".", ",").replace("-", "−");
      stato.textContent = "Il circuito della luce delle scale è imparato in " + giri + " giri" +
        (tentativi > 1 ? ", al tentativo " + tentativi : "") +
        ": i nove numeri qui sotto si sono fermati - quello è il modello. Sono i pesi e le soglie che, applicati alla rete, le fanno simulare il circuito vero della luce delle scale. Tornate alla scena e provate a coglierla in fallo.";
      if (elPesi) elPesi.textContent = "Il vettore del modello - nascosto 1 [ " +
        n(P.w1[0][0]) + "  " + n(P.w1[0][1]) + "  soglia " + n(-P.s1[0]) + " ] · nascosto 2 [ " +
        n(P.w1[1][0]) + "  " + n(P.w1[1][1]) + "  soglia " + n(-P.s1[1]) + " ] · uscita [ " +
        n(P.w2[0]) + "  " + n(P.w2[1]) + "  soglia " + n(-P.s2) + " ]";
      ferma();
    } else if (giri >= 4000 && esito === "corre") {
      // la discesa si e' incagliata: pesi rimescolati da soli, si riparte
      tentativi++;
      ricomincia(true);
      stato.textContent = "Discesa incagliata (capita, soprattutto con la ReLU): pesi rimescolati da soli, tentativo " + tentativi + "…";
    }
  }
  function azzera() {
    elGiri.textContent = 0; elErrore.textContent = "–"; elGiuste.textContent = "–";
    if (elPesi) elPesi.textContent = "";
  }
  function passo() {
    const { errore, giuste } = unGiro();
    disegna(); aggiorna(errore, giuste);
  }
  function giroDiCorsa() {
    let r = null;
    for (let k = 0; k < 24 && esito === "corre"; k++) r = unGiro();
    if (r) { disegna(); aggiorna(r.errore, r.giuste); }
    if (esito === "corre") corsa = requestAnimationFrame(giroDiCorsa);
  }
  function ferma() {
    if (corsa) { cancelAnimationFrame(corsa); corsa = null; }
    btnAddestra.textContent = "Addestra";
  }
  function avvia() {
    btnAddestra.textContent = "Ferma";
    corsa = requestAnimationFrame(giroDiCorsa);
  }
  btnAddestra.addEventListener("click", () => {
    if (corsa) { ferma(); stato.textContent = "In pausa al giro " + giri + "."; return; }
    if (esito !== "corre") return;
    stato.textContent = "La discesa è in corso…";
    avvia();
  });
  btnPasso.addEventListener("click", () => {
    if (esito !== "corre") return;
    ferma(); passo();
    if (esito === "corre") stato.textContent = "Giro " + giri + ".";
  });
  btnRicomincia.addEventListener("click", () => {
    ferma(); ricomincia(); disegna(); azzera();
    stato.textContent = "Pesi nuovi, a caso. Cercate dove sbaglia, poi «Addestra».";
  });
  for (const b of bottoni) {
    b.addEventListener("click", () => {
      for (const x of bottoni) { x.classList.remove("attiva"); x.setAttribute("aria-pressed", "false"); }
      b.classList.add("attiva");
      b.setAttribute("aria-pressed", "true");
      curva = b.dataset.curva;
      ferma(); ricomincia(); disegna(); azzera();
      stato.textContent = "Curva " + b.textContent + ", pesi nuovi. Premete «Addestra».";
    });
  }
  tasso.addEventListener("input", () => {
    tassoV.textContent = tassoCorrente().toFixed(1).replace(".", ",");
  });


  /* ---- il grafico dell'errore, coi valori di partenza e di adesso ---- */
  const cvLoss = document.getElementById("rm-loss");
  const gl = cvLoss && cvLoss.getContext("2d");
  let lossL = 280, lossA = 120, scala = 1;
  function misuraLoss() {
    if (!cvLoss) return;
    // il retro della tela segue i pixel veri dello schermo: niente sfocatura retina
    scala = Math.min(window.devicePixelRatio || 1, 3);
    lossL = cvLoss.clientWidth || 280;
    lossA = Math.round(lossL * 3 / 7);
    cvLoss.width = Math.round(lossL * scala);
    cvLoss.height = Math.round(lossA * scala);
  }
  if (cvLoss && "ResizeObserver" in window) {
    let misurata = false;
    new ResizeObserver(() => {
      const prima = lossL;
      misuraLoss();
      if (misurata && prima !== lossL) disegnaGrafici();
      misurata = true;
    }).observe(cvLoss);
  }
  function campiona(larghezza) {
    if (storia.length < 2) return null;
    const passo = Math.max(1, Math.floor(storia.length / larghezza));
    const punti = [];
    for (let i = 0; i < storia.length; i += passo) punti.push(storia[i]);
    if (punti[punti.length - 1] !== storia[storia.length - 1]) punti.push(storia[storia.length - 1]);
    return punti;
  }
  function disegnaGrafici() {
    if (!gl) return;
    const t = tinteCorrenti();
    const rgb = (c) => "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
    const L = lossL, A = lossA;
    gl.setTransform(scala, 0, 0, scala, 0, 0);
    gl.clearRect(0, 0, L, A);
    const punti = campiona(L);
    if (!punti) return;
    let maxE = 0.55;
    for (const e of punti) if (e > maxE) maxE = e;
    gl.strokeStyle = rgb(t.si); gl.lineWidth = 2; gl.beginPath();
    punti.forEach((e, i) => {
      const x = i / (punti.length - 1) * (L - 8) + 4;
      const y = A - 6 - (e / maxE) * (A - 12);
      if (i === 0) gl.moveTo(x, y); else gl.lineTo(x, y);
    });
    gl.stroke();
    // i valori nel tempo: da dove la discesa e' partita, dov'e' adesso
    const eti = (v) => v.toFixed(2).replace(".", ",");
    const yDa = A - 6 - (punti[0] / maxE) * (A - 12);
    const yA = A - 6 - (punti[punti.length - 1] / maxE) * (A - 12);
    gl.font = "10px ui-monospace, monospace";
    gl.fillStyle = rgb(t.punto);
    gl.textAlign = "left";
    gl.fillText(eti(punti[0]), 6, Math.min(A - 4, Math.max(12, yDa + 14)));
    gl.textAlign = "right";
    gl.fillText(eti(punti[punti.length - 1]), L - 6, Math.min(A - 4, Math.max(12, yA - 6)));
  }

  /* ---- il gioco: la scena unica, gli interruttori, il verdetto ---- */
  const scena = document.getElementById("rm-scena");
  function giocata() {
    if (!scena || !verdetto) return;
    const vera = posA ^ posB;
    const rete = previsione(posA, posB) > 0.5 ? 1 : 0;
    scena.classList.toggle("pos-a-1", posA === 1);
    scena.classList.toggle("pos-b-1", posB === 1);
    scena.classList.toggle("chiuso-alto", posA === 1 && posB === 0);
    scena.classList.toggle("chiuso-basso", posA === 0 && posB === 1);
    scena.classList.toggle("vera-accesa", vera === 1);
    scena.classList.toggle("rete-accesa", rete === 1);
    if (giri === 0) {
      verdetto.textContent = vera === rete
        ? "Le due lampadine concordano - ma per caso: coi pesi appena rimescolati la rete tira a indovinare."
        : "La luce vera è " + (vera ? "accesa" : "spenta") +
          "; la rete, coi pesi a caso, la " + (rete ? "accenderebbe" : "spegnerebbe") + ". Fase 2: addestratela.";
    } else {
      verdetto.textContent = vera === rete
        ? "Le due lampadine concordano: qui la rete ci prende."
        : "Trovata! La luce vera è " + (vera ? "accesa" : "spenta") +
          ", ma la rete la " + (rete ? "accenderebbe" : "spegnerebbe") + ". Fase 2: addestratela.";
    }
  }
  function commuta(quale) {
    if (quale === "a") posA ^= 1; else posB ^= 1;
    giocata();
  }
  for (const [classe, quale] of [[".int-a", "a"], [".int-b", "b"]]) {
    const g2 = scena && scena.querySelector(classe);
    if (!g2) continue;
    g2.addEventListener("click", () => commuta(quale));
    g2.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); commuta(quale); }
    });
  }

  misuraLoss();
  ricomincia();
  disegna();
})();
