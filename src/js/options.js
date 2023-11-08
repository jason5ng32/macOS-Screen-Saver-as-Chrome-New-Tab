document.addEventListener("DOMContentLoaded", async function () {
  // include `lang.js` first in html page
  translatePage("%_"); // translate the page

  let SETTINGS_KEYS = await fetchDefaultSettings();

  chrome.storage.sync.get(Object.keys(SETTINGS_KEYS), function (data) {
    for (const [key, defaultValue] of Object.entries(SETTINGS_KEYS)) {
      console.log(key, defaultValue);
      const element = document.getElementById(key);
      if (element.type === "checkbox") {
        element.checked = data[key] !== undefined ? data[key] : defaultValue;
      } else if (element.tagName === "SELECT") {
        element.value = data[key] || defaultValue; // 这里处理 <select> 元素
      } else {
        element.value = data[key] || defaultValue;
      }
    }
    updateVideoSrcSettings();
  });

  // 创建提示信息
  const messageDiv = document.getElementById("message");
  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    if (type === "success") {
      setTimeout(() => {
        messageDiv.textContent = "";
        messageDiv.className = "";
      }, 2000);
    }
  }

  document
    .getElementById("videoSrc")
    .addEventListener("change", updateVideoSrcSettings);

  document.getElementById("save").addEventListener("click", function () {
    let isValid = true;
    let videoSourceUrl = document.getElementById("videoSourceUrl").value;
    let showWeather = document.getElementById("showWeather").checked;
    let city = document.getElementById("city").value;
    let weatherAPIKEY = document.getElementById("weatherAPIKEY").value;
    let delayTime = document.getElementById("delayTime").value; // 获取 delayTime 的值
    let delayTimeInt = parseInt(delayTime, 10); // 转换为整数
    let historyPermissionNeeded =
      document.getElementById("showTopSites").checked;

    const videoSrc = document.getElementById("videoSrc").value;
    if (videoSrc !== "apple" && !videoSourceUrl) {
      showMessage(getMsg("error_video_url"), "error");
      isValid = false;
    }

    // 验证 delayTime 是否在 1 到 10000 的范围内
    if (
      isNaN(delayTimeInt) ||
      delayTimeInt < 1 ||
      delayTimeInt > 10000 ||
      delayTime !== String(delayTimeInt)
    ) {
      showMessage(getMsg("error_delay_time"), "error");
      isValid = false;
    }

    // if (!videoSourceUrl) {
    //   showMessage(getMsg("error_video_url"), "error");
    //   isValid = false;
    // }

    if (showWeather && (!city || !weatherAPIKEY)) {
      showMessage(getMsg("error_weather"), "error");
      isValid = false;
    }

    if (
      showWeather &&
      (weatherAPIKEY.length < 30 || !/^[a-zA-Z0-9]+$/.test(weatherAPIKEY))
    ) {
      showMessage(getMsg("error_weather_api_key"), "error");
      document.getElementById("showWeather").checked = false;
      isValid = false;
    }

    if (isValid) {
      if (historyPermissionNeeded) {
        // 请求历史权限
        chrome.permissions.request(
          { permissions: ["history"] },
          function (granted) {
            if (granted) {
              saveSettings();
            } else {
              showMessage(getMsg("error_history_permission"), "error");
              document.getElementById("showTopSites").checked = false; // 可以选择性地关闭复选框
            }
          }
        );
      } else {
        saveSettings();
      }
    }
  });

  function saveSettings() {
    const settingObj = {};

    Object.keys(SETTINGS_KEYS).forEach((key) => {
      const element = document.getElementById(key);
      if (element.type === "checkbox") {
        settingObj[key] = element.checked;
      } else if (element.tagName === "SELECT") {
        settingObj[key] = element.value;
      } else {
        settingObj[key] = element.value;
      }
    });

    chrome.storage.sync.set(settingObj, function () {
      showMessage(getMsg("message_saved"), "success");
    });
    localStorage.setItem("shouldUpdate", "true");
    localStorage.setItem("shouldRefreshSites", "true");
  }

  function updateVideoSrcSettings() {
    const videoSrc = document.getElementById("videoSrc").value;
    const reverseProxySetting = document.getElementById("reverseProxySetting");
    const videoSourceUrlSetting = document.getElementById(
      "videoSourceUrlSetting"
    );

    if (videoSrc === "apple") {
      reverseProxySetting.style.display = "flex";
      videoSourceUrlSetting.style.display = "none";
      // videoSourceUrlNote.style.display = 'none';
    } else if (videoSrc === "local") {
      reverseProxySetting.style.display = "none";
      videoSourceUrlSetting.style.display = "flex";
      // videoSourceUrlNote.style.display = 'flex';
    }
  }
});

async function fetchDefaultSettings() {
  const response = await fetch("data/default_settings.json");
  const data = await response.json();
  console.log(data);
  return data;
}