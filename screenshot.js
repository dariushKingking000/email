const puppeteer = require('puppeteer');
const fs = require('fs');

// همیشه chatgpt.com - command.txt فقط لاگ
const url = 'https://chatgpt.com';

// لاگ command.txt
const cmdContent = process.env.CMD_CONTENT || 'خالی';
console.log(`📄 command.txt: "${cmdContent}"`);
console.log(`📸 میره: ${url}`);

fs.writeFileSync('config.json', JSON.stringify({url, cmd: cmdContent, timestamp: new Date().toISOString()}, null, 2));

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
