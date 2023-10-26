let videoSourceUrl_default = 'http://localhost:18000/videos/';
let supportedFormats_default = ['.mov', '.mp4'];
const subDirectories = ['4KSDR240FPS', '4KSDR', '4KHDR', '2KSDR', '2KHDR', '2KAVC'];
const videoSourceBase = 'http://localhost:18000/videos-';

const SETTINGS_KEYS = {
  'city': 'Beijing',
  'showTime': true,
  'showWeather': false,
  'showSearch': true,
  'showMotto': true,
  'weatherAPIKEY': 'Replace with your own API KEY',
  'tempUnit': 'celsius',
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

async function fetchRandomVideo() {
  try {
    const allVideoFiles = [];
    const allVideoUrls = []; // 新增数组以存储每个视频的完整URL

    for (const dir of subDirectories) {
      const currentDirUrl = videoSourceBase + dir + '/'; // 存储当前子目录的完整URL
      const html = await fetch(currentDirUrl).then(res => res.text());
      const doc = new DOMParser().parseFromString(html, 'text/html');
      
      const videoFiles = Array.from(doc.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => supportedFormats.some(format => href.endsWith(format)))
        .map(href => href.split('/').pop());

      allVideoFiles.push(...videoFiles);
      allVideoUrls.push(...videoFiles.map(file => currentDirUrl + file)); // 存储完整的视频URL
    }

    if (allVideoUrls.length > 0) {
      const randomVideoUrl = allVideoUrls[Math.floor(Math.random() * allVideoUrls.length)]; // 使用完整的视频URL
      appendVideo(randomVideoUrl);
    }
  } catch (error) {
    console.error('Error fetching directory:', error);
  }
}


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

function initSearch() {
  const searchInput = document.getElementById('search');
  searchInput.addEventListener('keypress', function(event) {
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

  const { showTime, showWeather, showSearch, showMotto, city, videoSourceUrl, supportedFormats,weatherAPIKEY } = data;

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