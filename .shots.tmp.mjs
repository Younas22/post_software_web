import { chromium } from "playwright";

const out = process.argv[2];
const pages = (process.argv[3] || "/dashboard").split(",");
const loginSlug = process.argv[4] || "";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

await page.goto(`http://localhost:3000/login${loginSlug ? "/" + loginSlug : ""}`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}-login.png` });

await page.fill("#email", "demo.owner@possaas.test");
await page.fill("#password", "password");
await page.click('button[type="submit"]');
await page.waitForURL("**/dashboard", { timeout: 30000 });

for (const path of pages) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}${path.replace(/[/?=]/g, "_")}.png` });
}
console.log(JSON.stringify(errors.slice(0, 10), null, 1));
await browser.close();
