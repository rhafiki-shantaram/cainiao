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
        await page.goto('https://b.gfn.cainiao.com/dist/orderFrame#/abnor/outbound', { waitUntil: 'networkidle2' });

        // Wait and interact with the login form
        await page.waitForSelector('input[placeholder="Email / Phone"]');
        await page.type('input[placeholder="Email / Phone"]', '17609048951');
        await page.waitForSelector('input[placeholder="Password"]');
        await page.type('input[placeholder="Password"]', 'linghang123456');
        await page.click('button[type="submit"]');

        // Wait for navigation after login
        await page.waitForNavigation({ waitUntil: 'networkidle0' });

        // Click the button in the specified div and wait
        await page.waitForSelector('#ice-container div[class^="ProcessGuidance--ProcessWrap--"] div[class^="ProcessGuidance--buttonStyle--"] button');
        const buttonSelector = '#ice-container div[class^="ProcessGuidance--ProcessWrap--"] div[class^="ProcessGuidance--buttonStyle--"] button';
        await page.click(buttonSelector);
        await page.waitForTimeout(3000); // Wait for 3 seconds

        // Expand menu options, click the first list item and wait
        await page.waitForSelector('.index-slider .slider-wrapper');
        await page.click('.index-slider .slider-wrapper');
        await page.waitForTimeout(3000); // Wait for 3 seconds
        await page.waitForSelector('.ant-menu.ant-menu-inline.ant-menu-sub li:first-child');
        await page.click('.ant-menu.ant-menu-inline.ant-menu-sub li:first-child');
        await page.waitForTimeout(3000); // Wait for 3 seconds

        // Change dropdown selection and wait
        await page.waitForSelector('.next-pagination-size-selector .next-select.next-select-trigger');
        await page.click('.next-pagination-size-selector .next-select.next-select-trigger');
        await page.waitForSelector('.next-overlay-inner.next-select-spacing-tb');
        await page.evaluate(() => {
            document.querySelectorAll('.next-overlay-inner.next-select-spacing-tb .next-menu-item-text')
                .forEach(element => {
                    if (element.innerText === '500') {
                        element.click();
                    }
                });
        });
        await page.waitForTimeout(3000); // Wait for 3 seconds

        // Check if the table has data with a retry limit
        const maxRetries = 5;
        let hasData = false;
        let retryCount = 0;

        while (!hasData && retryCount < maxRetries) {
            hasData = await checkTableData(page);
            if (!hasData) {
                await page.reload({ waitUntil: 'networkidle0' });
                await page.waitForTimeout(3000); // Wait for 3 seconds
                retryCount++;
            }
        }

        if (hasData) {
            const tableData = await extractTableData(page);
            const transformedData = transformData(tableData);
            res.send(transformedData); // Send data back as response
        } else {
            console.log("Data not found after " + maxRetries + " retries.");
            res.send("Data not found after " + maxRetries + " retries.");
        }

    } catch (e) {
        console.error(`Error: ${e}`);
        if (page) {
            await page.screenshot({ path: 'error-screenshot.png' });
        }
        res.send(`Error: ${e}`);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

async function extractTableData(page) {
    return await page.evaluate(() => {
        let data = { headers: [], rows: [] };
        const headerCells = document.querySelectorAll('.next-table-header .next-table-cell.next-table-header-node .next-table-cell-wrapper');
        headerCells.forEach(cell => {
            data.headers.push(cell.innerText.trim());
        });
        const rows = document.querySelectorAll('.next-table-body tbody .next-table-row');
        rows.forEach(row => {
            let rowData = [];
            const cells = row.querySelectorAll('td .next-table-cell-wrapper');
            cells.forEach(cell => {
                rowData.push(cell.innerText.trim());
            });
            data.rows.push(rowData);
        });
        return data;
    });
}

function transformData(data) {
    const transformed = data.rows.map(row => {
        let obj = {};
        row.forEach((value, index) => {
            obj[data.headers[index]] = value;
        });
        return obj;
    });
    return transformed;
}

async function checkTableData(page) {
    return await page.evaluate(() => {
        const rows = document.querySelectorAll('.next-table-body tbody .next-table-row');
        return rows.length > 0;
    });
}

module.exports = { scrapeLogic };
