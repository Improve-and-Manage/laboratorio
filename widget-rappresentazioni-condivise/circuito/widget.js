(() => {
  const root = document.querySelector('[data-ct-widget]');
  if (!root) return;

  const stage = root.querySelector('[data-ct-stage]');
  const result = root.querySelector('[data-ct-result]');
  const outcomes = {
    intact: 'Con il sottografo integro, il modello completa con “Austin”.',
    capital: 'Riducendo “capitale”, resta la relazione Dallas → Texas e l’uscita diventa “Texas”.',
    texas: 'Riducendo “Texas”, resta l’operazione sulla capitale ma l’uscita documentata diventa “Albany”.'
  };

  root.querySelectorAll('[data-ct-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const state = button.dataset.ctChoice;
      stage.dataset.state = state;
      root.querySelectorAll('[data-ct-choice]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === button));
      });
      result.textContent = outcomes[state];
    });
  });
})();
