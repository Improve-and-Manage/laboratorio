(() => {
  const root = document.querySelector('[data-js-widget]');
  if (!root) return;

  const stage = root.querySelector('[data-js-stage]');
  const button = root.querySelector('[data-js-action]');
  const result = root.querySelector('[data-js-result]');
  const output = root.querySelector('[data-js-output]');
  const tokens = root.querySelectorAll('[data-js-token]');

  stage.dataset.phase = 'input';

  const setTokens = (word) => tokens.forEach((token) => {
    token.textContent = token.dataset.jsRole === 'concept' ? word : token.dataset.jsDefault;
  });

  button.addEventListener('click', () => {
    const phase = stage.dataset.phase;
    if (phase === 'input') {
      stage.dataset.phase = 'read';
      setTokens('ragno');
      output.textContent = '8';
      button.textContent = 'Sostituisci ragno con formica';
      result.textContent = 'La lente rende visibile “ragno” negli strati intermedi, prima della risposta.';
      return;
    }
    if (phase === 'read') {
      stage.dataset.phase = 'swap';
      setTokens('formica');
      output.textContent = '6';
      button.textContent = 'Ricomincia';
      result.textContent = 'Dopo lo scambio pubblicato dagli autori, la risposta più probabile passa da 8 a 6.';
      return;
    }
    stage.dataset.phase = 'input';
    setTokens('ragno');
    output.textContent = '8';
    button.textContent = 'Leggi gli strati';
    result.textContent = 'Il prompt non contiene la parola “ragno”. La lente cerca il concetto negli strati intermedi.';
  });
})();
