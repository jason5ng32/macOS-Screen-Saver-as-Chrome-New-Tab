document.addEventListener("DOMContentLoaded", function () {
    // 获取存储的字体设置
    chrome.storage.sync.get('fontChoice', function(data) {
      const fontChoice = data.fontChoice || 'infinity';
  
      if (fontChoice !== 'infinity') {
        const styleTags = document.getElementsByTagName('style');
        for (let tag of styleTags) {
          // 使用正则表达式匹配所有 font-family: "CustomFont";，并注释掉
          tag.innerHTML = tag.innerHTML.replace(/(font-family:\s*"CustomFont";)/g, '/* $1 */');
        }
      }
    });
  });
  