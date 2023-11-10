let langDict = null;
const supportLanguages = ["en", "es", "zh-TW", "zh-CN", "ja"];

const getBrowserLanguage = () => {
  const lang = chrome.i18n.getUILanguage();
  const langShort = lang.split("-")[0];
  if (supportLanguages.includes(lang)) {
    return lang.replace("-", "_");
  } else if (supportLanguages.includes(langShort)) {
    return langShort;
  } else {
    return "en";
  }
};

const getCurrentLanguage = async () => {
  const langSettings = await chrome.storage.sync.get("userLanguage");
  return langSettings?.userLanguage || getBrowserLanguage();
};

const loadLanguages = async () => {
  const lang = await getCurrentLanguage();
  const res = await fetch(`_locales/${lang}/messages.json`);
  langDict = await res.json();
};

// const getMsg = chrome.i18n.getMessage;
const getMsg = (key) => {
  result = langDict[key]?.message || key;
  return result;
};

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
