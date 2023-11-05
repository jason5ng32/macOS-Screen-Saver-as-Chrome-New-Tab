document.addEventListener('DOMContentLoaded', async function () {

  let SETTINGS_KEYS = await fetchDefaultSettings();

  chrome.storage.sync.get(Object.keys(SETTINGS_KEYS), function (data) {
    for (const [key, defaultValue] of Object.entries(SETTINGS_KEYS)) {
      const element = document.getElementById(key);
      if (element.type === 'checkbox') {
        element.checked = data[key] !== undefined ? data[key] : defaultValue;
      } else if (element.tagName === 'SELECT') {
        element.value = data[key] || defaultValue; // 这里处理 <select> 元素
      } else {
        element.value = data[key] || defaultValue;
      }
    }
    updateVideoSrcSettings();
  });

  // 创建提示信息
  const messageDiv = document.getElementById('message');
  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    if (type === 'success') {
      setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = '';
      }, 2000);
    }
  }

  document
    .getElementById('videoSrc')
    .addEventListener('change', updateVideoSrcSettings);

  document.getElementById('save').addEventListener('click', function () {
    let isValid = true;
    let videoSourceUrl = document.getElementById('videoSourceUrl').value;
    let showWeather = document.getElementById('showWeather').checked;
    let city = document.getElementById('city').value;
    let weatherAPIKEY = document.getElementById('weatherAPIKEY').value;
    let delayTime = document.getElementById('delayTime').value; // 获取 delayTime 的值
    let delayTimeInt = parseInt(delayTime, 10); // 转换为整数

    const videoSrc = document.getElementById('videoSrc').value;
    if (videoSrc !== 'apple' && !videoSourceUrl) {

      showMessage('Please input Videos list URL', 'error');
      isValid = false;
    }

    // 验证 delayTime 是否在 1 到 10000 的范围内
    if (
      isNaN(delayTimeInt) ||
      delayTimeInt < 1 ||
      delayTimeInt > 10000 ||
      delayTime !== String(delayTimeInt)
    ) {
      showMessage(
        'Delay time must be an integer between 1 and 10000.',
        'error'
      );
      isValid = false;
    }

    if (!videoSourceUrl) {
      showMessage('Please input Videos list URL', 'error');
      isValid = false;
    }

    if (showWeather && (!city || !weatherAPIKEY)) {
      showMessage('Please input City Name and weatherapi.com API KEY', 'error');
      isValid = false;
    }

    if (
      showWeather &&
      (weatherAPIKEY.length < 30 || !/^[a-zA-Z0-9]+$/.test(weatherAPIKEY))
    ) {
      showMessage(
        'The API Key must be at least 30 characters long and consist only of letters and numbers.',
        'error'
      );
      document.getElementById('showWeather').checked = false;
      isValid = false;
    }

    if (isValid) {
      saveSettings();
    }
  });

  function saveSettings() {
    const settingObj = {};

    Object.keys(SETTINGS_KEYS).forEach((key) => {
      const element = document.getElementById(key);
      if (element.type === 'checkbox') {
        settingObj[key] = element.checked;
      } else if (element.tagName === 'SELECT') {
        settingObj[key] = element.value;
      } else {
        settingObj[key] = element.value;
      }
    });

    chrome.storage.sync.set(settingObj, function () {
      showMessage('Settings saved', 'success');
    });
    localStorage.setItem('shouldUpdate', 'true');
    localStorage.setItem('shouldRefreshSites', 'true');
  }

  function updateVideoSrcSettings() {
    const videoSrc = document.getElementById('videoSrc').value;
    const reverseProxySetting = document.getElementById('reverseProxySetting');
    const videoSourceUrlSetting = document.getElementById(
      'videoSourceUrlSetting'
    );
    
    if (videoSrc === 'apple') {
      reverseProxySetting.style.display = 'flex';
      videoSourceUrlSetting.style.display = 'none';
      // videoSourceUrlNote.style.display = 'none';
    } else if (videoSrc === 'local') {
      reverseProxySetting.style.display = 'none';
      videoSourceUrlSetting.style.display = 'flex';
      // videoSourceUrlNote.style.display = 'flex';
    }
  }
});

async function fetchDefaultSettings() {
  const response = await fetch('default_settings.json');
  const data = await response.json();
  return data;
}