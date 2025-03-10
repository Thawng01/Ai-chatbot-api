// import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
// // Function to extract text from a single page
// export const extractTextFromWeb = async (url: string) => {
//     const pTagSelector = "body";
//     const cheerioLoader = new CheerioWebBaseLoader(url, {
//         selector: pTagSelector,
//     });

//     const docs = await cheerioLoader.load();
//     return docs;
// };

import puppeteer from "puppeteer";

const initialUrl = 'https://aridient.com/';
export async function webScraper() {
    try {
        const browser = await puppeteer.launch({});
        const page = await browser.newPage();
        const visitedUrls = new Set(); // Track visited URLs to avoid duplicates

        // Get the domain of the initial URL
        const targetDomain = getDomain(initialUrl);

        if (!targetDomain) {
            console.error('Invalid initial URL');
            await browser.close();
            return;
        }

        // Function to extract text from a single page
        const extractTextFromPage = async (url: string) => {
            if (visitedUrls.has(url)) return; // Skip if already visited
            visitedUrls.add(url); // Mark URL as visited

            console.log(`Processing: ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2' });
            await page.setViewport({ width: 1080, height: 1024 });

            const text = await page.evaluate(() => {
                const extractText = (element: any) => {
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
            const links = await page.evaluate(() => {
                const anchors = Array.from(document.querySelectorAll('a'));
                return anchors.map((a) => a.href).filter((href) => href && !href.startsWith('javascript:'));
            });

            // Visit each linked page recursively (only if it belongs to the same domain)
            for (const link of links) {
                const linkDomain = getDomain(link);
                if (linkDomain === targetDomain) {
                    await extractTextFromPage(link);
                } else {
                    console.log(`Skipping external link: ${link}`);
                }
            }
        };

        // Start crawling from the initial URL
        await extractTextFromPage(initialUrl);
        await browser.close();
    } catch (error) {
        console.log("Error:", error);
    }
}

const getDomain = (url: string) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.hostname; // Extract the hostname (e.g., "aridient.com")
    } catch (error) {
        console.error(`Invalid URL: ${url}`);
        return null;
    }
};
