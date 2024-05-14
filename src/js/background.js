chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install" || details.reason === "update") {
    chrome.tabs.create({ url: "options.html" });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "openSearch":
      handleOpenSearch(request);
      break;
    default:
      console.log("Unknown action:", request.action);
  }
});

function handleOpenSearch(request) {
  let query = request.input;
  let url = request.searchURL.replace("{query}", query);
  chrome.tabs.create({ url: url });
}


