const puppeteer = require("puppeteer");
const fs = require("fs");
const { execSync } = require("child_process");
const path = require("path");

let browser = null;
let page = null;

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function initBrowser() {
  console.log("🚀 راه‌اندازی...");
  browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
      '--disable-gpu','--disable-web-security','--disable-features=VizDisplayCompositor',
      '--disable-blink-features=AutomationControlled','--disable-extensions',
      '--disable-plugins','--disable-images','--no-first-run','--no-service-autorun',
      '--password-store=basic','--window-size=1920,1080',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ]
  });
  
  page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = { runtime: {} };
  });
  
  await page.goto("https://chatgpt.com", { waitUntil: 'networkidle0', timeout: 60000 });
  await wait(10000);
  await page.mouse.move(100, 100);
  console.log("✅ آماده!");
}

async function takeScreenshot() {
  console.log("📸 Screenshot...");
  await page.screenshot({ path: 'screenshot.png', type: 'png' });
  await page.screenshot({ path: 'screenshot-full.png', fullPage: true, type: 'png' });
  const buffer = await page.screenshot({ type: 'png' });
  fs.writeFileSync("screenshot-base64.txt", buffer.toString('base64'));
}

async function recordVideo(duration = 30000) {
  console.log("🎥 ضبط 30s ویدیو...");
  fs.mkdirSync('frames', { recursive: true });
  
  const fps = 10;  // 👈 کیفیت متوسط (10fps)
  const totalFrames = Math.floor(duration / 1000 * fps);
  
  for(let i = 0; i < totalFrames; i++) {
    const framePath = `frames/frame_${i.toString().padStart(4,'0')}.png`;
    await page.screenshot({ path: framePath });
    
    if(i % 10 === 0) {
      console.log(`🎥 Frame ${i}/${totalFrames}`);
    }
    
    await wait(1000 / fps);
  }
  
  // 👇 FFmpeg: frames → MP4
  const output = 'video.mp4';
  try {
    execSync(`ffmpeg -y -r ${fps} -i frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 -preset fast ${output}`, { timeout: 30000 });
    console.log(`✅ Video: ${fs.statSync(output).size / 1024 / 1024}MB`);
    
    // 👇 پاک کردن frames
    fs.rmSync('frames', { recursive: true, force: true });
  } catch(e) {
    console.error("❌ FFmpeg خطا:", e.message);
  }
}

(async () => {
  await initBrowser();
  
  while (true) {
    try {
      if (fs.existsSync('command_pipe.txt')) {
        const cmd = fs.readFileSync('command_pipe.txt', 'utf8').trim();
        console.log(`🆕 ${cmd}`);
        
        if (cmd === "exit") {
          if (browser) await browser.close();
          process.exit(0);
        }
        
        if (cmd.startsWith("click ")) {
          const [x, y] = cmd.slice(6).trim().split(",").map(Number);
          await page.mouse.move(x + Math.random()*10-5, y + Math.random()*10-5);
          await wait(100);
          await page.mouse.click(x, y, { delay: 50 });
        }
        
        if (cmd.startsWith("type ")) {
          const text = cmd.slice(5).trim();
          await page.keyboard.type(text, { delay: 80 });
        }
        
        if (cmd === "enter") {
          await page.keyboard.press('Enter', { delay: 50 });
        }
        
        console.log("⏳ 10s...");
        await wait(10000);
        
        // 👇 هر دو: Screenshot + Video!
        await takeScreenshot();
        await recordVideo(30000);  // 30s ویدیو
        
        fs.writeFileSync('response.txt', `✅ ${cmd} + Video OK!`);
        fs.unlinkSync('command_pipe.txt');
      }
    } catch(e) {
      console.error("❌", e.message);
      await wait(1000);
    }
    
    await wait(500);
  }
})();
