
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { Pinecone } from "@pinecone-database/pinecone";
import puppeteer from "puppeteer";
import { URL } from "url";

// Initialize Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

const embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });
// Function to split text into chunks
const splitTextIntoChunks = (text: string, chunkSize = 500, overlap = 100) => {
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
const extractTextFromPage = async (url: string, visitedUrls: any) => {
    if (visitedUrls.has(url)) return; // Skip if already visited
    visitedUrls.add(url); // Mark URL as visited

    const browser = await puppeteer.launch({});
    const page = await browser.newPage();

    try {
        // console.log(`Processing: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' }); // Wait for page to load
        await page.setViewport({ width: 1080, height: 1024 });

        // Extract text with proper spacing and formatting
        const text = await page.evaluate(() => {
            const extractText = (element: any) => {
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
            const embedding = await embeddings.embedDocuments([chunk]);

            const index = pinecone.index('chatbot').namespace(url)
            // Store the embedding in Pinecone
            await index.upsert([
                {
                    id: `${url}-chunk-${i}`, // Unique ID for each chunk
                    values: embedding[0], // Embedding vector
                    metadata: { text: chunk, url, chunkIndex: i }
                },
            ]); // for namespace
            console.log(`Stored chunk ${i} from ${url} in Pinecone`);
        }

        // Extract all links on the page
        const links = await page.evaluate(() => {
            const anchors = Array.from(document.querySelectorAll('a'));
            return anchors.map((a) => a.href).filter((href) => href && !href.startsWith('javascript:'));
        });

        // Visit each linked page recursively (only if it belongs to the same domain)
        const domain = new URL(url).hostname;
        for (const link of links) {
            const linkDomain = new URL(link).hostname;
            if (linkDomain === domain) {
                await extractTextFromPage(link, visitedUrls); // Pass the visitedUrls set
            } else {
                console.log(`Skipping external link: ${link}`);
            }
        }

        return { success: true, message: `Completed processing ${url}` };
    } catch (error) {
        console.error(`Error processing ${url}:`, error);
        return { success: false, error: `Something went wrong while processing ${url}. ${error}` };
    } finally {
        await browser.close();
    }
};

// Process web scraping
const processWeb = async () => {
    const visitedUrls = new Set(); // Track visited URLs

    process.on('message', async (url: string) => {
        try {
            await extractTextFromPage(url, visitedUrls);
            process.send && process.send({
                success: true,
                message: "Completed processing."
            });
            process.exit();
        } catch (error) {
            process.send && process.send({
                success: false,
                error: `Something went wrong while processing ${url}. ${error}`,
            });
            process.exit();
        }
    });
};

// Start the process
processWeb();