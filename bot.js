const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

let browser = null;
let page = null;
let isInitialized = false;

async function initBrowser() {
  if (browser) return;
  
  console.log("🚀 راه‌اندازی مرورگر...");
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-web-security",
      "--disable-features=VizDisplayCompositor"
    ]
  });
  page = await browser.newPage();
  
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setExtraHTTPHeaders({
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  });
  
  await page.setViewport({width: 1920, height: 1080});
  await page.goto("https://chatgpt.com", { 
    waitUntil: 'networkidle2',
    timeout: 60000 
  });
  
  // صبر هوشمند - COMPATIBILITY FIX برای Chromium 149
  await new Promise(r => setTimeout(r, 3000));
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await new Promise(r => setTimeout(r, 2000));
  
  isInitialized = true;
  console.log("✅ مرورگر آماده");
}

(async(cmd) => {
  console.log("📄" + (cmd || "screenshot"));
  
  try {
    await initBrowser();
    
    if (cmd && cmd !== "exit") {
      if (cmd.startsWith("click ")) {
        const [x, y] = cmd.slice(6).split(" ").map(Number);
        console.log(`🖱️ کلیک: ${x},${y}`);
        await page.mouse.click(x, y);
        await new Promise(r => setTimeout(r, 3000)); // ✅ سازگار با همه نسخه‌ها
      }
    }
    
    await page.screenshot({path: "screenshot.png", fullPage: true});
    fs.writeFileSync("screenshot-base64.txt", fs.readFileSync("screenshot.png").toString("base64"));
    console.log("✅OK");
    
  } catch (error) {
    console.error("❌ خطا:", error.message);
    if (browser) {
      await browser.close();
      browser = null;
      isInitialized = false;
    }
  }
})(process.argv[2]);
