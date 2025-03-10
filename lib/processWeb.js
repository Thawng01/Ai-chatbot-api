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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mistralai_1 = require("@langchain/mistralai");
const pinecone_1 = require("@pinecone-database/pinecone");
const puppeteer_1 = __importDefault(require("puppeteer"));
const url_1 = require("url");
// Initialize Pinecone
const pinecone = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const embeddings = new mistralai_1.MistralAIEmbeddings({ model: "mistral-embed" });
// Function to split text into chunks
const splitTextIntoChunks = (text, chunkSize = 500, overlap = 100) => {
    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = start + chunkSize;
        chunks.push(text.slice(start, end));
        start = end - overlap; // Add overlap to avoid breaking sentences
    }
    return chunks;
};
// Function to extract text from a single page
const extractTextFromPage = (url, visitedUrls) => __awaiter(void 0, void 0, void 0, function* () {
    if (visitedUrls.has(url))
        return; // Skip if already visited
    visitedUrls.add(url); // Mark URL as visited
    const browser = yield puppeteer_1.default.launch({});
    const page = yield browser.newPage();
    try {
        // console.log(`Processing: ${url}`);
        yield page.goto(url, { waitUntil: 'networkidle2' }); // Wait for page to load
        yield page.setViewport({ width: 1080, height: 1024 });
        // Extract text with proper spacing and formatting
        const text = yield page.evaluate(() => {
            const extractText = (element) => {
                let result = '';
                // Handle menu items (e.g., <nav>, <ul>, <li>, <a>)
                if (element.tagName === 'NAV' || element.tagName === 'UL' || element.tagName === 'LI' || element.tagName === 'A') {
                    if (element.textContent && element.textContent.trim() !== '') {
                        result += element.textContent.trim() + ' '; // Add space after each menu item
                    }
                }
                // Handle headings and paragraphs (e.g., <h1>, <p>)
                else if (element.tagName === 'H1' || element.tagName === 'P') {
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
        // console.log(`Extracted Text from ${url}:\n`, cleanedText);
        // Split the text into chunks
        const chunks = splitTextIntoChunks(cleanedText);
        // console.log(`Split text into ${chunks.length} chunks`);
        // Generate embeddings for each chunk and store in Pinecone
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = yield embeddings.embedDocuments([chunk]);
            const index = pinecone.index('chatbot').namespace(url);
            // Store the embedding in Pinecone
            yield index.upsert([
                {
                    id: `${url}-chunk-${i}`, // Unique ID for each chunk
                    values: embedding[0], // Embedding vector
                    metadata: { text: chunk, url, chunkIndex: i }
                },
            ]); // for namespace
            console.log(`Stored chunk ${i} from ${url} in Pinecone`);
        }
        // Extract all links on the page
        const links = yield page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors.map((a) => a.href).filter((href) => href && !href.startsWith('javascript:'));
        });
        // Visit each linked page recursively (only if it belongs to the same domain)
        const domain = new url_1.URL(url).hostname;
        for (const link of links) {
            const linkDomain = new url_1.URL(link).hostname;
            if (linkDomain === domain) {
                yield extractTextFromPage(link, visitedUrls); // Pass the visitedUrls set
            }
            else {
                console.log(`Skipping external link: ${link}`);
            }
        }
        return { success: true, message: `Completed processing ${url}` };
    }
    catch (error) {
        console.error(`Error processing ${url}:`, error);
        return { success: false, error: `Something went wrong while processing ${url}. ${error}` };
    }
    finally {
        yield browser.close();
    }
});
// Process web scraping
const processWeb = () => __awaiter(void 0, void 0, void 0, function* () {
    const visitedUrls = new Set(); // Track visited URLs
    process.on('message', (url) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield extractTextFromPage(url, visitedUrls);
            process.send && process.send({
                success: true,
                message: "Completed processing."
            });
            process.exit();
        }
        catch (error) {
            process.send && process.send({
                success: false,
                error: `Something went wrong while processing ${url}. ${error}`,
            });
            process.exit();
        }
    }));
});
// Start the process
processWeb();
