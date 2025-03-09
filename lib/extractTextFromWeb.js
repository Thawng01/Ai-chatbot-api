"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCrawl = exports.extractTextFromWeb = void 0;
const cheerio_1 = require("@langchain/community/document_loaders/web/cheerio");
const crawlee_1 = require("crawlee");
// Function to extract text from a single page
const extractTextFromWeb = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const pTagSelector = "h1, h2, h4, h5, h6, p, span, li";
    const cheerioLoader = new cheerio_1.CheerioWebBaseLoader(url, {
        selector: pTagSelector,
    });
    const docs = yield cheerioLoader.load();
    return docs;
});
exports.extractTextFromWeb = extractTextFromWeb;
const startCrawl = (url) => __awaiter(void 0, void 0, void 0, function* () {
    // CheerioCrawler crawls the web using HTTP requests
    // and parses HTML using the Cheerio library.
    const crawler = new crawlee_1.CheerioCrawler({
        // Use the requestHandler to process each of the crawled pages.
        requestHandler(_a) {
            return __awaiter(this, arguments, void 0, function* ({ request, $, enqueueLinks, log }) {
                const title = $('title').text();
                log.info(`Title of ${request.loadedUrl} is '${title}'`);
                // Function to extract all text content from the page
                const extractAllText = () => {
                    let allText = '';
                    // Traverse the DOM and collect text from all elements
                    $('*').each((index, element) => {
                        const text = $(element).text().trim();
                        if (text) {
                            allText += text + '\n';
                        }
                    });
                    return allText.trim(); // Remove any leading/trailing whitespace
                };
                // Extract all text content from the page
                const pageText = extractAllText();
                // Save results as JSON to ./storage/datasets/default
                yield crawlee_1.Dataset.pushData({
                    title,
                    url: request.loadedUrl,
                    text: pageText,
                });
                // Extract links from the current page and add them to the crawling queue.
                yield enqueueLinks();
            });
        },
        // Let's limit our crawls to make our tests shorter and safer.
        maxRequestsPerCrawl: 50,
    });
    // Add first URL to the queue and start the crawl.
    yield crawler.run([url]);
});
exports.startCrawl = startCrawl;
