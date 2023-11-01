let allAvailableVideos = [];
let currentVideoIndex = -1; // 用于跟踪当前播放的视频
let currentIndex = 0; // 用于跟踪当前展示到哪条格言

// 初始化
document.addEventListener('DOMContentLoaded', initSettings);

// 主程序
async function initSettings() {

  // 获取默认设置和初始化设置
  SETTINGS_KEYS = await fetchDefaultSettings();
  const data = await getSettings();
  newdata = await updateStorage(data);

  await updateVideos(newdata);
  updateUI(newdata);

  // 展示天气
  if (newdata.showWeather) {
    updateWeather(newdata);
    weatherUI();
  }

  // 展示搜索框
  if (newdata.showSearch) {
    initSearch();
  }
  // 展示时间
  if (newdata.showTime) {
    initClock(newdata.hourSystem);
  }

  // 展示 Motto
  if (newdata.showMotto) {
    fetchRandomMotto();
    refreshRandomMotto();
  } else {
    let elements = document.querySelectorAll('.centered');
    elements.forEach(function (element) {
      element.style.top = '35%';
    });
  }
}

//
// 子函数
//

// 获取默认设置
async function fetchDefaultSettings() {
  const response = await fetch('default_settings.json');
  const data = await response.json();
  return data;
}

// 从配置中获取设置
async function getSettings(data) {
  return await new Promise((resolve) =>
    chrome.storage.sync.get(Object.keys(SETTINGS_KEYS), resolve)
  );

}

// 更新设置
async function updateStorage(data) {
  let shouldUpdateStorage = false;
  for (const [key, defaultValue] of Object.entries(SETTINGS_KEYS)) {
    if (typeof data[key] === 'undefined') {
      data[key] = defaultValue;
      shouldUpdateStorage = true;
    }
  }
  if (shouldUpdateStorage) {
    await chrome.storage.sync.set(data);
  }
  return data;
}

// 设置显示或隐藏
function updateUI({ showTime, showWeather, showSearch, showMotto, refreshButton, authorInfo }) {
  setDisplay('current-time', showTime ? 'block' : 'none');
  setDisplay('weather-area', showWeather ? 'flex' : 'none');
  setDisplay('search', showSearch ? 'inline' : 'none');
  setDisplay('switchVideoBtn', refreshButton ? '' : 'none');
  setDisplay('motto', showMotto ? 'block' : 'none');
  setDisplay('author', authorInfo ? '' : 'none');
}

// 设置显示或隐藏
function setDisplay(id, value) {
  document.getElementById(id).style.display = value;
}

// 视频初始化
async function updateVideos({ videoSrc, videoSourceUrl, reverseProxy }) {
  if (videoSrc === 'local') {
    if (!window.videoSourceUrl || window.videoSourceUrl !== videoSourceUrl) {
      window.videoSourceUrl = videoSourceUrl;
      await fetchRandomVideo(); // 只有当 videoSourceUrl 发生变化时才调用
      switchVideo();
    }
  } else {
    await fetchRandomVideo_fromApple(reverseProxy);
    switchVideo();
  }
}

// 初始化视频切换按钮
function switchVideo() {
  const switchVideoButton = document.getElementById('switchVideoBtn');

  if (switchVideoButton) {
    switchVideoButton.addEventListener('click', function (event) {
      switchToNextVideo(event);
      if (this.classList.contains('rotating')) {
        this.classList.remove('rotating');
        this.classList.add('rotating2');
      } else {
        this.classList.remove('rotating2');
        this.classList.add('rotating');
      }
      this.addEventListener(
        'transitionend',
        function () {
          if (!this.matches(':hover')) {
            this.classList.remove('rotating', 'rotating2');
          }
        },
        { once: true }
      );
    });

    switchVideoButton.addEventListener('mouseleave', function () {
      this.classList.remove('rotating', 'rotating2');
    });
  }
}

