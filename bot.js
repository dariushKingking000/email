const puppeteer = require("puppeteer");
const fs = require("fs").promises; // استفاده از promises برای async/await
const path = require('path');

async function runBot() {
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

  // حلقه اصلی برای خواندن دستورات
  while (true) {
    let commandFilePath = path.join(__dirname, 'command.txt');
    let commandProcessedPath = path.join(__dirname, 'command_processed.txt');

    let command = null;
    let commandExists = false;
    try {
        // بررسی وجود فایل command.txt
        await fs.access(commandFilePath);
        commandExists = true;
        const content = await fs.readFile(commandFilePath, 'utf-8');
        command = content.trim();
    } catch (error) {
        // فایل وجود ندارد، منتظر می‌مانیم
        console.log("No command.txt found. Waiting...");
    }

    if (commandExists && command) {
        if (command === "exit") {
            console.log("Exit command received. Stopping bot.");
            await fs.unlink(commandFilePath); // حذف فایل دستور
            break; // خروج از حلقه
        }

        console.log("Processing command: " + command);

        // اجرای دستور
        if (command.startsWith("click ")) {
          const [x, y] = command.slice(6).split(" ").map(Number);
          console.log(`🖱 Clicking at ${x},${y}`);
          await page.mouse.click(x, y);
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else if (command.startsWith("type ")) {
          const text = command.slice(5);
          console.log("⌨ Typing:", text);
          await page.keyboard.type(text, { delay: 80 });
          await new Promise(resolve => setTimeout(resolve, 1500));
        } else {
            console.log(`Unknown command: ${command}`);
        }

        // گرفتن اسکرین شات بعد از هر دستور موفق
        console.log("📸 Taking screenshot...");
        await page.screenshot({ path: "screenshot.png", fullPage: true });
        await fs.writeFile("screenshot-base64.txt",
          (await fs.readFile("screenshot.png")).toString("base64")
        );
        console.log("✅ Screenshot saved.");

        // فایل دستور را حذف می‌کنیم تا دوباره اجرا نشود
        await fs.unlink(commandFilePath);
        // یک فایل نشانگر برای commit ایجاد می‌کنیم
        await fs.writeFile(commandProcessedPath, "processed");

    } else if (commandExists && command === "") {
         // اگر فایل خالی بود، آن را حذف می‌کنیم
         console.log("Empty command.txt found. Deleting it.");
         await fs.unlink(commandFilePath);
    }

    // منتظر می‌مانیم تا فایل command_processed.txt ایجاد شود (نشان دهنده اتمام کار)
    // و یا فایل command.txt دوباره ایجاد شود.
    // این کار باعث می‌شود که اسکریپت منتظر بماند و CPU را اشغال نکند.
    await new Promise(resolve => setTimeout(resolve, 10000)); // چک کردن هر 10 ثانیه
  }

  await browser.close();
  console.log("🔒 Browser closed.");
}

runBot().catch(error => {
  console.error("Bot encountered an error:", error);
  process.exit(1); // خروج با کد خطا در صورت بروز مشکل
});
