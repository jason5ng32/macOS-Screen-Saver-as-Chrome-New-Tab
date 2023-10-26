let videoSourceUrl_default = 'http://localhost:18000/videos/';
let supportedFormats_default = ['.mov', '.mp4'];
let allAvailableVideos = [];
let currentVideoIndex = -1; // 用于跟踪当前播放的视频

const SETTINGS_KEYS = {
  'city': 'Beijing',
  'showTime': true,
  'showWeather': false,
  'showSearch': true,
  'showMotto': true,
  'weatherAPIKEY': 'Replace with your own API KEY',
  'tempUnit': 'celsius',
  'refreshButton': true,
  'videoSourceUrl': videoSourceUrl_default,
  'supportedFormats': supportedFormats_default
};


document.addEventListener('DOMContentLoaded', init);

async function init() {
  await initSettings();
  await fetchRandomVideo();
  initSearch();
  fetchRandomMotto();
  initClock();
}

// 初始化视频切换按钮
const switchVideoButton = document.getElementById('switchVideoBtn');

if (switchVideoButton) {
  switchVideoButton.addEventListener('click', function (event) {
    // 先调用 switchToNextVideo 函数
    switchToNextVideo(event);

    // 根据当前的类名切换旋转效果，以确保每次点击都会触发动画
    if (this.classList.contains("rotating")) {
      this.classList.remove("rotating");
      this.classList.add("rotating2");
    } else {
      this.classList.remove("rotating2");
      this.classList.add("rotating");
    }

    // 在动画结束后，只有当鼠标不再悬停在按钮上时才移除 rotating 和 rotating2 类
    this.addEventListener("transitionend", function () {
      // 如果鼠标不再悬停在按钮上，移除 rotating 和 rotating2 类
      if (!this.matches(":hover")) {
        this.classList.remove("rotating", "rotating2");
      }
    }, { once: true }); // 使用 once 选项确保事件只触发一次
  });

  // 如果鼠标离开按钮，检查是否需要移除 rotating 和 rotating2 类
  switchVideoButton.addEventListener('mouseleave', function () {
    this.classList.remove("rotating", "rotating2");
  });
}



async function fetchRandomVideo() {
  try {
    const allVideoUrls = [];
    allAvailableVideos = allVideoUrls;
    const html = await fetch(videoSourceUrl).then(res => res.text());
    const doc = new DOMParser().parseFromString(html, 'text/html');

    // 获取主目录中的视频文件
    const mainDirVideoFiles = Array.from(doc.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => supportedFormats.some(format => href.endsWith(format)))
      .map(href => videoSourceUrl + href.split('/').pop()); // 确保拼接完整URL
    allVideoUrls.push(...mainDirVideoFiles);

    // 遍历子目录
    const baseHref = doc.querySelector('base') ? doc.querySelector('base').href : videoSourceUrl;
    const subDirLinks = Array.from(doc.querySelectorAll('a'))
      .map(a => new URL(a.getAttribute('href'), baseHref).href)
      .filter(href => href.endsWith('/'));

    for (const dirLink of subDirLinks) {
      const dirName = dirLink.split('/').slice(-2, -1)[0]; // 获取子目录名称
      const subDirHtml = await fetch(dirLink).then(res => res.text());
      const subDirDoc = new DOMParser().parseFromString(subDirHtml, 'text/html');
      const subDirVideoFiles = Array.from(subDirDoc.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => supportedFormats.some(format => href.endsWith(format)))
        .map(href => videoSourceUrl + dirName + '/' + href.split('/').pop()); // 拼接子目录名称
      allVideoUrls.push(...subDirVideoFiles);
    }

    if (allVideoUrls.length > 0) {
      const randomVideoUrl = allVideoUrls[Math.floor(Math.random() * allVideoUrls.length)];
      appendVideo(randomVideoUrl);
    }
  } catch (error) {
    console.error('Error fetching directory:', error);
  }
}

// 设置视频播放器
function appendVideo(src) {
  const video = Object.assign(document.createElement('video'), {
    id: 'myVideo',
    src,
    autoplay: true,
    loop: true,
    muted: true,
    style: 'position: fixed; right: 0; bottom: 0; min-width: 100%; min-height: 100%; z-index: -1;'
  });
  document.body.appendChild(video);
}

// 手动切换视频
function switchToNextVideo() {
  // 修改 CSS 中的 video 选择器，添加 background-color: black
  var styleSheet = document.styleSheets[0];
  var rules = styleSheet.cssRules || styleSheet.rules;

  var videoRuleFound = false;

  for (var i = 0; i < rules.length; i++) {
    if (rules[i].selectorText === 'video') {
      videoRuleFound = true;
      rules[i].style.backgroundColor = 'black';
      break;
    }
  }
  if (allAvailableVideos.length === 0) {
    console.warn("No videos available to switch.");
    return;
  }

  const videoElement = document.getElementById('myVideo');

  if (videoElement) {
    // 淡出当前视频
    videoElement.style.opacity = 0;

    // 在淡出动画完成后进行视频切换，并淡入新视频
    setTimeout(() => {
      currentVideoIndex = (currentVideoIndex + 1) % allAvailableVideos.length;
      const nextVideoUrl = allAvailableVideos[currentVideoIndex];

      videoElement.src = nextVideoUrl;
      videoElement.load(); // 重新加载新的视频源
      videoElement.play(); // 确保视频继续播放

      // 淡入新视频
      videoElement.style.opacity = 1;
    }, 650); // 0.5秒后执行，与 CSS 中的过渡时间相同
  } else {
    console.error("No video element found to switch source.");
  }
}


