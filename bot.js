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
  await page.goto("https://chatgpt.com", { waitUntil: 'networkidle0', timeout: 45000 });
  await wait(4000);
  console.log("✅ مرورگر آماده و persistent!");
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

// MAIN LOOP
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
        
        if (cmd?.startsWith("click ")) {
          const [x, y] = cmd.slice(6).trim().split(",").map(Number);
          if (!isNaN(x) && !isNaN(y)) {
            console.log(`🖱️ Click ${x},${y}`);
            await page.mouse.click(x, y);
            await wait(2000);
          }
        }
        
        await takeScreenshot();
        fs.writeFileSync('response.txt', `✅ ${cmd} تمام!`);
        
        // 👇 CRITICAL: پاک کردن pipe قبل response
        fs.unlinkSync('command_pipe.txt');
      }
    } catch(e) {
      console.error("❌ خطا:", e.message);
    }
    
    await wait(500);
  }
})();
