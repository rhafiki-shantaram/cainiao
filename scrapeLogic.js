const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
require("dotenv").config();

puppeteer.use(StealthPlugin());

const scrapeLogic = async (res) => {
    const browser = await puppeteer.launch({
        headless: false,
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote",
        ],
        executablePath: process.env.NODE_ENV === 'production' ? process.env.PUPPETEER_EXECUTABLE_PATH : puppeteer.executablePath()
    });

    let page;

    try {
        page = await browser.newPage();

        // Navigate to the specified page
        await page.goto('https://b.gfn.cainiao.com/dist/orderFrame#/abnor/outbound');
        await page.waitForTimeout(5000); // Wait for 5 seconds for the page to load

        // Attempt to find the selector for login
        try {
            await page.waitForSelector('input[placeholder="Email / Phone"]', { timeout: 5000 });
            await page.type('input[placeholder="Email / Phone"]', '17609048951');
            await page.waitForSelector('input[placeholder="Password"]', { timeout: 5000 });
            await page.type('input[placeholder="Password"]', 'linghang123456');
            await page.click('button[type="submit"]');
        } catch (error) {
            // If selector is not found, return the HTML of the current page
            const html = await page.content();
            res.send(html);
        }
        
    } catch (e) {
        console.error(`Error: ${e}`);
        res.send(`Error: ${e}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = { scrapeLogic };