function initSearch() {
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      // 通过 Chrome 扩展 API 发送消息给 background.js
      const input = encodeURIComponent(event.target.value);
      chrome.runtime.sendMessage({ action: 'openUrlAndType', input });
    }
  });
}

function updateTime() {
  const currentTimeElement = document.getElementById('current-time');
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // 将24小时制转换为12小时制，并修正12点的小时
  hours = hours % 12;
  hours = hours ? hours : 12; // 如果小时是0，则显示为12

  // 如果分钟是一位数，添加前导零
  minutes = minutes < 10 ? '0' + minutes : minutes;

  const timeString = `${hours}:${minutes} ${ampm}`;
  currentTimeElement.textContent = timeString;
}

async function fetchRandomMotto() {
  const mottoElement = document.getElementById('motto');
  try {
    const { content, author } = await fetch('https://api.quotable.io/random').then(res => res.json());
    mottoElement.textContent = `${content} — ${author}`;
  } catch (error) {
    mottoElement.textContent = 'As you walk in Gods divine wisdom, you will surely begin to see a greater measure of victory and good success in your life. — Joseph Prince (load failed)';
  }
}

function initClock() {
  updateTime();
  setInterval(updateTime, 1000);
}

async function initSettings() {
  const data = await new Promise(resolve => chrome.storage.sync.get(Object.keys(SETTINGS_KEYS), resolve));

  // 这里确保即使字段值为undefined也会设置为默认值，并保存。
  let shouldUpdateStorage = false;
  for (const [key, defaultValue] of Object.entries(SETTINGS_KEYS)) {
    if (typeof data[key] === 'undefined') {
      data[key] = defaultValue;
      shouldUpdateStorage = true;
    }
  }

  if (shouldUpdateStorage) {
    chrome.storage.sync.set(data);  // 保存更新后的设置
  }

  const { showTime, showWeather, showSearch, showMotto, city, videoSourceUrl, supportedFormats, weatherAPIKEY, refreshButton } = data;

  // 更新全局变量
  if (videoSourceUrl) {
    window.videoSourceUrl = videoSourceUrl;
  }
  if (supportedFormats) {
    window.supportedFormats = supportedFormats;
  }
  if (weatherAPIKEY) {
    window.weatherAPIKEY = weatherAPIKEY;
  }

  setDisplay('current-time', showTime ? 'block' : 'none');
  setDisplay('weather-info', showWeather ? 'flex' : 'none');
  setDisplay('search', showSearch ? '' : 'none');
  setDisplay('switchVideoBtn', refreshButton ? '' : 'none');
  setDisplay('motto', showMotto ? 'flex' : 'none');

  city ? updateWeather(city) : useDefaultLocation();
}


function setDisplay(id, value) {
  document.getElementById(id).style.display = value;
}

async function updateWeather(city) {
  getCurrentWeather(city);
  getForecastWeather(city);
}

async function useDefaultLocation() {
  try {
    const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
    const { latitude, longitude } = position.coords;
    updateWeather(`${latitude},${longitude}`);
  } catch (error) {
    console.error(`Get location failed: ${error.message}`);
  }
}

// 获取天气
async function getCurrentWeather(city) {
  try {
    const response = await fetch(`http://api.weatherapi.com/v1/current.json?key=${weatherAPIKEY}&q=${city}`);
    const data = await response.json();

    const unit = await new Promise(resolve => chrome.storage.sync.get('tempUnit', data => resolve(data.tempUnit || 'celsius')));
    const temperature = unit === 'celsius' ? data.current.temp_c : data.current.temp_f;

    document.getElementById('current-weather').textContent = `${temperature}°`;
    document.getElementById('weather-icon').src = `https://${data.current.condition.icon}`;
  } catch (error) {
    console.error(`Get weather failed: ${error}`);
  }
}

async function getForecastWeather(city) {
  try {
    const unit = await new Promise(resolve => chrome.storage.sync.get('tempUnit', data => resolve(data.tempUnit || 'celsius')));
    const response = await fetch(`http://api.weatherapi.com/v1/forecast.json?key=${weatherAPIKEY}&q=${city}&days=3`);
    const data = await response.json();
    const { forecastday } = data.forecast;

    for (let i = 0; i < forecastday.length; i++) {
      const day = forecastday[i];

      // 更新天气图标
      document.getElementById(`weather-icon${i + 1}`).src = `https://${day.day.condition.icon}`;

      // 更新温度范围，并保留整数部分
      const minTemp = unit === 'celsius' ? Math.round(day.day.mintemp_c) : Math.round(day.day.mintemp_f);
      const maxTemp = unit === 'celsius' ? Math.round(day.day.maxtemp_c) : Math.round(day.day.maxtemp_f);

      document.getElementById(`forecast${i + 1}`).textContent = `${minTemp}°-${maxTemp}°`;
    }
  } catch (error) {
    console.error(`Get forecast failed: ${error}`);
  }
}