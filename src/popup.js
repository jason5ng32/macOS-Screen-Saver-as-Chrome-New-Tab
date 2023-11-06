let allAvailableVideos = [];
let currentVideoIndex = -1; // 用于跟踪当前播放的视频
let currentIndex = 0; // 用于跟踪当前展示到哪条格言
const defaultQuotes = [
  { content: "Radiate boundless love towards the entire world — above, below, and across — unhindered, without ill will, without enmity.", author: "The Buddha" },
  { content: "I'll prepare and someday my chance will come.", author: "Abraham Lincoln" },
  { content: "If you love someone, set them free. If they come back, they're yours; if they don't, they never were.", author: "Richard Bach" },
  { content: "He who is taught to live upon little owes more to his father's wisdom than he who has a great deal left him does to his father's care.", author: "William C. Menninger" },
  { content: "Life is a progress, and not a station.", author: "Ralph Waldo Emerson" },
  { content: "History will be kind to me for I intend to write it.", author: "Winston Churchill" },
  { content: "Everything that irritates us about others can lead us to a better understanding of ourselves.", author: "Carl Jung" },
  { content: "here is nothing in a caterpillar that tells you it's going to be a butterfly.", author: "Buckminster Fuller" },
  { content: "You can't shake hands with a clenched fist.", author: "Indira Gandhi" },
  { content: "Men in general judge more from appearances than from reality. All men have eyes, but few have the gift of penetration.", author: "Niccolò Machiavelli" }
];

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
  // 展示 Top Sites
  if (newdata.showTopSites) {
    updateTopSites(newdata.sitesCycle);
    topSitesUI();
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
function updateUI({ showTime, showWeather, showSearch, showMotto, refreshButton, authorInfo, showTopSites }) {
  setDisplay('current-time', showTime ? 'block' : 'none');
  setDisplay('weather-area', showWeather ? 'flex' : 'none');
  setDisplay('wth', showWeather ? 'block' : 'none');
  setDisplay('topsites-area', showTopSites ? 'flex' : 'none');
  setDisplay('tss', showTopSites ? 'block' : 'none');
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
    const videoStatus = '1';
    console.error('Error fetching directory:', error);
    videoSettingsSuggestion(videoStatus);
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

    if (reverseProxy) {
      videoSettingsSuggestion('3');
    }
  } catch (error) {
    console.error('Error fetching video from Apple Server:', error);
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

  // 监听视频加载错误
  video.addEventListener('error', function () {
    console.error('Error in video loading: ', video.error);

    // 根据 newdata 的值调用 videoSettingsSuggestion
    if (newdata.videoSrc === 'apple' && !newdata.reverseProxy) {
      // 如果从 Apple 服务器加载视频失败，且未使用反向代理
      videoSettingsSuggestion('2');
    } else if (newdata.videoSrc === 'local') {
      // 如果从本地服务器加载视频失败
      videoSettingsSuggestion('1');
    }
    // 其他情况则不调用 videoSettingsSuggestion，或者您可以设定一个默认处理
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
    errorBox.style.backgroundColor = '#ff000094';
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

// 获取格言
async function fetchRandomMotto() {
  const mottoElement = document.getElementById('motto');

  try {
    let quotes = JSON.parse(localStorage.getItem('quotes'));
    let currentIndex = parseInt(localStorage.getItem('currentIndex')) || 0;
    let usingDefaults = JSON.parse(localStorage.getItem('usingDefaults')) || false;

    if (!quotes || currentIndex >= quotes.length) {
      try {
        const response = await fetch('https://api.quotable.io/quotes/random?limit=50&maxLength=150');
        const data = await response.json();
        quotes = data;
        localStorage.setItem('quotes', JSON.stringify(quotes));
        localStorage.setItem('usingDefaults', 'false');
        currentIndex = 0;
      } catch (apiError) {
        usingDefaults = true;
        localStorage.setItem('usingDefaults', 'true');
      }
    }

    if (usingDefaults) {
      quotes = defaultQuotes;
      currentIndex = currentIndex % defaultQuotes.length;
    }

    const { content, author } = quotes[currentIndex];
    localStorage.setItem('currentIndex', currentIndex + 1);

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
    errorBox.style.backgroundColor = '#ff000094';
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
  const lastUpdated = localStorage.getItem('weatherLastUpdated');
  const now = new Date().getTime();

  let shouldUpdate = localStorage.getItem('shouldUpdate') === 'true';

  if (!shouldUpdate && lastUpdated && now - lastUpdated < 30 * 60 * 1000) { // 30分钟
    shouldUpdate = false;
  } else {
    shouldUpdate = true;
  }

  // 如果决定更新，重置 shouldUpdate 标记
  if (shouldUpdate) {
    localStorage.setItem('shouldUpdate', 'false');
  }

  await getCurrentWeather(city, tempUnit, weatherAPIKEY, shouldUpdate);
  await getForecastWeather(city, tempUnit, weatherAPIKEY, shouldUpdate);

  if (shouldUpdate) {
    localStorage.setItem('weatherLastUpdated', now.toString());
  }
}

// 获取实时天气
async function getCurrentWeather(city, tempUnit, weatherAPIKEY, shouldUpdate) {
  try {
    let data;

    if (!shouldUpdate) {
      data = JSON.parse(localStorage.getItem('currentWeather'));
    } else {
      const response = await fetch(
        `http://api.weatherapi.com/v1/current.json?key=${weatherAPIKEY}&q=${city}`
      );
      data = await response.json();
      localStorage.setItem('currentWeather', JSON.stringify(data));
    }

    const temperature = tempUnit === 'celsius' ? data.current.temp_c : data.current.temp_f;
    document.getElementById('current-weather').textContent = `${temperature}°`;
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.src = `https://${data.current.condition.icon}`;
    weatherIcon.onerror = function () {
      this.src = 'weather.webp';
    };
  } catch (error) {
    console.error(`Get weather failed: ${error}`);
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent =
      'Get weather failed. Please check the API key and city name then try again.';
    errorBox.style.display = 'flex';
    errorBox.style.backgroundColor = '#ff000094';
    document.body.style.backgroundColor = 'black';
  }
}

// 获取预测天气
async function getForecastWeather(city, tempUnit, weatherAPIKEY, shouldUpdate) {
  try {
    let data;

    if (!shouldUpdate) {
      data = JSON.parse(localStorage.getItem('forecastWeather'));
    } else {
      const response = await fetch(
        `http://api.weatherapi.com/v1/forecast.json?key=${weatherAPIKEY}&q=${city}&days=3`
      );
      data = await response.json();
      localStorage.setItem('forecastWeather', JSON.stringify(data));
    }

    const { forecastday } = data.forecast;

    for (let i = 0; i < forecastday.length; i++) {
      const day = forecastday[i];
      const forecastIcon = document.getElementById(`weather-icon${i + 1}`);

      forecastIcon.src = `https://${day.day.condition.icon}`;
      forecastIcon.onerror = function () {
        this.src = 'weather.webp';
      };
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

// 视频设置建议
function videoSettingsSuggestion(videoStatus) {
  const errorBox = document.getElementById('errorBox');

  if (videoStatus === '1') {
    errorBox.innerHTML =
      'It looks like you are using local video server but fetching videos failed. Please make sure you have set the correct URL.\nFollow the &nbsp;<a href=\"instructions.html\" target=_blank >instructions</a>&nbsp; here to make it work.';
    errorBox.style.backgroundColor = '#ff000094';
  } else if (videoStatus === '2') {
    errorBox.innerHTML =
      "It looks like you are using Apple Server as video source, but havn't trust Apple's Root Certificate yet.\nFollow the &nbsp;<a href=\"instructions.html\" target=_blank >instructions</a>&nbsp; here to make it work.";
    errorBox.style.backgroundColor = '#ff000094';
  } else if (videoStatus === '3') {
    errorBox.innerHTML =
      "It looks like you are our reverse proxy. The great way to use Macify is to set up local server or use Apple's Server without reverse proxy.\nFollow the &nbsp;<a href=\"instructions.html\" target=_blank >instructions</a>&nbsp; here to make it better.";
    errorBox.style.backgroundColor = '#328d6e';
  }
  errorBox.style.display = 'flex';
}


// 获取 Top Sites
function updateTopSites(sitesCycle) {
  // 从 localStorage 中获取 shouldRefreshSites 的值和上次更新 top sites 的时间
  let shouldRefreshSites = localStorage.getItem('shouldRefreshSites');
  let lastSitesUpdated = localStorage.getItem('lastSitesUpdated');

  const now = Date.now();
  // 如果上次更新时间超过了 10 分钟，则设置 shouldRefreshSites 为 true
  if (lastSitesUpdated === null || now - parseInt(lastSitesUpdated, 10) > 10 * 60 * 1000) {
    shouldRefreshSites = 'true';
  }
  if (shouldRefreshSites === null || shouldRefreshSites === 'true') {
    // 需要刷新 top sites，进行计算并更新
    computeAndUpdateTopSites(sitesCycle);
  } else {
    // 从 localStorage 获取 top sites 数据
    let storedTopSites = localStorage.getItem('topSites');
    if (storedTopSites) {
      storedTopSites = JSON.parse(storedTopSites);
      updateTopSitesList(storedTopSites);
    } else {
      console.log('No Top Sites data found in local storage.');
    }
  }
}

function computeAndUpdateTopSites(sitesCycle) {
  const startDate = Date.now() - (sitesCycle * 24 * 60 * 60 * 1000);
  const now = Date.now();
  chrome.history.search({ text: '', startTime: startDate, endTime: now, maxResults: 10000 }, historyItems => {
    const domainCountMap = new Map();
    historyItems.forEach(item => {
      if (item.url.startsWith('http://') || item.url.startsWith('https://')) {
        const domain = new URL(item.url).hostname;
        domainCountMap.set(domain, (domainCountMap.get(domain) || 0) + item.visitCount);
      }
    });

    const topSites = Array.from(domainCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([domain, count]) => ({
        url: historyItems.find(item => new URL(item.url).hostname === domain).url,
        count,
        title: historyItems.find(item => new URL(item.url).hostname === domain).title || domain,
      }));

    updateTopSitesList(topSites);

    // 将 top sites 数据转换为字符串并存储到 localStorage
    localStorage.setItem('topSites', JSON.stringify(topSites));
    localStorage.setItem('lastSitesUpdated', now.toString());
    localStorage.setItem('shouldRefreshSites', 'false');
  });
}


// 标题缩短
function trimTitle(title, maxLength) {
  let length = 0;
  let trimmedTitle = '';
  for (let i = 0; i < title.length; i++) {
    length += title.charCodeAt(i) > 255 ? 2 : 1;
    if (length > maxLength) break;
    trimmedTitle = title.substring(0, i + 1);
  }
  return length > maxLength ? trimmedTitle + '...' : title;
}

// 获取 Favicon
function fetchFavicon(domain, onUpdate) {
  const defaultFavicon = 'url.png';
  const faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain_url=${domain}&sz=64`;

  // 首先返回默认图片
  onUpdate(defaultFavicon);

  const img = new Image();
  img.onload = () => onUpdate(faviconUrl); // 成功加载后，通过回调更新 favicon
  img.onerror = () => onUpdate(defaultFavicon); // 加载失败，确认使用默认图片
  img.src = faviconUrl;
}



// 展示 Topsites
function updateTopSitesList(topSites) {
  const topSitesList = document.getElementById('topsites');
  topSitesList.innerHTML = '';
  const defaultFaviconUrl = 'url.png';

  topSites.forEach(site => {
    // 创建 list item
    const listItem = document.createElement('li');
    listItem.style.display = 'flex';
    listItem.style.alignItems = 'center';
    listItem.style.marginBottom = '10px';

    // 创建 favicon image
    const favicon = new Image();
    favicon.id = `favicon-${site.url}`;
    favicon.src = defaultFaviconUrl;
    favicon.style.width = '12pt';
    favicon.style.cursor = 'pointer';
    favicon.style.height = 'auto';
    
    // 创建 title span
    const titleSpan = document.createElement('span');
    titleSpan.style.cursor = 'pointer';
    titleSpan.style.marginLeft = '10px';
    titleSpan.style.whiteSpace = 'nowrap';
    titleSpan.style.overflow = 'hidden';
    titleSpan.style.textOverflow = 'ellipsis';
    titleSpan.title = site.title;
    titleSpan.textContent = trimTitle(site.title, 25);

    // 绑定 click 事件打开新窗口
    favicon.addEventListener('click', () => window.open(site.url, '_blank'));
    titleSpan.addEventListener('click', () => window.open(site.url, '_blank'));

    // 将 favicon 和 title span 添加到 list item
    listItem.appendChild(favicon);
    listItem.appendChild(titleSpan);

    // 将 list item 添加到 list
    topSitesList.appendChild(listItem);

    // 异步更新 favicon
    fetchFavicon(new URL(site.url).origin, (updatedFaviconUrl) => {
      const faviconElement = document.getElementById(`favicon-${site.url}`);
      if (faviconElement) {
        faviconElement.src = updatedFaviconUrl;
      }
    });
  });
}




function topSitesUI() {
  let tssElements = document.querySelectorAll('#tssBtn');
  let tssInfo = document.querySelector('#topsites');
  let tssArea = document.querySelector('#topsites-area');
  let timeoutId = null;
  if (newdata.showWeather) {
    tssArea.style.marginTop = '30pt';
  }
  tssElements.forEach(function (tssElement) {
    tssElement.addEventListener('mouseover', function () {
      clearTimeout(timeoutId);
      tssInfo.style.opacity = '1';
      tssInfo.style.transform = 'translateX(0)';
      tssElement.classList.add('active-hover');
    });

    tssElement.addEventListener('mouseout', function () {
      timeoutId = setTimeout(function () {
        tssInfo.style.opacity = '0';
        tssInfo.style.transform = 'translateX(+140%)';
        tssElement.classList.remove('active-hover');
      }, 100);
    });
  });

  tssInfo.addEventListener('mouseover', function () {
    clearTimeout(timeoutId);
    tssElements.forEach(element => element.classList.add('active-hover'));
  });

  tssInfo.addEventListener('mouseout', function () {
    timeoutId = setTimeout(function () {
      tssInfo.style.opacity = '0';
      tssInfo.style.transform = 'translateX(+140%)';
      tssElements.forEach(element => element.classList.remove('active-hover'));
    }, 100);
  });
}