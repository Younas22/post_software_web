import { chromium } from "playwright";
const shotDir = "C:/Users/User/AppData/Local/Temp/claude/e--sv26-htdocs-post-software-web/cd2cde85-8a16-4a36-baae-e9bc6fcc8e4d/scratchpad/shots";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("response", async (r) => { if (r.status() >= 400 && r.status() !== 403) errs.push(`${r.status()} ${r.url()}`); });

await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
await page.getByLabel("Email").fill("test.cashier@possaas.test");
await page.getByLabel("Password").fill("Passw0rd!23");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL("**/dashboard", { timeout: 20000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${shotDir}/cashier-dashboard.png`, fullPage: true });

// Try navigating directly to a page cashier shouldn't have (Employees) - permission gate should hide nav but let's see behavior if visited directly
await page.goto("http://localhost:3000/employees", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${shotDir}/cashier-employees-attempt.png`, fullPage: true });

await page.goto("http://localhost:3000/pos", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: `${shotDir}/cashier-pos.png`, fullPage: true });

console.log("ERRORS:", errs.length ? errs.join("\n") : "(none)");
await browser.close();
