const getMsg = chrome.i18n.getMessage;

const translatePage = (prefix) => {
  const pre = prefix || "__MSG_";
  const reg = new RegExp(`${pre}([\\w]+)`, "g");
  const body = document.getElementsByTagName("body")[0];
  let bodyHtml = body.innerHTML;

  let match = null;
  while ((match = reg.exec(body.innerHTML))) {
    const msg = getMsg(match[1]);
    if (msg) {
      bodyHtml = bodyHtml.replace(match[0], msg);
    } else {
      console.error(`Missing the word in language pack: ${match[0]}`);
    }
  }
  body.innerHTML = bodyHtml;
};
