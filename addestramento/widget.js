/* Il widget «Le quattro fasi» dell'ultimo pezzo: lo stesso prompt
   passato di fase in fase dell'addestramento - preaddestrato, istruito
   (SFT), rifinito dalle preferenze (RLHF), rinforzato su ricompense
   verificabili (RLVR). Il carattere cambia a ogni fase, ed è il punto
   del pezzo: il sapere sta nel preaddestramento, la forma nell'
   istruzione, il gusto nelle preferenze, il ragionamento nel rinforzo.
   Le risposte sono una simulazione dichiarata: il modello vero non
   sta nel browser, ma la differenza di carattere sì. JavaScript puro,
   zero dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("ff-widget");
  if (!radice || radice.dataset.ffAvviato) return;
  radice.dataset.ffAvviato = "1";
  const elPrompt = document.getElementById("ff-prompt");
  const btnProva = document.getElementById("ff-prova");
  const preset = radice.querySelectorAll(".ff-preset");
  const fasi = radice.querySelectorAll(".ff-fase");
  const elTesto = document.getElementById("ff-testo");
  const elStato = document.getElementById("ff-stato");
  if (!elPrompt || !btnProva || !elTesto || !elStato) return;

  /* ---- le risposte per fase: simulazione dichiarata ---- */
  const PRESET_DOMANDE = {
    capitale: "Qual è la capitale della Francia?",
    somma: "Quanto fa 23 + 19?",
    poesia: "Scrivimi una poesia di due versi sul mare.",
  };
  const RISPOSTE = {
    capitale: {
      pre: "Qual è la capitale della Francia? La capitale della Francia è una città che si trova in Francia, e la Francia è un paese d'Europa, e i paesi d'Europa hanno capitali, e…",
      sft: "La capitale della Francia è Parigi.",
      rlhf: "Certamente! La capitale della Francia è Parigi, una delle città più visitate del mondo. Se volete, posso dirvi anche qualcosa sulla sua storia.",
      rlvr: "Vediamo. La domanda chiede la capitale della Francia. Devo ricordare che la Francia è un paese d'Europa, e la sua capitale è Parigi. Verifico: sì, Parigi è la capitale della Francia. La risposta è: Parigi. Aha, ci sono arrivato!",
    },
    somma: {
      pre: "Quanto fa 23 + 19? 23 + 19 fa 23 + 19, e 23 + 19 è una somma che si può fare con i numeri, e i numeri sono…",
      sft: "23 + 19 fa 42.",
      rlhf: "Con piacere! 23 + 19 fa 42. Se volete, vi spiego come si arriva al risultato, passo per passo.",
      rlvr: "Calcolo: 23 + 19. Scompongo: 20 + 10 = 30, e 3 + 9 = 12. Poi 30 + 12 = 42. Verifico con un altro metodo: 23 + 20 = 43, meno 1 = 42. La risposta è 42. Aha, ci sono arrivato!",
    },
    poesia: {
      pre: "Scrivimi una poesia di due versi sul mare. Una poesia di due versi sul mare, e il mare è grande, e il mare è blu, e…",
      sft: "Il mare respira piano sulla riva, / e porta con sé il ricordo della sera.",
      rlhf: "Ecco a voi, con tutto il mio affetto: Il mare respira piano sulla riva, / e porta con sé il ricordo della sera. Spero vi piaccia!",
      rlvr: "Obiettivo: una poesia di due versi sul mare. Vincoli: due versi, tema mare. Penso a un'immagine: il respiro del mare, la sera. Provo: «Il mare respira piano sulla riva, / e porta con sé il ricordo della sera». Verifico: due versi, tema rispettato. Aha, ci sono arrivato!",
    },
    libera: {
      pre: null, // costruita dal prompt
      sft: "Non ho una risposta pronta per questa domanda, ma posso provare a pensarci insieme.",
      rlhf: "Grazie per la domanda, è interessante! Non sono del tutto sicuro di avere la risposta giusta, ma ci ragiono volentieri con voi.",
      rlvr: null, // costruita dal prompt
    },
  };
  function continuaTesto(prompt) {
    const parole = prompt.trim().split(/\s+/).filter(Boolean);
    if (parole.length < 2) return "…e la frase continua, e la frase continua, e…";
    const coda = parole.slice(-4).join(" ");
    return prompt.trim() + " " + coda + ", e " + coda + ", e…";
  }
  function catenaRagionamento(prompt) {
    return "Obiettivo: rispondere alla domanda. La domanda è: «" + prompt.trim() + "». " +
      "Scompongo il problema in passi, verifico ogni passaggio, e solo alla fine rispondo. " +
      "Il mio ragionamento è arrivato a una conclusione che posso verificare. Aha, ci sono arrivato!";
  }

  /* ---- le fasi: la descrizione che il pezzo dà ---- */
  const FASI = [
    { id: "pre", nome: "Preaddestrato", riga: "continua il testo" },
    { id: "sft", nome: "Istruito", riga: "risponde" },
    { id: "rlhf", nome: "Rifinito dalle preferenze", riga: "il gusto umano" },
    { id: "rlvr", nome: "Rinforzato", riga: "ragiona prima di rispondere" },
  ];
  let faseCorrente = "pre";
  let timer = null;

  function rispostaPer(prompt, fase) {
    const chiave = Object.keys(PRESET_DOMANDE).find((k) => PRESET_DOMANDE[k] === prompt) || "libera";
    if (chiave === "libera") {
      if (fase === "pre") return continuaTesto(prompt);
      if (fase === "rlvr") return catenaRagionamento(prompt);
      return RISPOSTE.libera[fase];
    }
    return RISPOSTE[chiave][fase];
  }

  /* ---- la digitazione, una lettera alla volta ---- */
  function digita(testo) {
    ferma();
    elTesto.textContent = "";
    elTesto.classList.add("ff-testo--scrive");
    let i = 0;
    timer = setInterval(() => {
      i = Math.min(i + 3, testo.length);       // tre lettere per tick, scorre veloce
      elTesto.textContent = testo.slice(0, i);
      if (i >= testo.length) {
        clearInterval(timer); timer = null;
        elTesto.classList.remove("ff-testo--scrive");
        elStato.textContent = "Lo stesso prompt, il carattere di questa fase. Cambiate fase e guardate come cambia la risposta.";
      }
    }, 12);
  }
  function ferma() {
    if (timer) { clearInterval(timer); timer = null; }
    elTesto.classList.remove("ff-testo--scrive");
  }

  /* ---- i comandi ---- */
  function aggiornaFase() {
    for (const f of fasi) {
      const attiva = f.dataset.fase === faseCorrente;
      f.setAttribute("aria-pressed", String(attiva));
    }
    const prompt = elPrompt.value.trim() || PRESET_DOMANDE.capitale;
    digita(rispostaPer(prompt, faseCorrente));
  }
  for (const f of fasi) {
    f.addEventListener("click", () => {
      faseCorrente = f.dataset.fase;
      aggiornaFase();
    });
  }
  for (const b of preset) {
    b.addEventListener("click", () => {
      elPrompt.value = PRESET_DOMANDE[b.dataset.preset];
      aggiornaFase();
    });
  }
  btnProva.addEventListener("click", aggiornaFase);
  elPrompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); aggiornaFase(); }
  });
  /* fuori schermo la digitazione si ferma */
  let inVista = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((voci) => {
      inVista = voci[0].isIntersecting;
      if (!inVista) ferma();
    }).observe(radice);
  }

  /* ---- all'avvio: la capitale, fase per fase ---- */
  elPrompt.value = PRESET_DOMANDE.capitale;
  aggiornaFase();
})();
