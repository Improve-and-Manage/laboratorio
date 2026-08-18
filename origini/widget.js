/* Il widget «La macchina-bambina» del primo pezzo: la scena di Turing
   del 1950, presa alla lettera. Una macchina-bambina sceglie fra due
   azioni davanti a uno stimolo; il lettore e' l'insegnante e giudica
   ogni scelta con una ricompensa o una punizione. Le probabilita' si
   regolano da sole - «un segnale di ricompensa aumentava la
   probabilita' di ripetizione degli eventi che l'avevano preceduta» -
   e se il lettore e' coerente, la macchina impara la sua regola.
   JavaScript puro, zero dipendenze. */
(() => {
  "use strict";
  const radice = document.getElementById("mb-widget");
  if (!radice || radice.dataset.mbAvviato) return;
  radice.dataset.mbAvviato = "1";
  const scena = document.getElementById("mb-scena");
  const stimolo = document.getElementById("mb-stimolo");
  const bambina = document.getElementById("mb-bambina");
  const elScelta = document.getElementById("mb-scelta");
  const barraSx = document.getElementById("mb-barra-sx");
  const barraDx = document.getElementById("mb-barra-dx");
  const valSx = document.getElementById("mb-val-sx");
  const valDx = document.getElementById("mb-val-dx");
  const btnPremio = document.getElementById("mb-premio");
  const btnPunizione = document.getElementById("mb-punizione");
  const btnGiro = document.getElementById("mb-giro");
  const btnRicomincia = document.getElementById("mb-ricomincia");
  const elStato = document.getElementById("mb-stato");
  const elGiri = document.getElementById("mb-giri");
  if (!scena || !stimolo || !bambina || !elScelta || !barraSx || !barraDx ||
      !valSx || !valDx || !btnPremio || !btnPunizione || !btnGiro || !btnRicomincia ||
      !elStato || !elGiri) return;

  /* Due stimoli, due azioni. I punteggi tengono la memoria dei giudizi:
     la probabilita' di un'azione e' la softmax dei suoi punti. */
  const STIMOLI = ["quadrato", "cerchio"];
  let punti = { quadrato: [0, 0], cerchio: [0, 0] };
  let stimoloCorrente = "quadrato";
  let azioneScelta = 0;         // 0 = sinistra, 1 = destra
  let giri = 0, giudicato = true, imparato = false;

  function proba(stim, az) {
    const [s, d] = punti[stim];
    const eS = Math.exp(s), eD = Math.exp(d);
    return az === 0 ? eS / (eS + eD) : eD / (eS + eD);
  }
  function scegli() {
    const r = Math.random();
    azioneScelta = r < proba(stimoloCorrente, 0) ? 0 : 1;
  }
  function resa() {
    // lo stimolo
    stimolo.classList.toggle("mb-stimolo--quadrato", stimoloCorrente === "quadrato");
    stimolo.classList.toggle("mb-stimolo--cerchio", stimoloCorrente === "cerchio");
    stimolo.textContent = stimoloCorrente === "quadrato" ? "◼" : "●";
    // la bambina: a sinistra o a destra dello stimolo
    scena.classList.toggle("mb-bambina--sx", azioneScelta === 0);
    scena.classList.toggle("mb-bambina--dx", azioneScelta === 1);
    bambina.textContent = azioneScelta === 0 ? "←" : "→";
    elScelta.textContent = "La macchina-bambina sceglie di andare " +
      (azioneScelta === 0 ? "a sinistra" : "a destra") + ".";
    // le barre
    const pS = proba(stimoloCorrente, 0), pD = proba(stimoloCorrente, 1);
    barraSx.style.width = (pS * 100).toFixed(1) + "%";
    barraDx.style.width = (pD * 100).toFixed(1) + "%";
    valSx.textContent = Math.round(pS * 100) + "%";
    valDx.textContent = Math.round(pD * 100) + "%";
  }
  function nuovoGiro() {
    if (!giudicato) {
      elStato.textContent = "Prima giudicate la scelta: ricompensa o punizione.";
      return;
    }
    stimoloCorrente = STIMOLI[Math.floor(Math.random() * 2)];
    scegli();
    giudicato = false;
    btnPremio.disabled = false;
    btnPunizione.disabled = false;
    btnGiro.disabled = true;
    elStato.textContent = giri === 0
      ? "Sono la macchina-bambina di Turing. Giudicate la mia scelta: ricompensa o punizione."
      : "Giudicate anche questa scelta: ricompensa o punizione.";
    resa();
  }
  function giudica(segno, parola) {
    if (giudicato) return;
    punti[stimoloCorrente][azioneScelta] += segno;
    giri++;
    giudicato = true;
    btnPremio.disabled = true;
    btnPunizione.disabled = true;
    btnGiro.disabled = false;
    elGiri.textContent = giri;
    resa();
    // ha imparato quando per entrambi gli stimoli una azione e' schiacciante
    const stabile = STIMOLI.every((s) => Math.max(proba(s, 0), proba(s, 1)) > 0.85);
    if (stabile && !imparato) {
      imparato = true;
      const regola = STIMOLI.map((s) => s + " → " + (proba(s, 0) > 0.5 ? "sinistra" : "destra")).join(", ");
      elStato.textContent = "La macchina-bambina ha imparato la vostra regola (" + regola +
        "): premi e punizioni hanno cambiato le probabilità, come Turing aveva scritto nel 1950. Continuate a giudicare, o ricominciate.";
    } else {
      elStato.textContent = parola + " Anche questa scelta è registrata: la prossima volta la probabilità sarà un po' diversa.";
    }
  }
  btnPremio.addEventListener("click", () => giudica(1, "Ricompensa: la probabilità di ripetere questa scelta sale."));
  btnPunizione.addEventListener("click", () => giudica(-1, "Punizione: la probabilità di ripetere questa scelta scende."));
  btnGiro.addEventListener("click", nuovoGiro);
  btnRicomincia.addEventListener("click", () => {
    punti = { quadrato: [0, 0], cerchio: [0, 0] };
    giri = 0; giudicato = true; imparato = false;
    elGiri.textContent = 0;
    elStato.textContent = "Punteggi azzerati: la macchina-bambina è di nuovo senza regole. «Un altro giro» per ricominciare.";
    nuovoGiro();
  });

  /* ---- all'avvio ---- */
  elGiri.textContent = 0;
  nuovoGiro();
})();
