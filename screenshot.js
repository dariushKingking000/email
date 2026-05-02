const puppeteer = require('puppeteer');
const fs = require('fs');
const process = require('process');

let url = 'https://chatgpt.com';

// از command.txt یا environment
const cmdContent = process.env.CMD_CONTENT || '';
if (cmdContent) {
  url = cmdContent.startsWith('http') ? cmdContent : `https://${cmdContent}`;
  console.log(`🔗 از command.txt: ${url}`);
}

console.log(`📸 میره: ${url}`);

fs.writeFileSync('config.json', JSON.stringify({url, timestamp: new Date().toISOString()}, null, 2));

(async () => {
  const browser = await puppeteer.launch({headless: true, args: ['--no-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  await page.goto(url, {waitUntil: 'networkidle2', timeout: 30000});
  await page.screenshot({path: 'screenshot.png', fullPage: true});
  await browser.close();
  
  const base64Image = fs.readFileSync('screenshot.png').toString('base64');
  fs.writeFileSync('screenshot-base64.txt', base64Image);
  console.log('📏 Size:', base64Image.length);
  console.log('✅ آماده!');
})().catch(e => {
  console.error('❌ خطا:', e.message);
  process.exit(1);
});
