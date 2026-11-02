(() => {
  const root = document.querySelector('[data-tr-widget]');
  if (!root) return;
  const stage = root.querySelector('[data-tr-stage]');
  const button = root.querySelector('[data-tr-run]');
  const result = root.querySelector('[data-tr-result]');
  button.addEventListener('click', () => {
    stage.dataset.running = '';
    void stage.offsetWidth;
    stage.dataset.running = 'running';
    button.disabled = true;
    result.textContent = 'Il piano diretto incontra la parete; il piano strutturato cerca prima il passaggio.';
    window.setTimeout(() => {
      stage.dataset.running = 'done';
      button.disabled = false;
      button.textContent = 'Ripeti il confronto';
      result.textContent = 'La distanza più corta non basta: una rappresentazione utile conserva la porta, perché rende possibile il percorso.';
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 1350);
  });
})();
