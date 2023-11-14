document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.sync.get('fontChoice', function (data) {
    const fontChoice = data.fontChoice || 'Dosis';

    if (fontChoice !== 'Dosis') {
      const overrideStyle = document.createElement('style');
      overrideStyle.innerHTML = `
        * { font-family: sans-serif !important; }
        *::placeholder { font-family: sans-serif !important; }
      `;
      document.head.appendChild(overrideStyle);
    }
  });
});
