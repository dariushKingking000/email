const puppeteer = require("puppeteer");
const fs = require("fs");
const { execSync } = require("child_process");

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

async function executeCommand(cmd) {
  console.log(`🔧 ${cmd}`);
  if (cmd.startsWith("click ")) {
    const [x, y] = cmd.slice(6).trim().split(",").map(Number);
    await page.mouse.move(x + Math.random()*10-5, y + Math.random()*10-5);
    await wait(100);
    await page.mouse.click(x, y, { delay: 50 });
  } else if (cmd.startsWith("type ")) {
    const text = cmd.slice(5).trim();
    await page.keyboard.type(text, { delay: 80 });
  } else if (cmd === "enter") {
    await page.keyboard.press('Enter', { delay: 50 });
  }
}

async function recordVideoWithActions(commands) {
  console.log("🎥 Video + Multi Actions...");
  fs.mkdirSync('frames', { recursive: true });
  
  const fps = 10;
  const cmdCount = commands.length;
  const baseDelayPerCmd = 5000;  // 👈 پایه 5s هر دستور
  const extraDelayPerCmd = Math.max(0, cmdCount - 6) * 5000;  // 👈 بعد 6: +5s هر کدام
  const delayPerCmd = baseDelayPerCmd + extraDelayPerCmd;
  const totalDuration = cmdCount * delayPerCmd;
  const totalFrames = Math.floor(totalDuration / 1000 * fps);
  
  console.log(`📊 ${cmdCount} دستور (${extraDelayPerCmd/1000}s extra) - هر کدام ${delayPerCmd/1000}s = ${totalDuration/1000}s`);
  
  let frameIndex = 0;
  
  for(let cmdIndex = 0; cmdIndex < cmdCount; cmdIndex++) {
    const cmd = commands[cmdIndex];
    
    // 1/3 قبل action
    const preFrames = Math.floor((delayPerCmd / 3) / 1000 * fps);
    for(let i = 0; i < preFrames; i++) {
      await page.screenshot({ path: `frames/frame_${frameIndex.toString().padStart(4,'0')}.png` });
      frameIndex++;
      await wait(100);
    }
    
    // ACTION وسط!
    await executeCommand(cmd);
    
    // 2/3 بعد action
    const postFrames = Math.floor((delayPerCmd * 2 / 3) / 1000 * fps);
    for(let i = 0; i < postFrames; i++) {
      await page.screenshot({ path: `frames/frame_${frameIndex.toString().padStart(4,'0')}.png` });
      frameIndex++;
      await wait(100);
    }
  }
  
  const output = 'video.mp4';
  try {
    execSync(`ffmpeg -y -r ${fps} -i frames/frame_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 -preset fast ${output}`, { timeout: 60000 });
    console.log(`✅ Video ${totalFrames} frames: ${fs.statSync(output).size / 1024 / 1024}MB`);
    fs.rmSync('frames', { recursive: true, force: true });
  } catch(e) {
    console.error("❌ FFmpeg:", e.message);
  }
}

(async () => {
  await initBrowser();
  
  while (true) {
    try {
      if (fs.existsSync('command_pipe.txt')) {
        let content = fs.readFileSync('command_pipe.txt', 'utf8').trim();
        console.log(`🆕 ${content}`);
        
        if (content === "exit") {
          if (browser) await browser.close();
          process.exit(0);
        }
        
        const commands = content.split('\n')
          .map(line => line.trim())
          .filter(line => line && (line.startsWith('click ') || line.startsWith('type ') || line === 'enter'))
          .slice(0, 20);
        
        console.log(`📝 ${commands.length} دستور (max 20)`);
        
        await recordVideoWithActions(commands);
        await takeScreenshot();
        
        fs.writeFileSync('response.txt', `✅ ${commands.length} دستور OK!`);
        fs.unlinkSync('command_pipe.txt');
      }
    } catch(e) {
      console.error("❌", e.message);
      await wait(1000);
    }
    
    await wait(500);
  }
})();
