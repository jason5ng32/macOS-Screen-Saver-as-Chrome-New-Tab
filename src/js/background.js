chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    chrome.tabs.create({ url: "options.html" });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "openUrlAndType":
      handleOpenUrlAndType(request);
      break;
    default:
      console.log("Unknown action:", request.action);
  }
});

function handleOpenUrlAndType(request) {
  chrome.storage.sync.get(["modelType", "delayTime", "isAutoEnter"], function (data) {
    const modelType = data.modelType || "gpt-4";
    const delayTime = data.delayTime || 2000;
    const isAutoEnter = data.isAutoEnter || false;
    let url = "";

    console.log("Received input:", decodeURIComponent(request.input));

    if (request.gizmoId === "ChatGPT") {
      url = `https://chat.openai.com/?model=${modelType}`;
    } else {
      url = `https://chat.openai.com/g/${request.gizmoId}`;
    }

    chrome.tabs.create({ url: url }, (tab) => {
      setTimeout(() => {
        try {
          chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              files: ["js/content.js"],
            },
            () => {
              chrome.tabs.sendMessage(tab.id, {
                action: "typeInput",
                input: request.input,
                autoEnter: isAutoEnter,
              });
            }
          );
        } catch (error) {
          console.error(error);
        }
      }, delayTime);
    });
  });
}


