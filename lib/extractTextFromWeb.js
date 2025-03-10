"use strict";
// import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
// // Function to extract text from a single page
// export const extractTextFromWeb = async (url: string) => {
//     const pTagSelector = "body";
//     const cheerioLoader = new CheerioWebBaseLoader(url, {
//         selector: pTagSelector,
//     });
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webScraper = webScraper;
//     const docs = await cheerioLoader.load();
//     return docs;
// };
const puppeteer_1 = __importDefault(require("puppeteer"));
const initialUrl = 'https://aridient.com/';
function webScraper() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const browser = yield puppeteer_1.default.launch({});
            const page = yield browser.newPage();
            const visitedUrls = new Set(); // Track visited URLs to avoid duplicates
            // Get the domain of the initial URL
            const targetDomain = getDomain(initialUrl);
            if (!targetDomain) {
                console.error('Invalid initial URL');
                yield browser.close();
                return;
            }
            // Function to extract text from a single page
            const extractTextFromPage = (url) => __awaiter(this, void 0, void 0, function* () {
                if (visitedUrls.has(url))
                    return; // Skip if already visited
                visitedUrls.add(url); // Mark URL as visited
                console.log(`Processing: ${url}`);
                yield page.goto(url, { waitUntil: 'networkidle2' });
                yield page.setViewport({ width: 1080, height: 1024 });
                const text = yield page.evaluate(() => {
                    const extractText = (element) => {
                        let result = '';
                        if (element.tagName === 'nav' || element.tagName === 'ul' || element.tagName === 'li' || element.tagName === 'a') {
                            if (element.textContent && element.textContent.trim() !== '') {
                                result += element.textContent.trim() + ' ';
                            }
                        }
                        // Handle headings and paragraphs (e.g., <h1>, <p>)
                        else if (element.tagName === 'h1' || element.tagName === 'h2' || element.tagName === 'p') {
                            if (element.textContent && element.textContent.trim() !== '') {
                                result += '\n' + element.textContent.trim() + '\n'; // Add newlines around headings/paragraphs
                            }
                        }
                        // Handle other elements
                        else {
                            if (element.textContent && element.textContent.trim() !== '') {
                                result += element.textContent.trim() + ' '; // Add space after other elements
                            }
                        }
                        // // Recursively process child elements
                        // for (const child of element.children) {
                        //     result += extractText(child);
                        // }
                        return result;
                    };
                    // Start extraction from the body
                    return extractText(document.body);
                });
                // Clean up the text (replace multiple spaces/newlines with single ones)
                const cleanedText = text.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();
                console.log(`Extracted Text from ${url}:\n`, cleanedText);
                // Extract all links on the page
                const links = yield page.evaluate(() => {
                    const anchors = Array.from(document.querySelectorAll('a'));
                    return anchors.map((a) => a.href).filter((href) => href && !href.startsWith('javascript:'));
                });
                // Visit each linked page recursively (only if it belongs to the same domain)
                for (const link of links) {
                    const linkDomain = getDomain(link);
                    if (linkDomain === targetDomain) {
                        yield extractTextFromPage(link);
                    }
                    else {
                        console.log(`Skipping external link: ${link}`);
                    }
                }
            });
            // Start crawling from the initial URL
            yield extractTextFromPage(initialUrl);
            yield browser.close();
        }
        catch (error) {
            console.log("Error:", error);
        }
    });
}
const getDomain = (url) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname; // Extract the hostname (e.g., "aridient.com")
    }
    catch (error) {
        console.error(`Invalid URL: ${url}`);
        return null;
    }
};
