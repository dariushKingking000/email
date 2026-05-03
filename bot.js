const puppeteer = require("puppeteer");
const fs = require("fs");

(async (cmd) => {
  console.log("📄 Command: " + cmd);

  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 800 },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-blink-features=AutomationControlled",
      "--start-maximized",
      "--disable-gpu"
    ]
  });

  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  console.log("🌐 Visiting ChatGPT...");
  await page.goto("https://chatgpt.com", { waitUntil: "networkidle2" });

  if (cmd && cmd !== "exit") {
    if (cmd.startsWith("click ")) {
      const [x, y] = cmd.slice(6).split(" ").map(Number);
      console.log(`🖱 Clicking at ${x},${y}`);
      await page.mouse.click(x, y);
      // استفاده از setTimeout با Promise برای ایجاد تأخیر
      await new Promise(resolve => setTimeout(resolve, 1500)); // جایگزین صحیح
    }

    if (cmd.startsWith("type ")) {
      const text = cmd.slice(5);
      console.log("⌨ Typing:", text);
      await page.keyboard.type(text, { delay: 80 });
      // استفاده از setTimeout با Promise برای ایجاد تأخیر
      await new Promise(resolve => setTimeout(resolve, 1500)); // جایگزین صحیح
    }
  }

  console.log("📸 Taking screenshot...");
  await page.screenshot({ path: "screenshot.png", fullPage: true });

  await browser.close();
  console.log("🔒 Closing browser and saving screenshot...");

  fs.writeFileSync("screenshot-base64.txt",
    fs.readFileSync("screenshot.png").toString("base64")
  );

  console.log("✅ Done");
})(process.argv[2]);
