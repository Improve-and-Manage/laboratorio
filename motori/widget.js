// Motori a confronto: il tool del pezzo sui motori di esecuzione.
// I punteggi (1-5) sono il giudizio della serie, fondato sulle capacita'
// documentate nel pezzo; i pesi sono di chi legge. JS puro, zero dipendenze.
(function () {
  "use strict";
  var MOTORI = [
    { nome: "llama.cpp",       hw: ["mac", "nvidia", "cpu"], p: [5, 3, 5, 2] },
    { nome: "MLX",             hw: ["mac"],                  p: [4, 4, 5, 2] },
    { nome: "DwarfStar",       hw: ["mac", "nvidia"],        p: [2, 4, 5, 3] },
    { nome: "vLLM",            hw: ["nvidia"],               p: [3, 5, 3, 5] },
    { nome: "SGLang",          hw: ["nvidia"],               p: [3, 5, 3, 5] },
    { nome: "TensorRT-LLM",    hw: ["nvidia"],               p: [2, 5, 4, 5] },
    { nome: "TGI",             hw: ["nvidia"],               p: [3, 4, 3, 5] },
    { nome: "Ollama",          hw: ["mac", "nvidia", "cpu"], p: [5, 3, 4, 2] },
    { nome: "ExLlama",         hw: ["nvidia"],               p: [3, 4, 4, 1] },
    { nome: "CTranslate2",     hw: ["cpu", "nvidia"],        p: [3, 3, 4, 3] }
  ];
  var ETICHETTE = ["Facilità", "Velocità", "Memoria", "Serving"];
  var widget = document.getElementById("mw-widget");
  if (!widget) return;
  var tabella = widget.querySelector(".mw-tabella");
  var esito = widget.querySelector(".mw-esito");
  var hw = "qualsiasi";
  var pesi = [0, 0, 0, 0];
  var righe = [];
  var sliderIds = ["mw-fac", "mw-vel", "mw-mem", "mw-serv"];
  var valoreIds = ["mw-fac-v", "mw-vel-v", "mw-mem-v", "mw-serv-v"];

  // intestazione
  var riga0 = document.createElement("div");
  riga0.className = "mw-riga mw-intestazione";
  var c = document.createElement("span"); c.className = "mw-cell mw-nome"; c.textContent = "Motore";
  riga0.appendChild(c);
  ETICHETTE.forEach(function (e) {
    var x = document.createElement("span"); x.className = "mw-cell"; x.textContent = e;
    riga0.appendChild(x);
  });
  var t = document.createElement("span"); t.className = "mw-cell mw-tot"; t.textContent = "Totale";
  riga0.appendChild(t);
  tabella.appendChild(riga0);

  // righe dei motori
  MOTORI.forEach(function (m) {
    var riga = document.createElement("div");
    riga.className = "mw-riga";
    var nome = document.createElement("span"); nome.className = "mw-cell mw-nome"; nome.textContent = m.nome;
    riga.appendChild(nome);
    m.p.forEach(function (v) {
      var x = document.createElement("span"); x.className = "mw-cell"; x.textContent = v;
      riga.appendChild(x);
    });
    var tot = document.createElement("span"); tot.className = "mw-cell mw-tot"; tot.textContent = "–";
    riga.appendChild(tot);
    tabella.appendChild(riga);
    righe.push(riga);
  });

  function leggiPesi() {
    for (var k = 0; k < 4; k++) {
      pesi[k] = parseInt(document.getElementById(sliderIds[k]).value, 10) || 0;
      document.getElementById(valoreIds[k]).textContent = pesi[k];
    }
  }

  function aggiorna() {
    leggiPesi();
    var somma = pesi[0] + pesi[1] + pesi[2] + pesi[3];
    var max = -1;
    var migliori = [];
    MOTORI.forEach(function (m, i) {
      if (hw !== "qualsiasi" && m.hw.indexOf(hw) === -1) {
        righe[i].classList.add("mw-escluso");
        righe[i].classList.remove("mw-vince");
        return;
      }
      righe[i].classList.remove("mw-escluso");
      var tot = 0;
      for (var k = 0; k < 4; k++) tot += m.p[k] * pesi[k];
      righe[i].querySelector(".mw-tot").textContent = somma === 0 ? "–" : tot;
      righe[i].classList.remove("mw-vince");
      if (tot > max) { max = tot; migliori = [i]; }
      else if (tot === max) migliori.push(i);
    });
    if (somma === 0) {
      esito.textContent = "Date un peso almeno a una funzionalità: la riga del motore migliore si accenderà.";
      return;
    }
    migliori.forEach(function (i) { righe[i].classList.add("mw-vince"); });
    var nomi = migliori.map(function (i) { return MOTORI[i].nome; });
    esito.textContent = migliori.length === 1
      ? "Per i vostri pesi, il motore migliore è " + nomi[0] + "."
      : "Per i vostri pesi, i motori migliori sono " + nomi.join(", ") + " (a parità).";
  }

  widget.querySelectorAll(".mw-hardware button").forEach(function (b) {
    b.addEventListener("click", function () {
      widget.querySelectorAll(".mw-hardware button").forEach(function (x) {
        x.classList.remove("attiva"); x.setAttribute("aria-pressed", "false");
      });
      b.classList.add("attiva"); b.setAttribute("aria-pressed", "true");
      hw = b.getAttribute("data-hw");
      aggiorna();
    });
  });
  sliderIds.forEach(function (id) {
    document.getElementById(id).addEventListener("input", aggiorna);
  });
  aggiorna();
})();
