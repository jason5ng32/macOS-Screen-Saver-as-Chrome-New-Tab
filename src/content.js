function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === 'typeInput') {
    console.log('Received message to type input:', decodeURIComponent(request.input));

    // 从 background.js 获取 delayTime
    const { delayTime = 2000 } = await new Promise(resolve =>
      chrome.storage.sync.get(['delayTime'], resolve)
    );

    // 添加延迟
    await delay(delayTime);

    const textarea = document.querySelector('textarea[id="prompt-textarea"]');
    if (textarea) {
      textarea.value = decodeURIComponent(request.input);
      textarea.focus();  // 将焦点设置到文本区域
      textarea.setSelectionRange(textarea.value.length, textarea.value.length);  // 将光标移到文本的最末端
      textarea.dispatchEvent(new Event('input', { 'bubbles': true, 'cancelable': true }));
    }
  }
});
