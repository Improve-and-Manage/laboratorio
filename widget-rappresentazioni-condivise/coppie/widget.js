(() => {
  const root = document.querySelector('[data-cp-widget]');
  if (!root) return;

  const scenes = {
    scena: {
      left: '<svg viewBox="0 0 180 110" aria-label="Cono blu davanti a una sfera rossa" role="img"><circle cx="125" cy="61" r="25" fill="#a6431e"/><path d="M30 85 60 20 90 85Z" fill="#1c6b66"/><path d="M22 87h112" stroke="currentColor" opacity=".18"/></svg>',
      right: '<svg viewBox="0 0 180 110" aria-label="La stessa scena vista dal lato opposto" role="img"><circle cx="55" cy="61" r="25" fill="#a6431e"/><path d="M90 85 120 20 150 85Z" fill="#1c6b66"/><path d="M44 87h114" stroke="currentColor" opacity=".18"/></svg>',
      common: 'la stessa scena', strength: 'high',
      result: 'Cambiano posizione e punto di vista; l’oggetto comune resta riconoscibile.'
    },
    testo: {
      left: '«Il laboratorio chiuse tardi. Sul tavolo restò…»',
      right: '«…un quaderno aperto accanto alla lampada.»',
      common: 'lo stesso documento', strength: 'low',
      result: 'La vicinanza nel documento è un legame, ma non garantisce due viste dello stesso oggetto.'
    },
    token: {
      left: '«La porta è dietro la…»',
      right: '«…parete»',
      common: 'la continuazione', strength: 'low',
      result: 'Qui la seconda parte è ciò che viene dopo: il compito premia la previsione locale.'
    }
  };

  const left = root.querySelector('[data-cp-left]');
  const right = root.querySelector('[data-cp-right]');
  const common = root.querySelector('[data-cp-common]');
  const result = root.querySelector('[data-cp-result]');

  root.querySelectorAll('[data-cp-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const scene = scenes[button.dataset.cpChoice];
      root.querySelectorAll('[data-cp-choice]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      left.innerHTML = scene.left;
      right.innerHTML = scene.right;
      common.dataset.strength = scene.strength;
      common.querySelector('.cp-common__mark').textContent = scene.common;
      result.textContent = scene.result;
    });
  });
})();
