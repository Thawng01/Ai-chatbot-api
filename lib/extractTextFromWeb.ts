import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

import { CheerioCrawler, Dataset } from 'crawlee';
// Function to extract text from a single page
export const extractTextFromWeb = async (url: string) => {
    const pTagSelector = "h1, h2, h4, h5, h6, p, span, li";
    const cheerioLoader = new CheerioWebBaseLoader(url, {
        selector: pTagSelector,
    });

    const docs = await cheerioLoader.load();
    return docs;
};



export const startCrawl = async (url: string) => {



    // CheerioCrawler crawls the web using HTTP requests
    // and parses HTML using the Cheerio library.
    const crawler = new CheerioCrawler({
        // Use the requestHandler to process each of the crawled pages.
        async requestHandler({ request, $, enqueueLinks, log }) {
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
            await Dataset.pushData({
                title,
                url: request.loadedUrl,
                text: pageText,
            });

            // Extract links from the current page and add them to the crawling queue.
            await enqueueLinks();
        },

        // Let's limit our crawls to make our tests shorter and safer.
        maxRequestsPerCrawl: 50,
    });

    // Add first URL to the queue and start the crawl.
    await crawler.run([url]);
}