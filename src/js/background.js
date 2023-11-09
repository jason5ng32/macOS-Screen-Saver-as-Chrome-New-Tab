chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'options.html' });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'openUrlAndType':
      handleOpenUrlAndType(request);
      break;
    default:
      console.log('Unknown action:', request.action);
  }
});

function handleOpenUrlAndType(request) {
  chrome.storage.sync.get(['modelType', 'delayTime'], function (data) {
    const modelType = data.modelType || 'gpt-4';
    const delayTime = data.delayTime || 2000;

    console.log("Received input:", decodeURIComponent(request.input));

    chrome.tabs.create({ url: `https://chat.openai.com/?model=${modelType}` }, (tab) => {
      setTimeout(() => {
        try {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['js/content.js']
          }, () => {
            chrome.tabs.sendMessage(tab.id, { action: 'typeInput', input: request.input });
          });
        } catch (error) {
          console.error(error);
        }
      }, delayTime);
    });
  });
}


