(() => {
  const root = document.querySelector('[data-ro-widget]');
  if (!root) return;
  const stage = root.querySelector('[data-ro-stage]');
  const button = root.querySelector('[data-ro-toggle]');
  const result = root.querySelector('[data-ro-result]');
  button.addEventListener('click', () => {
    const aligned = stage.dataset.aligned !== 'true';
    stage.dataset.aligned = String(aligned);
    button.setAttribute('aria-pressed', String(aligned));
    button.textContent = aligned ? 'Separa di nuovo' : 'Allinea gli spazi';
    result.textContent = aligned
      ? 'Dopo la rotazione, le cinque relazioni coincidono: gli assi erano diversi, la struttura no.'
      : 'Le due mappe sembrano diverse perché usano assi diversi.';
  });
})();
