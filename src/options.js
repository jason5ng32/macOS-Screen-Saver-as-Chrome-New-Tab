document.addEventListener('DOMContentLoaded', function () {
  const settingsKeys = {
    'city': 'Beijing',
    'showTime': true,
    'showWeather': false,
    'showSearch': true,
    'showMotto': true,
    'fontChoice': 'infinity',
    'videoSourceUrl': 'http://localhost:18000/videos/',
    'weatherAPIKEY': 'Replace with your own API KEY',
    'modelType': 'gpt-4',
    'refreshButton': true,
    'tempUnit': 'celsius',
    'authorInfo': true,
    'delayTime': 2000
  };

  chrome.storage.sync.get(Object.keys(settingsKeys), function (data) {
    for (const [key, defaultValue] of Object.entries(settingsKeys)) {
      const element = document.getElementById(key);
      if (element.type === 'checkbox') {
        element.checked = data[key] !== undefined ? data[key] : defaultValue;
      } else if (element.tagName === 'SELECT') {
        element.value = data[key] || defaultValue;  // 这里处理 <select> 元素
      } else {
        element.value = data[key] || defaultValue;
      }
    }
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

  document.getElementById('save').addEventListener('click', function () {
    let isValid = true;
    let videoSourceUrl = document.getElementById('videoSourceUrl').value;
    let showWeather = document.getElementById('showWeather').checked;
    let city = document.getElementById('city').value;
    let weatherAPIKEY = document.getElementById('weatherAPIKEY').value;
    let delayTime = document.getElementById('delayTime').value; // 获取 delayTime 的值
    let delayTimeInt = parseInt(delayTime, 10); // 转换为整数

    // 验证 delayTime 是否在 1 到 10000 的范围内
    if (isNaN(delayTimeInt) || delayTimeInt < 1 || delayTimeInt > 10000 || delayTime !== String(delayTimeInt)) {
      showMessage('Delay time must be an integer between 1 and 10000.', 'error');
      isValid = false;
    }

    if (!videoSourceUrl) {
      showMessage('Please input Videos list URL', 'error');
      isValid = false;  // 标记为无效
    }

    if (showWeather && (!city || !weatherAPIKEY)) {
      showMessage('Please input City Name and weatherapi.com API KEY', 'error');
      isValid = false;  // 标记为无效
    }

    if (showWeather && (weatherAPIKEY.length < 30 || !/^[a-zA-Z0-9]+$/.test(weatherAPIKEY))) {
      showMessage('The API Key must be at least 30 characters long and consist only of letters and numbers.', 'error');
      document.getElementById('showWeather').checked = false;
      isValid = false;  // 标记为无效
    }

    if (isValid) {
      saveSettings();
      showMessage('Settings saved.', 'success');  // 新增这一行
    }
  });

  function saveSettings() {
    const settingObj = {};

    Object.keys(settingsKeys).forEach(key => {
      const element = document.getElementById(key);
      if (element.type === 'checkbox') {
        settingObj[key] = element.checked;
      } else if (element.tagName === 'SELECT') {
        settingObj[key] = element.value;  // 这里处理 <select> 元素
      } else {
        settingObj[key] = element.value;
      }
    });

    chrome.storage.sync.set(settingObj, function () {
      showMessage('Settings saved', 'success');
    });
  }

});

