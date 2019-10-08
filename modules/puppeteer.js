const puppeteer = require("puppeteer");

mbot._browser = false;
mbot._userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"

mbot.getBrowser = () => {
  return new Promise(async (resolve, reject) => {
    if (mbot._browser) {
      resolve(mbot._browser);
    } else {
      try {
        mbot._browser = await puppeteer.launch(Object.assign({
          "executablePath": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "args": ["--no-sandbox"]
        }, mbot.conf.puppeteer));
        resolve(mbot._browser);
      } catch (err) {
        reject(err);
      }
    }
  });
}

mbot.getPage = (url) => {
  return new Promise(async (resolve, reject) => {
    try {
      const browser = await mbot.getBrowser();
      const page = await browser.newPage();
      await page.setUserAgent(mbot._userAgent);
      await page.goto(url || "about:blank");
      await page.waitForSelector("body");
      resolve(page);
    } catch (err) {
      reject(err);
    }
  });
}

mbot.getPageContent = (url) => {
  return new Promise(async (resolve, reject) => {
    try {
      const page = await mbot.getPage(url);
      const content = await page.evaluate(() => document.body.textContent);
      page.close();
      if (!content || (content && content.includes("HTTP ERROR"))) {
        reject(content);
      } else {
        try {
          resolve(JSON.parse(content));
        } catch {
          resolve(content);
        }
      }
    } catch (err) {
      reject(err);
    }
  });
}
