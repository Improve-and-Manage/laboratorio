/* Il widget «Il router e la memoria» del pezzo sulle evoluzioni: due
   pannelli. Il router instrada ogni token della frase del lettore a due
   esperti su sei, con regole dichiarate (non è il router vero: è la
   meccanica, personificata). La cache mostra la generazione passo
   passo: senza cache ogni passo ricalcola da capo tutte le posizioni
   già scritte; con la cache se ne calcola una sola e le altre si
   rileggono - il risparmio del pezzo. JavaScript puro, zero
   dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("mc-widget");
  if (!radice || radice.dataset.mcAvviato) return;
  radice.dataset.mcAvviato = "1";
  const elFrase = document.getElementById("mc-frase");
  const elApplica = document.getElementById("mc-applica");
  const elToken = document.getElementById("mc-token");
  const elContatore = document.getElementById("mc-contatore");
  const elGenera = document.getElementById("mc-genera");
  const elRicomincia = document.getElementById("mc-cache-ricomincia");
  const elCache = document.getElementById("mc-cache");
  const elBilancio = document.getElementById("mc-bilancio");
  if (!elFrase || !elApplica || !elToken || !elContatore ||
      !elGenera || !elRicomincia || !elCache || !elBilancio) return;

  /* ---- il router: sei esperti, regole dichiarate ---- */
  const ESPERTI = [
    { nome: "parole comuni", desc: "articoli, congiunzioni, preposizioni" },
    { nome: "verbi", desc: "le azioni e i modi di essere" },
    { nome: "nomi propri", desc: "le maiuscole, i luoghi, i nomi" },
    { nome: "numeri", desc: "le cifre e i conti" },
    { nome: "punteggiatura", desc: "i segni che separano" },
    { nome: "parole rare", desc: "le lunghe, le insolite" },
  ];
  const VERBI = ["è", "e'", "sono", "era", "impara", "imparano", "imparare", "continua", "continua", "corre", "legge", "scrive", "dice", "fa", "fare", "vede", "guarda", "parla", "sa", "vuole", "può", "puo'", "viene", "resta", "sale", "scende"];
  function punteggiEsperti(token) {
    const p = token.toLowerCase();
    const s = [0, 0, 0, 0, 0, 0];
    if (/^\d+$/.test(p)) { s[3] = 1; return s; }          // numeri
    if (/^[^\wàèéìòù']+$/.test(p)) { s[4] = 1; return s; } // punteggiatura
    if (/^[A-ZÀÈÉÌÒÙ]/.test(p)) s[2] += 0.9;               // maiuscola: nome proprio
    if (VERBI.includes(p)) s[1] += 1;
    if (p.length <= 4 && s[1] === 0 && s[2] === 0) s[0] += 1;
    if (p.length >= 9) s[5] += 0.8;
    // un po' di mescolanza: il router vero non e' cosi' netto
    if (s[1] === 0 && s[2] === 0) s[0] += 0.3;
    if (s[0] === 0 && s[1] === 0 && s[2] === 0 && s[5] === 0) s[5] += 0.5;
    // i due migliori
    const ord = ESPERTI.map((e, i) => ({ i, s: s[i] })).sort((a, b) => b.s - a.s);
    const top = ord.slice(0, 2);
    const out = s.slice();
    for (let i = 0; i < ESPERTI.length; i++) {
      if (top[0].i !== i && top[1].i !== i) out[i] = 0;
    }
    return out;
  }
  function tokenizza(t) {
    return t.match(/[\wàèéìòù']+|[^\w\s]/g) || [];
  }
  function instrada() {
    const token = tokenizza(elFrase.value);
    elToken.innerHTML = "";
    if (token.length === 0) {
      elContatore.textContent = "Scrivete una frase per instradarla.";
      return;
    }
    const attiviPerToken = [];
    for (const t of token) {
      const p = punteggiEsperti(t);
      attiviPerToken.push(p);
      const chip = document.createElement("div");
      chip.className = "mc-chip";
      const nome = document.createElement("span");
      nome.className = "mc-chip-nome";
      nome.textContent = t;
      const riga = document.createElement("span");
      riga.className = "mc-chip-esperti";
      const attivi = ESPERTI.map((e, i) => ({ e, v: p[i] }))
        .filter((o) => o.v > 0).map((o) => o.e.nome);
      riga.textContent = attivi.length ? attivi.join(" · ") : "nessuno";
      chip.appendChild(nome);
      chip.appendChild(riga);
      elToken.appendChild(chip);
    }
    const totaliAttivi = attiviPerToken.reduce((a, r) => a + r.filter((x) => x > 0).length, 0);
    elContatore.textContent = "Due esperti per token, come i modelli del pezzo: DeepSeek ne attiva 37 su 671, Qwen 22 su 235.";
  }
  elApplica.addEventListener("click", instrada);
  elFrase.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); instrada(); }
  });

  /* ---- la cache: la generazione passo passo ---- */
  let passo = 0, timer = null, tokenLista = [];
  function mostraCache() {
    const token = tokenLista;
    elCache.innerHTML = "";
    if (token.length === 0) return;
    // i token come chip: si accendono uno alla volta
    const rigaChip = document.createElement("div");
    rigaChip.className = "mc-cache-chip";
    token.forEach((t, i) => {
      const chip = document.createElement("span");
      chip.className = "mc-cache-token" + (i < passo ? " mc-cache-token--fatto" : "");
      chip.textContent = t;
      rigaChip.appendChild(chip);
    });
    elCache.appendChild(rigaChip);
    // i due contatori, con le barre del lavoro rifatto
    if (passo === 0) {
      elBilancio.textContent = "Premete «Genera»: la frase si scrive un token alla volta, e vedete che cosa la cache risparmia.";
      return;
    }
    const n = token.length;
    const senzaTot = (n * (n + 1)) / 2;
    const conTot = n;
    const lavoro = document.createElement("div");
    lavoro.className = "mc-cache-lavoro";
    const senza = document.createElement("div");
    senza.className = "mc-cache-conto";
    senza.innerHTML = "<span class=\"mc-cache-conto-nome\">senza cache</span><span class=\"mc-pista\"><span class=\"mc-piena mc-piena--tutta\"></span></span><span class=\"mc-cache-conto-v\">" + senzaTot + " posizioni rifatte</span>";
    const con = document.createElement("div");
    con.className = "mc-cache-conto";
    const ricordati = passo * 2 * 8;
    con.innerHTML = "<span class=\"mc-cache-conto-nome\">con cache</span><span class=\"mc-pista\"><span class=\"mc-piena mc-piena--poca\"></span></span><span class=\"mc-cache-conto-v\">" + conTot + " nuove, " + ricordati + " ricordate</span>";
    lavoro.appendChild(senza);
    lavoro.appendChild(con);
    elCache.appendChild(lavoro);
    elBilancio.textContent = "Senza cache ogni passo rifà tutto da capo (1+2+…+" + n + " = " + senzaTot +
      "). Con la cache ogni passo calcola una posizione sola e rilegge le altre - il risparmio del pezzo, che nanoGPT per chiarezza non usa.";
  }
  function unPasso() {
    if (passo >= tokenLista.length) {
      timer = null;
      elGenera.disabled = false;
      return;
    }
    passo++;
    mostraCache();
    if (passo < tokenLista.length) timer = setTimeout(unPasso, 650);
    else { timer = null; elGenera.disabled = false; }
  }
  elGenera.addEventListener("click", () => {
    if (timer) { clearTimeout(timer); timer = null; }
    tokenLista = tokenizza(elFrase.value);
    if (tokenLista.length === 0) { elBilancio.textContent = "Scrivete una frase per generarla."; return; }
    passo = 0;
    elGenera.disabled = true;
    unPasso();
  });
  elRicomincia.addEventListener("click", () => {
    if (timer) { clearTimeout(timer); timer = null; }
    passo = 0;
    elGenera.disabled = false;
    mostraCache();
  });
  /* fuori schermo la generazione si ferma */
  let inVista = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((voci) => {
      inVista = voci[0].isIntersecting;
      if (!inVista && timer) { clearTimeout(timer); timer = null; elGenera.disabled = false; }
    }).observe(radice);
  }

  /* ---- all'avvio ---- */
  elFrase.value = "La rete impara 3 errori, e poi continua.";
  instrada();
  tokenLista = tokenizza(elFrase.value);
  mostraCache();
})();
