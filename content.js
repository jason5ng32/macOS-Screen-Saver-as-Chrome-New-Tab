chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'typeInput') {
      console.log('Received message to type input:', decodeURIComponent(request.input));
      const textarea = document.querySelector('textarea[id="prompt-textarea"]');
      if (textarea) {
        textarea.value = decodeURIComponent(request.input);
        textarea.focus();  // 将焦点设置到文本区域
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);  // 将光标移到文本的最末端
        textarea.dispatchEvent(new Event('input', { 'bubbles': true, 'cancelable': true }));

      }
    }
  });
  