/* Il widget «Costruisci la scheda» del pezzo sulle architetture: il
   lettore monta un modello - forma, natura densa o mista, taglie,
   attenzione, finestra - e vede il conto che la serie ha insegnato:
   memoria dei pesi, moltiplicazioni per token, cache di chiavi e
   valori. Poi può spegnere la documentazione e guardare che cosa resta
   leggibile: la prova del pezzo sui modelli muti. I conti sono stime
   dichiarate della serie (2 byte per parametro, 32 strati e 128
   dimensioni per testa per la cache). JavaScript puro, zero dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("sc-widget");
  if (!radice || radice.dataset.scAvviato) return;
  radice.dataset.scAvviato = "1";
  const forma = radice.querySelectorAll(".sc-forma");
  const natura = radice.querySelectorAll(".sc-natura");
  const attenzione = radice.querySelectorAll(".sc-attenzione");
  const presets = radice.querySelectorAll(".sc-preset");
  const elTot = document.getElementById("sc-tot");
  const elTotV = document.getElementById("sc-tot-v");
  const elAttivi = document.getElementById("sc-attivi");
  const elAttiviV = document.getElementById("sc-attivi-v");
  const elAttiviBox = document.getElementById("sc-attivi-box");
  const elFin = document.getElementById("sc-finestra");
  const elFinV = document.getElementById("sc-finestra-v");
  const elDoc = document.getElementById("sc-documentato");
  const righe = radice.querySelectorAll("[data-scheda]");
  const elMemo = document.getElementById("sc-memo");
  const elConto = document.getElementById("sc-conto");
  const elCache = document.getElementById("sc-cache");
  const elRapporto = document.getElementById("sc-rapporto");
  if (!elTot || !elTotV || !elAttivi || !elAttiviV || !elAttiviBox ||
      !elFin || !elFinV || !elDoc || !elMemo || !elConto || !elCache || !elRapporto) return;

  const stato = {
    forma: "decoder",
    natura: "denso",
    attenzione: "teste",
  };

  /* Le taglie: logaritmiche, come si leggono le schede vere. */
  const TOT_MIN = 8, TOT_MAX = 12;              // 10^8 = 100M  →  10^12 = 1.000M
  const FIN_MIN = 3, FIN_MAX = 6;               // 10^3 = 1K    →  10^6 = 1M
  function scala(el, min, max) {
    const x = parseFloat(el.value) || 0;
    return Math.pow(10, min + (x / 100) * (max - min));
  }
  function formatta(n) {
    if (n >= 1e12) return (n / 1e12).toFixed(2).replace(".", ",") + " mila miliardi";
    if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e11 ? 0 : 1).replace(".", ",") + " miliardi";
    if (n >= 1e6) return (n / 1e6).toFixed(0) + " milioni";
    return Math.round(n).toLocaleString("it-IT");
  }
  function formattaGB(b) {
    if (b >= 1e12) return (b / 1e12).toFixed(2).replace(".", ",") + " TB";
    if (b >= 1e9) return (b / 1e9).toFixed(1).replace(".", ",") + " GB";
    return (b / 1e6).toFixed(0) + " MB";
  }
  function it(x, cifre) {
    return x.toFixed(cifre == null ? 1 : cifre).replace(".", ",");
  }

  /* I preset: i numeri dichiarati nei rapporti, come il pezzo li cita. */
  const PRESET = {
    "gpt2": { forma: "decoder", natura: "denso", attenzione: "teste", tot: 124e6, attivi: 1, fin: 1024 },
    "gpt3": { forma: "decoder", natura: "denso", attenzione: "teste", tot: 175e9, attivi: 1, fin: 2048 },
    "deepseek": { forma: "decoder", natura: "misto", attenzione: "mla", tot: 671e9, attivi: 37e9, fin: 128000 },
    "qwen3": { forma: "decoder", natura: "misto", attenzione: "gqa", tot: 235e9, attivi: 22e9, fin: 32000 },
  };
  function posizionaLog(val, min, max) {
    const x = Math.log10(val);
    return Math.round(((x - min) / (max - min)) * 100);
  }

  /* ---- la resa della scheda ---- */
  function aggiorna() {
    const documentato = elDoc.checked;
    const tot = scala(elTot, TOT_MIN, TOT_MAX);
    const pctAttivi = parseFloat(elAttivi.value) || 5;
    const attivi = stato.natura === "misto" ? tot * pctAttivi / 100 : tot;
    const fin = Math.round(scala(elFin, FIN_MIN, FIN_MAX));
    const doc = documentato;
    // i conti: stime dichiarate della serie
    const memoB = tot * 2;                                  // 2 byte per parametro
    const contoN = attivi;                                  // una moltiplicazione per parametro attivo
    const cacheB = fin * 2 * 32 * 128 * 2;                  // K e V, 32 strati, 128 dim, 2 byte
    // le righe della scheda
    for (const r of righe) {
      const cosa = r.dataset.scheda;
      const val = r.querySelector("[data-valore]");
      if (!doc && (cosa === "tot" || cosa === "attivi" || cosa === "attenzione" || cosa === "memo" || cosa === "conto" || cosa === "cache" || cosa === "rapporto")) {
        val.textContent = "non dichiarato";
        continue;
      }
      if (cosa === "forma") val.textContent = { encoder: "encoder-only", decoder: "decoder-only", encdec: "encoder-decoder" }[stato.forma];
      else if (cosa === "natura") val.textContent = stato.natura === "denso" ? "denso" : "misto (MoE)";
      else if (cosa === "attenzione") val.textContent = { teste: "a teste piene", gqa: "GQA", mla: "MLA" }[stato.attenzione];
      else if (cosa === "tot") val.textContent = formatta(tot) + " totali";
      else if (cosa === "attivi") val.textContent = stato.natura === "misto" ? formatta(attivi) + " attivi" : "tutti (denso)";
      else if (cosa === "finestra") val.textContent = fin.toLocaleString("it-IT") + " token";
      else if (cosa === "memo") val.textContent = formattaGB(memoB);
      else if (cosa === "conto") val.textContent = formatta(contoN) + " per token";
      else if (cosa === "cache") val.textContent = formattaGB(cacheB);
      else if (cosa === "rapporto") val.textContent = stato.natura === "misto" ? "1 su " + Math.round(100 / pctAttivi) : "-";
    }
    // le barre, proporzionali al log dei conti
    const barre = radieceBarre();
    const valori = { memo: memoB, conto: contoN, cache: cacheB };
    for (const b of barre) {
      const nome = b.dataset.barra;
      const span = b.querySelector("span");
      if (!doc) { span.style.width = "0%"; continue; }
      const v = valori[nome];
      const frac = (Math.log10(v + 1) - 6) / (13 - 6);
      span.style.width = Math.max(2, Math.min(100, frac * 100)).toFixed(1) + "%";
    }
    // l'etichetta dei parametri attivi
    elTotV.textContent = formatta(tot);
    elAttiviV.textContent = stato.natura === "misto" ? it(pctAttivi, 0) + "% dei totali" : "-";
    elFinV.textContent = fin.toLocaleString("it-IT");
    elAttiviBox.classList.toggle("sc-nascosto", stato.natura !== "misto");
    elRapporto.textContent = stato.natura === "misto" ? "1 su " + Math.round(100 / pctAttivi) : "-";
    const nota = radice.querySelector(".sc-nota");
    if (nota) {
      nota.textContent = doc
        ? "Scheda documentata: i numeri stanno lì, si possono verificare. Ora spegnete la casella e guardate."
        : "Scheda muta: capacità e valutazioni, niente architettura. Senza i numeri il conto non si fa - è la differenza che questo pezzo insegna a vedere.";
    }
  }
  let barreCache = null;
  function radieceBarre() {
    if (!barreCache) barreCache = [...radice.querySelectorAll("[data-barra]")];
    return barreCache;
  }

  /* ---- i comandi ---- */
  function impostaPreset(p) {
    const d = PRESET[p];
    if (!d) return;
    stato.forma = d.forma; stato.natura = d.natura; stato.attenzione = d.attenzione;
    elTot.value = posizionaLog(d.tot, TOT_MIN, TOT_MAX);
    elAttivi.value = d.natura === "misto" ? Math.round(d.attivi / d.tot * 100) : 5;
    elFin.value = posizionaLog(d.fin, FIN_MIN, FIN_MAX);
    for (const b of forma) b.setAttribute("aria-pressed", String(b.dataset.forma === d.forma));
    for (const b of natura) b.setAttribute("aria-pressed", String(b.dataset.natura === d.natura));
    for (const b of attenzione) b.setAttribute("aria-pressed", String(b.dataset.attenzione === d.attenzione));
    aggiorna();
  }
  for (const b of forma) b.addEventListener("click", () => {
    stato.forma = b.dataset.forma;
    for (const x of forma) x.setAttribute("aria-pressed", String(x === b));
    aggiorna();
  });
  for (const b of natura) b.addEventListener("click", () => {
    stato.natura = b.dataset.natura;
    for (const x of natura) x.setAttribute("aria-pressed", String(x === b));
    aggiorna();
  });
  for (const b of attenzione) b.addEventListener("click", () => {
    stato.attenzione = b.dataset.attenzione;
    for (const x of attenzione) x.setAttribute("aria-pressed", String(x === b));
    aggiorna();
  });
  for (const b of presets) b.addEventListener("click", () => impostaPreset(b.dataset.preset));
  for (const el of [elTot, elAttivi, elFin, elDoc]) el.addEventListener("input", aggiorna);

  /* ---- all'avvio: la scheda di DeepSeek-V3, la più letta del pezzo ---- */
  impostaPreset("deepseek");
})();
