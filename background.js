chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === 'install') {
      chrome.tabs.create({url: 'options.html'}); 
    }
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkExtensionInstalledAndEnabled") {
      const extensionId = "bmkbpmkcppdmkdbpihmijgeilchgeapo";
      chrome.management.get(extensionId, (result) => {
        if (chrome.runtime.lastError || !result.enabled) {
          sendResponse({ installedAndEnabled: false });
        } else {
          sendResponse({ installedAndEnabled: true });
        }
      });
      return true; // Indicate that response will be handled asynchronously
    }
  });
  