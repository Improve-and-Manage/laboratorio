/* Il widget «Smonta il modello» del pezzo sul Transformer: il piccolo GPT
   della serie (4 blocchi, 4 teste, 128 dimensioni, 83 caratteri, int8)
   genera testo con un seme fisso, e il lettore toglie pezzi - connessione
   residua, attenzione, MLP, blocchi - per vedere come la generazione si
   rompe. Stessi pesi e stesso seme: cambia solo quello che si smonta.
   JavaScript puro, zero dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("sm-widget");
  if (!radice || radice.dataset.smAvviato) return;
  radice.dataset.smAvviato = "1";
  const elStato = document.getElementById("sm-stato");
  const elTesto = document.getElementById("sm-testo");
  const elGenera = document.getElementById("sm-genera");
  const elRigenera = document.getElementById("sm-rigenera");
  const elSeme = document.getElementById("sm-seme");
  const elResiduo = document.getElementById("sm-residuo");
  const elAtt = document.getElementById("sm-attenzione");
  const elMlp = document.getElementById("sm-mlp");
  const elBlocchi = document.getElementById("sm-blocchi");
  const elBlocchiV = document.getElementById("sm-blocchi-v");
  const elT = document.getElementById("sm-temperatura");
  const elTV = document.getElementById("sm-temperatura-v");
  if (!elStato || !elTesto || !elGenera || !elRigenera || !elSeme ||
      !elResiduo || !elAtt || !elMlp || !elBlocchi || !elBlocchiV || !elT || !elTV) return;

  const BASE = "/applicazioni/piccolo-gpt/";
  const INNESCO = "Nel mezzo del cammin di nostra vita";

  /* ---- il generatore di numeri casuali: seme fisso, esiti confrontabili ---- */
  let seme = 12345;
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rnd = mulberry32(seme);

  /* ---- caricamento del modello: stesso formato del gioco della serie ---- */
  let M = null;
  async function carica() {
    const [man, blob] = await Promise.all([
      fetch(BASE + "manifest.json").then((r) => r.json()),
      fetch(BASE + "pesi.bin").then((r) => r.arrayBuffer()),
    ]);
    const T = {};
    for (const v of man.tensori) {
      const [r, c] = v.forma.length === 2 ? v.forma : [v.forma[0], 1];
      if (v.tipo === "int8_riga") {
        const q = new Int8Array(blob, v.offset, r * c);
        const s = new Float32Array(blob.slice(v.offset_scale, v.offset_scale + 4 * r));
        const d = new Float32Array(r * c);
        for (let i = 0; i < r; i++) {
          const si = s[i];
          for (let j = 0; j < c; j++) d[i * c + j] = q[i * c + j] * si;
        }
        T[v.nome] = { r, c, d };
      } else {
        T[v.nome] = { r, c: 1, d: new Float32Array(blob.slice(v.offset, v.offset + 4 * r)) };
      }
    }
    const voc = man.vocabolario;
    const stoi = {};
    for (let i = 0; i < voc.length; i++) stoi[voc[i]] = i;
    M = { cfg: man.config, voc, stoi, T };
    preparaScratch();
    elStato.textContent = "Il modello è carico. Premete «Genera»: con tutto acceso, il piccolo GPT continua lo stile della Commedia.";
    elGenera.disabled = false;
  }

  /* ---- i vettori di lavoro, allocati una volta ---- */
  let sc = null;
  function preparaScratch() {
    const { n_embd: E, block_size: B, vocab_size: V } = M.cfg;
    sc = {
      x: new Float32Array(E),
      h: new Float32Array(E),
      qkv: new Float32Array(3 * E),
      y: new Float32Array(E),
      proi: new Float32Array(E),
      fc: new Float32Array(4 * E),
      mlp: new Float32Array(E),
      xf: new Float32Array(E),
      logits: new Float32Array(V),
      pesi: new Float32Array(B),
      cacheK: [], cacheV: [],
    };
    for (let l = 0; l < M.cfg.n_layer; l++) {
      sc.cacheK.push(new Float32Array(B * E));
      sc.cacheV.push(new Float32Array(B * E));
    }
  }
  function ln(x, w, out) {
    const n = x.length; let m = 0, v = 0;
    for (let i = 0; i < n; i++) m += x[i];
    m /= n;
    for (let i = 0; i < n; i++) { const dlt = x[i] - m; v += dlt * dlt; }
    const inv = 1 / Math.sqrt(v / n + 1e-5);
    for (let i = 0; i < n; i++) out[i] = (x[i] - m) * inv * w.d[i];
    return out;
  }
  function matvec(W, x, out) {
    const { r, c, d } = W;
    for (let i = 0; i < r; i++) {
      let s = 0; const base = i * c;
      for (let j = 0; j < c; j++) s += d[base + j] * x[j];
      out[i] = s;
    }
    return out;
  }
  function gelu(x) {
    for (let i = 0; i < x.length; i++) {
      const t = x[i];
      x[i] = 0.5 * t * (1 + Math.tanh(0.7978845608 * (t + 0.044715 * t * t * t)));
    }
    return x;
  }
  /* Un passo: il token in posizione pos, coi pezzi smontati secondo gli
     interruttori. Le connessioni residue si tolgono non sommando
     l'ingresso: il segnale non ha piu' la scorciatoia, e i numeri
     possono esplodere - e' il sintomo che il pezzo descrive. */
  function passoModello(tok, pos) {
    const { n_layer, n_head, n_embd } = M.cfg;
    const E = n_embd, H = n_head, hd = E / H, Tq = pos + 1;
    const T = M.T, x = sc.x;
    const wte = T["transformer.wte.weight"], wpe = T["transformer.wpe.weight"];
    for (let i = 0; i < E; i++) x[i] = wte.d[tok * E + i] + wpe.d[pos * E + i];
    const scala = 1 / Math.sqrt(hd);
    const nBlocchi = parseInt(elBlocchi.value, 10) || 1;
    const conResiduo = elResiduo.checked, conAtt = elAtt.checked, conMlp = elMlp.checked;
    for (let l = 0; l < nBlocchi && l < n_layer; l++) {
      const p = "transformer.h." + l + ".";
      const h = ln(x, T[p + "ln_1.weight"], sc.h);
      if (conAtt) {
        const qkv = matvec(T[p + "attn.c_attn.weight"], h, sc.qkv);
        const K = sc.cacheK[l], V = sc.cacheV[l];
        for (let i = 0; i < E; i++) { K[pos * E + i] = qkv[E + i]; V[pos * E + i] = qkv[2 * E + i]; }
        const y = sc.y.fill(0);
        const pesi = sc.pesi;
        for (let t = 0; t < H; t++) {
          const q0 = t * hd;
          let mx = -1e30;
          for (let j = 0; j < Tq; j++) {
            let s = 0;
            const k0 = j * E + q0;
            for (let i = 0; i < hd; i++) s += qkv[q0 + i] * K[k0 + i];
            s *= scala;
            pesi[j] = s; if (s > mx) mx = s;
          }
          let somma = 0;
          for (let j = 0; j < Tq; j++) { const e = Math.exp(pesi[j] - mx); pesi[j] = e; somma += e; }
          const inv = 1 / somma;
          for (let j = 0; j < Tq; j++) pesi[j] *= inv;
          for (let j = 0; j < Tq; j++) {
            const w = pesi[j];
            const v0 = j * E + q0;
            for (let i = 0; i < hd; i++) y[q0 + i] += w * V[v0 + i];
          }
        }
        const proi = matvec(T[p + "attn.c_proj.weight"], y, sc.proi);
        for (let i = 0; i < E; i++) x[i] = conResiduo ? x[i] + proi[i] : proi[i];
      }
      // senza attenzione, x resta quello che era: nessuna relazione fra le posizioni
      const h2 = ln(x, T[p + "ln_2.weight"], sc.h);
      if (conMlp) {
        const mlp = matvec(T[p + "mlp.c_proj.weight"], gelu(matvec(T[p + "mlp.c_fc.weight"], h2, sc.fc)), sc.mlp);
        for (let i = 0; i < E; i++) x[i] = conResiduo ? x[i] + mlp[i] : mlp[i];
      }
      for (let i = 0; i < E; i++) if (!Number.isFinite(x[i])) return { esploso: true };
    }
    const xf = ln(x, T["transformer.ln_f.weight"], sc.xf);
    const logits = matvec(wte, xf, sc.logits);
    for (let i = 0; i < logits.length; i++) if (!Number.isFinite(logits[i])) return { esploso: true };
    return { logits };
  }

  /* ---- la generazione, un carattere alla volta col seme fisso ---- */
  let seq = [], timer = null, fermo = false;
  function innesca() {
    seq = [];
    for (const ch of INNESCO) if (M.stoi[ch] !== undefined) seq.push(M.stoi[ch]);
    for (let p = 0; p < seq.length; p++) {
      const r = passoModello(seq[p], p);
      if (r.esploso) return "esploso";
    }
    return null;
  }
  function unCarattere() {
    const lg = passoModello(seq[seq.length - 1], seq.length - 1);
    if (lg.esploso) return "esploso";
    const temp = parseFloat(elT.value) || 0.8;
    const n = lg.logits.length;
    let mx = -1e30;
    for (let i = 0; i < n; i++) { lg.logits[i] /= temp; if (lg.logits[i] > mx) mx = lg.logits[i]; }
    let somma = 0;
    for (let i = 0; i < n; i++) { const e = Math.exp(lg.logits[i] - mx); lg.logits[i] = e; somma += e; }
    let r = rnd(), scelto = n - 1;
    for (let i = 0; i < n; i++) { r -= lg.logits[i] / somma; if (r <= 0) { scelto = i; break; } }
    seq.push(scelto);
    return seq.length >= M.cfg.block_size ? "pieno" : null;
  }
  function testoReso() {
    return seq.map((i) => M.voc[i]).join("").replace(/ /g, "␣").replace(/\n/g, "⏎\n");
  }
  function genera(finoA) {
    fermo = false;
    const limite = seq.length + (finoA || 120);
    elStato.textContent = "Generazione in corso…";
    function passo() {
      if (fermo) return;
      const esito = unCarattere();
      elTesto.textContent = testoReso();
      if (esito === "esploso") {
        elStato.textContent = "I numeri sono esplosi: senza la scorciatoia, i valori crescono a ogni strato e smettono di essere numeri. Rimettete la connessione residua e riprovate.";
        fermo = true;
        return;
      }
      if (esito === "pieno" || seq.length >= limite) {
        racconta();
        return;
      }
      timer = setTimeout(passo, 14);
    }
    passo();
  }
  function fermaGenerazione() {
    fermo = true;
    if (timer) { clearTimeout(timer); timer = null; }
  }

  /* ---- il racconto di che cosa si e' rotto ---- */
  function racconta() {
    const conResiduo = elResiduo.checked, conAtt = elAtt.checked, conMlp = elMlp.checked;
    const nBlocchi = parseInt(elBlocchi.value, 10) || 1;
    let msg = "";
    if (!conResiduo && (conAtt || conMlp)) {
      msg = "Senza la scorciatoia il segnale si perde a ogni strato: è il guasto che il pezzo descrive.";
    } else if (!conAtt && !conMlp) {
      msg = "Blocco vuoto: niente relazioni fra le parole, niente pensiero locale - resta solo il peso dell'uso delle lettere.";
    } else if (!conAtt) {
      msg = "Senza attenzione ogni parola pensa da sola: le frasi non si legano più.";
    } else if (!conMlp) {
      msg = "Senza MLP le parole si guardano ma non pensano: la scrittura gira a vuoto.";
    } else if (nBlocchi < M.cfg.n_layer) {
      msg = nBlocchi + " blocchi su " + M.cfg.n_layer + ": stessa macchina, più corta.";
    } else {
      msg = "Tutto acceso: il piccolo GPT continua lo stile della Commedia. Togliete un pezzo e guardate.";
    }
    elStato.textContent = msg;
  }

  /* ---- i comandi ---- */
  function resetta() {
    fermaGenerazione();
    rnd = mulberry32(seme);
    const esito = innesca();
    if (esito === "esploso") {
      elStato.textContent = "Co' sta configurazione i numeri esplodono già sull'innesco: rimettete la connessione residua.";
      elTesto.textContent = "";
      return;
    }
    elTesto.textContent = testoReso();
    racconta();
  }
  elGenera.addEventListener("click", () => {
    fermaGenerazione();
    rnd = mulberry32(seme);
    innesca();
    genera(120);
  });
  elRigenera.addEventListener("click", () => {
    fermaGenerazione();
    rnd = mulberry32(seme);
    innesca();
    genera(120);
  });
  elSeme.addEventListener("click", () => {
    seme = (Math.random() * 1e9) | 0;
    elStato.textContent = "Seme nuovo: " + seme + ".";
    resetta();
  });
  for (const el of [elResiduo, elAtt, elMlp, elBlocchi, elT]) {
    el.addEventListener("change", resetta);
  }
  elBlocchi.addEventListener("input", () => {
    elBlocchiV.textContent = elBlocchi.value;
  });
  elT.addEventListener("input", () => {
    elTV.textContent = parseFloat(elT.value).toFixed(2).replace(".", ",");
  });
  /* fuori schermo non si genera: il lavoro aspetta il rientro */
  let inVista = true, inGenerazione = false;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((voci) => {
      inVista = voci[0].isIntersecting;
      if (!inVista) { fermaGenerazione(); inGenerazione = false; }
    }).observe(radice);
  }

  /* ---- all'avvio ---- */
  elBlocchiV.textContent = elBlocchi.value;
  elTV.textContent = parseFloat(elT.value).toFixed(2).replace(".", ",");
  elGenera.disabled = true;
  elStato.textContent = "Carico il piccolo GPT della serie…";
  elTesto.textContent = "";
  carica().catch((e) => {
    elStato.textContent = "Non riesco a caricare il modello: " + e.message +
      ". Ricaricate la pagina per riprovare.";
  });
})();
