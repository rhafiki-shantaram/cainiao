const express = require(`express`);
const app = express();
const {scrapeLogic} = require("./scrapeLogic")

const PORT = process.env.port || 4000;

app.get("/scrape", async(req, res) => {
    await scrapeLogic(res);
})

app.get("/", (req, res) => {
    res.send(`Render puppeteer server is up and running;`)
})

app.listen(4000, () => {
    console.log(`listening on port ${PORT}`);
})