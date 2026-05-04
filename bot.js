const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

let browser = null;
let page = null;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initBrowser() {
  console.log("🚀 راه‌اندازی مرورگر...");
  
  browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,1080"
    ]
  });
  
  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log("🌐 ChatGPT...");
  await page.goto("https://chatgpt.com", { 
    waitUntil: 'networkidle0', 
    timeout: 45000 
  });
  
  await wait(4000);
  console.log("✅ آماده!");
}

async function takeScreenshot() {
  console.log("📸 Screenshot...");
  
  // Full page screenshot
  const screenshot = await page.screenshot({ 
    path: 'screenshot-full.png',
    fullPage: true,
    type: 'png'
  });
  
  // Visible area
  const screenshotVisible = await page.screenshot({ 
    path: 'screenshot.png',
    type: 'png'
  });
  
  // Base64 هم
  const buffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync("screenshot-base64.txt", buffer.toString('base64'));
  
  console.log(`✅ Full: screenshot-full.png (${fs.statSync('screenshot-full.png').size}b)`);
  console.log(`✅ Visible: screenshot.png (${fs.statSync('screenshot.png').size}b)`);
  
  return true;
}

(async (cmd) => {
  try {
    await initBrowser();
    
    if (cmd?.startsWith("click ")) {
      const [x, y] = cmd.slice(6).trim().split(",").map(Number);
      if (!isNaN(x) && !isNaN(y)) {
        console.log(`🖱️ Click ${x},${y}`);
        await page.mouse.click(x, y);
        await wait(2000);
      }
    }
    
    await takeScreenshot();
    console.log("🎉 تمام!");
    
  } catch(e) {
    console.error("💥 خطا:", e.message);
  } finally {
    if (browser) await browser.close();
  }
})(process.argv[2]);
