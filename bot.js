const puppeteer = require("puppeteer");
const fs = require("fs");

let browser = null;
let page = null;
let isBrowserReady = false;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function safeCloseBrowser() {
  try {
    if (browser && browser.isConnected()) {
      await browser.close();
    }
  } catch(e) {}
  browser = null;
  page = null;
  isBrowserReady = false;
}

async function initBrowser() {
  try {
    if (browser && !browser.isConnected()) {
      await safeCloseBrowser();
    }
    
    if (!browser || !isBrowserReady) {
      console.log("🚀 راه‌اندازی مرورگر...");
      await safeCloseBrowser();
      
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu"
        ]
      });
      
      page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      
      console.log("🌐 بارگذاری ChatGPT...");
      await page.goto("https://chatgpt.com", { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });
      
      await wait(3000);
      isBrowserReady = true;
      console.log("✅ مرورگر آماده!");
    }
  } catch(e) {
    console.error("❌ خطای init:", e.message);
    await safeCloseBrowser();
    throw e;
  }
}

async function takeScreenshot() {
  try {
    console.log("📸 گرفتن اسکرین‌شات...");
    const screenshotBuffer = await page.screenshot({
      type: 'png'
    });
    
    fs.writeFileSync("screenshot.png", screenshotBuffer);
    fs.writeFileSync("screenshot-base64.txt", screenshotBuffer.toString('base64'));
    
    console.log(`✅ اسکرین‌شات: ${screenshotBuffer.length} بایت`);
    return true;
  } catch(e) {
    console.error("❌ خطای screenshot:", e.message);
    return false;
  }
}

(async (cmd) => {
  console.log("🎯 دستور:", cmd || "screenshot");
  
  try {
    await initBrowser();
    
    if (cmd?.startsWith("click ")) {
      const coords = cmd.slice(6).trim().split(",");
      const x = parseFloat(coords[0]);
      const y = parseFloat(coords[1]);
      
      if (!isNaN(x) && !isNaN(y)) {
        console.log(`🖱️ کلیک: ${x},${y}`);
        await page.mouse.click(x, y);
        await wait(1500);
      }
    }
    
    const success = await takeScreenshot();
    process.exit(success ? 0 : 1);
    
  } catch(e) {
    console.error("💥 خطا:", e.message);
    await safeCloseBrowser();
    process.exit(1);
  }
})(process.argv[2]);
