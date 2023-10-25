document.addEventListener('DOMContentLoaded', function () {
  // 定义需要保存和加载的设置项，以及默认值
  const settingsKeys = {
    'city': 'Beijing',
    'showTime': true,
    'showWeather': false,
    'showSearch': false,
    'showMotto': true,
    'videoSourceUrl': 'http://localhost:18000/videos/',
    'weatherAPIKEY': 'Replace with your own API KEY'
  };

  // 加载已保存的设置或设置默认值
  chrome.storage.sync.get(Object.keys(settingsKeys), function(data) {
    for (const [key, defaultValue] of Object.entries(settingsKeys)) {
      const element = document.getElementById(key);
      if (element.type === 'checkbox') {
        element.checked = data[key] !== undefined ? data[key] : defaultValue;
      } else if (element.type === 'text') {
        element.value = data[key] || defaultValue;
      }
    }
  });

  // 给保存按钮添加点击事件（特定于“城市”设置）
  document.getElementById('save').addEventListener('click', function() {
    let videoSourceUrl = document.getElementById('videoSourceUrl').value;
    let showWeather = document.getElementById('showWeather').checked;
    let showSearch = document.getElementById('showSearch').checked;
    let city = document.getElementById('city').value;
    let weatherAPIKEY = document.getElementById('weatherAPIKEY').value;

    if (!videoSourceUrl) {
      alert('Please input Videos list URL');
      return;
    }

    if (showWeather && (!city || !weatherAPIKEY)) {
      alert('Please input City Name and weatherapi.com API KEY');
      return;
    }

    // 检查 weatherAPIKEY
    if (weatherAPIKEY.length < 30 || !/^[a-zA-Z0-9]+$/.test(weatherAPIKEY)) {
      alert('The API Key must be at least 30 characters long and consist only of letters and numbers.');
      document.getElementById('showWeather').checked = false;
      return;
    }

    if (showSearch) {
      checkExtensionInstalled((installed) => {
        if (!installed) {
          alert('Please install the required extension first.');
          // 将 showSearch 的勾选状态重置为 false
          document.getElementById('showSearch').checked = false;
          return;
        }
        saveSettings();
      });
    } else {
      saveSettings();
    }
  });

  // 保存设置的函数
  function saveSettings() {
    const settingObj = {};

    Object.keys(settingsKeys).forEach(key => {
      const element = document.getElementById(key);
      settingObj[key] = element.type === 'checkbox' ? element.checked : element.value;
    });

    chrome.storage.sync.set(settingObj, function() {
      alert('Settings saved');
    });
  }

  // 专门为 videoURL 添加事件监听器
  document.getElementById('videoSourceUrl').addEventListener('change', function() {
    const value = this.value;
    chrome.storage.sync.set({videoSourceUrl: value});
  });

  // 专门为 weatherAPIKEY 添加事件监听器
  document.getElementById('weatherAPIKEY').addEventListener('change', function() {
    const value = this.value;
    chrome.storage.sync.set({weatherAPIKEY: value});
  });

  // 为其他设置项添加事件监听器
  Object.keys(settingsKeys).filter(key => key !== 'city').forEach(key => {
    document.getElementById(key).addEventListener('change', function() {
      const value = this.type === 'checkbox' ? this.checked : this.value;
      const settingObj = {};
      settingObj[key] = value;
      chrome.storage.sync.set(settingObj);
    });
  });
});

// 检查扩展是否已安装
function checkExtensionInstalled(callback) {
  chrome.runtime.sendMessage({ action: "checkExtensionInstalledAndEnabled" }, (response) => {
    callback(response.installedAndEnabled); 
  });
}