// 从本地目录获取视频
async function fetchRandomVideo() {
  try {
    const allVideoUrls = [];
    allAvailableVideos = allVideoUrls;
    const html = await fetch(videoSourceUrl).then((res) => res.text());
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let supportedFormats = ['.mov', '.mp4'];

    // 获取主目录中的视频文件
    const mainDirVideoFiles = Array.from(doc.querySelectorAll('a'))
      .map((a) => a.href)
      .filter((href) =>
        supportedFormats.some((format) => href.endsWith(format))
      )
      .map((href) => videoSourceUrl + href.split('/').pop()); // 确保拼接完整URL
    allVideoUrls.push(...mainDirVideoFiles);

    // 遍历子目录
    const baseHref = doc.querySelector('base')
      ? doc.querySelector('base').href
      : videoSourceUrl;
    const subDirLinks = Array.from(doc.querySelectorAll('a'))
      .map((a) => new URL(a.getAttribute('href'), baseHref).href)
      .filter((href) => href.endsWith('/'));

    for (const dirLink of subDirLinks) {
      const dirName = dirLink.split('/').slice(-2, -1)[0]; // 获取子目录名称
      const subDirHtml = await fetch(dirLink).then((res) => res.text());
      const subDirDoc = new DOMParser().parseFromString(
        subDirHtml,
        'text/html'
      );
      const subDirVideoFiles = Array.from(subDirDoc.querySelectorAll('a'))
        .map((a) => a.href)
        .filter((href) =>
          supportedFormats.some((format) => href.endsWith(format))
        )
        .map((href) => videoSourceUrl + dirName + '/' + href.split('/').pop()); // 拼接子目录名称
      allVideoUrls.push(...subDirVideoFiles);
    }

    if (allVideoUrls.length > 0) {
      const randomVideoUrl =
        allVideoUrls[Math.floor(Math.random() * allVideoUrls.length)];
      appendVideo(randomVideoUrl);
    }
  } catch (error) {
    console.error('Error fetching directory:', error);
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent =
      'Error fetching video directory. Please check the URL and instrutions then try again.';
    errorBox.style.display = 'flex';
    document.body.style.backgroundColor = 'black';
  }
}

// 从苹果 Server 获取视频
async function fetchRandomVideo_fromApple(reverseProxy) {
  try {
    const allVideoUrls = [];
    allAvailableVideos = allVideoUrls;
    domain_cloudflare = 'https://applescreensaver.macify.workers.dev/Videos/';
    domain_apple = 'https://sylvan.apple.com/Videos/';
    const jsonFile = 'videosrc.json';

    // 根据 reverseProxy 的设置选择不同的前缀
    const domainPrefix = reverseProxy ? domain_cloudflare : domain_apple;

    const response = await fetch(jsonFile);
    const data = await response.json();

    // 将获取到的视频文件名添加到数组中，并添加相应的前缀
    for (const videoKey in data) {
      allVideoUrls.push(domainPrefix + data[videoKey]);
    }

    if (allVideoUrls.length > 0) {
      const randomVideoUrl =
        allVideoUrls[Math.floor(Math.random() * allVideoUrls.length)];
      appendVideo(randomVideoUrl);
    }
  } catch (error) {
    console.error('Error fetching video from Apple Server:', error);
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent =
      "Error fetching video from Apple Server.\nThis might be due to a certificate error when connecting to Apple's servers.\nSee extension instructions for more details.";
    errorBox.style.display = 'flex';
    document.body.style.backgroundColor = 'black';
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
  });
  // 当视频可以播放时，改变透明度
  video.addEventListener('canplay', function () {
    video.style.opacity = '1';
  });

  document.getElementById('videoBox').appendChild(video);
}

// 手动切换视频
function switchToNextVideo() {
  if (allAvailableVideos.length === 0) {
    console.warn('No videos available to switch.');
    return;
  }

  const videoElement = document.getElementById('myVideo');

  if (videoElement) {
    videoElement.style.opacity = 0;
    setTimeout(() => {
      currentVideoIndex = (currentVideoIndex + 1) % allAvailableVideos.length;
      const nextVideoUrl = allAvailableVideos[currentVideoIndex];

      videoElement.src = nextVideoUrl;
      videoElement.load();
      videoElement.play();
      videoElement.style.opacity = 1;
    }, 650);
  } else {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = 'No video element found to switch source.';
    errorBox.style.display = 'flex';
    document.body.style.backgroundColor = 'black';
  }
}

// 搜索框
async function initSearch() {
  const searchInput = document.getElementById('search');
  await new Promise((resolve) => setTimeout(resolve, 200));
  search.style.opacity = '1';
  searchInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
      // 通过 Chrome 扩展 API 发送消息给 background.js
      const input = encodeURIComponent(event.target.value);
      chrome.runtime.sendMessage({ action: 'openUrlAndType', input });
    }
  });
}

function updateTime(hourSystem) {
  const currentTimeElement = document.getElementById('current-time');
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';

  if (hourSystem === '12') {
    // 将24小时制转换为12小时制，并修正12点的小时
    hours = hours % 12;
    hours = hours || 12; // 如果小时是0，则显示为12
  }

  // 如果分钟是一位数，添加前导零
  minutes = minutes < 10 ? '0' + minutes : minutes;

  const timeString = `${hours}:${minutes} ${hourSystem === '24' ? '' : ampm}`;
  currentTimeElement.textContent = timeString;
  currentTimeElement.style.opacity = '1';
}

