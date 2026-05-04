const puppeteer = require("puppeteer");
const fs = require("fs");

let browser = null;
let page = null;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initBrowser() {
  console.log("🚀 راه‌اندازی مرورگر...");
  browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });
  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  
  console.log("🌐 ChatGPT...");
  await page.goto("https://chatgpt.com", { 
    waitUntil: 'domcontentloaded', 
    timeout: 60000 
  });
  
  await wait(15000);
  console.log("✅ ChatGPT آماده!");
}

async function takeScreenshot() {
  console.log("📸 Screenshot...");
  await page.screenshot({ path: 'screenshot.png', type: 'png' });
  await page.screenshot({ path: 'screenshot-full.png', fullPage: true, type: 'png' });
  const buffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync("screenshot-base64.txt", buffer.toString('base64'));
  console.log(`✅ Full: ${fs.statSync('screenshot-full.png').size}b`);
  console.log(`✅ Visible: ${fs.statSync('screenshot.png').size}b`);
}

(async () => {
  await initBrowser();
  
  while (true) {
    try {
      if (fs.existsSync('command_pipe.txt')) {
        const cmd = fs.readFileSync('command_pipe.txt', 'utf8').trim();
        console.log(`🆕 دستور: ${cmd}`);
        
        if (cmd === "exit") {
          console.log("👋 خروج...");
          if (browser) await browser.close();
          process.exit(0);
        }
        
        if (cmd.startsWith("click ")) {
          const [x, y] = cmd.slice(6).trim().split(",").map(Number);
          if (!isNaN(x) && !isNaN(y)) {
            console.log(`🖱️ Real Click ${x},${y}`);
            await page.mouse.move(x, y);
            await page.mouse.down();
            await wait(50);
            await page.mouse.up();
          }
        }
        
        if (cmd.startsWith("type ")) {
          const text = cmd.slice(5).trim();
          console.log(`⌨️  Type: "${text}"`);
          await page.keyboard.type(text, { delay: 50 });
          await page.keyboard.press('Enter');
        }
        
        if (cmd === "enter") {
          console.log("⏎ Enter");
          await page.keyboard.press('Enter');
        }
        
        // 👇 10 ثانیه صبر بعد هر دستور
        console.log("⏳ 10s delay...");
        await wait(10000);
        
        await takeScreenshot();
        fs.writeFileSync('response.txt', `✅ ${cmd} تمام!`);
        fs.unlinkSync('command_pipe.txt');
      }
    } catch(e) {
      console.error("❌ خطا:", e.message);
    }
    
    await wait(500);
  }
})();