async function fetchRandomMotto() {
  const mottoElement = document.getElementById('motto');

  try {
    let quotes = JSON.parse(localStorage.getItem('quotes'));
    let currentIndex = parseInt(localStorage.getItem('currentIndex')) || 0; // 从本地存储中获取当前索引

    // 如果本地存储里没有格言或者格言已经用完，从 API 获取新数据
    if (!quotes || currentIndex >= quotes.length) {
      const response = await fetch('https://api.quotable.io/quotes/random?limit=50&maxLength=150');
      const data = await response.json();
      quotes = data;
      localStorage.setItem('quotes', JSON.stringify(quotes));
      currentIndex = 0; // 重置索引
    }

    const { content, author } = quotes[currentIndex];
    localStorage.setItem('currentIndex', currentIndex + 1); // 更新并保存当前索引到本地存储

    await new Promise((resolve) => setTimeout(resolve, 10));
    mottoElement.style.opacity = '0';
    await new Promise((resolve) => setTimeout(resolve, 400));
    mottoElement.style.opacity = '1';
    mottoElement.textContent = `${content} — ${author}`;
    

  } catch (error) {
    mottoElement.style.opacity = '1';
    console.error('Get motto failed.');
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = 'Get motto failed.';
    errorBox.style.display = 'flex';
    document.body.style.backgroundColor = 'black';
    await new Promise((resolve) => setTimeout(resolve, 3000));
    errorBox.style.display = 'none';
  }
}


async function refreshRandomMotto() {
  var mottoElement = document.querySelector('.motto');
  mottoElement.addEventListener('click', function (e) {
    var clickedElement = e.target;
    if (clickedElement === mottoElement) {
      var range = document.createRange();
      var rectList;
      for (var i = 0; i < mottoElement.childNodes.length; i++) {
        var node = mottoElement.childNodes[i];
        if (node.nodeType === 3) {
          // 是文本节点
          range.selectNode(node);
          rectList = range.getClientRects();
          for (var j = 0; j < rectList.length; j++) {
            if (
              e.clientX >= rectList[j].left &&
              e.clientX <= rectList[j].right &&
              e.clientY >= rectList[j].top &&
              e.clientY <= rectList[j].bottom
            ) {
              fetchRandomMotto();
              return;
            }
          }
        }
      }
    }
  });
}

function initClock(hourSystem) {
  updateTime(hourSystem);
  setInterval(updateTime, 1000, hourSystem);
}

// 更新天气
async function updateWeather({ city, tempUnit, weatherAPIKEY }) {
  getCurrentWeather(city, tempUnit, weatherAPIKEY);
  getForecastWeather(city, tempUnit, weatherAPIKEY);
}

// 获取天气
async function getCurrentWeather(city, tempUnit, weatherAPIKEY) {
  try {
    const response = await fetch(
      `http://api.weatherapi.com/v1/current.json?key=${weatherAPIKEY}&q=${city}`
    );
    const data = await response.json();
    const temperature =
      tempUnit === 'celsius' ? data.current.temp_c : data.current.temp_f;

    document.getElementById('current-weather').textContent = `${temperature}°`;
    document.getElementById(
      'weather-icon'
    ).src = `https://${data.current.condition.icon}`;
  } catch (error) {
    console.error(`Get weather failed: ${error}`);
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent =
      'Get weather failed. Please check the API key and city name then try again.';
    errorBox.style.display = 'flex';
    document.body.style.backgroundColor = 'black';
  }
}

async function getForecastWeather(city, tempUnit, weatherAPIKEY) {
  try {
    const response = await fetch(
      `http://api.weatherapi.com/v1/forecast.json?key=${weatherAPIKEY}&q=${city}&days=3`
    );
    const data = await response.json();
    const { forecastday } = data.forecast;

    for (let i = 0; i < forecastday.length; i++) {
      const day = forecastday[i];

      // 更新天气图标
      document.getElementById(
        `weather-icon${i + 1}`
      ).src = `https://${day.day.condition.icon}`;

      // 更新温度范围，并保留整数部分
      const minTemp =
        tempUnit === 'celsius'
          ? Math.round(day.day.mintemp_c)
          : Math.round(day.day.mintemp_f);
      const maxTemp =
        tempUnit === 'celsius'
          ? Math.round(day.day.maxtemp_c)
          : Math.round(day.day.maxtemp_f);

      document.getElementById(
        `forecast${i + 1}`
      ).textContent = `${minTemp}°-${maxTemp}°`;
    }
  } catch (error) {
    console.error(`Get forecast failed: ${error}`);
  }
}

function weatherUI() {
  let wthElements = document.querySelectorAll('#wthBtn');
  let weatherInfo = document.querySelector('#weather-info');

  wthElements.forEach(function (wthElement) {
    wthElement.addEventListener('mouseover', function () {
      weatherInfo.style.opacity = '1';
      weatherInfo.style.transform = 'translateY(0)'; // 从页面顶部滑入
    });

    wthElement.addEventListener('mouseout', function () {
      weatherInfo.style.opacity = '0';
      weatherInfo.style.transform = 'translateY(-100%)'; // 回到页面顶部
    });
  });
}