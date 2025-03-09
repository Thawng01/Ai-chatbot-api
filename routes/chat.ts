import express from 'express'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents';
import { createRetrievalChain } from 'langchain/chains/retrieval';
import { ChatMistralAI, MistralAIEmbeddings } from '@langchain/mistralai';
import { prompt } from '../lib/prompt';

import { config } from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from "@langchain/pinecone";

config();

const model = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0,
    streaming: true,
    apiKey: process.env.MISTRAL_API_KEY
});

const router = express.Router()

let pinecone, index, embeddings, vectorStore, retriever, chain, retrievalChain: any;

async function initializeResources() {
    try {
        pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        index = pinecone.Index("chatbot");

        embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });

        vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index,
        });

        // Initialize Retriever
        retriever = vectorStore.asRetriever({
            k: 2,
            searchType: "similarity",
        });
        chain = await createStuffDocumentsChain({ llm: model, prompt });
        retrievalChain = await createRetrievalChain({
            combineDocsChain: chain,
            retriever,
        });

        console.log("Resources initialized successfully.");
    } catch (error) {
        console.error("Error initializing resources:", error);
        process.exit(1); // Exit if initialization fails
    }
}

// Initialize resources when the server starts
initializeResources();



router.get("/stream", async (req, res) => {

    const input = req.query.input as string

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive")

    try {
        // const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
        // const index = pinecone.Index("chatbot");
        // const embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });
        // const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        //     pineconeIndex: index,
        // });
        // const retriever = vectorStore.asRetriever({
        //     k: 2,
        //     searchType: "similarity",
        // });

        // const chain = await createStuffDocumentsChain({ llm: model, prompt });

        // const retrievalChain = await createRetrievalChain({
        //     combineDocsChain: chain,
        //     retriever,
        // });

        for await (const chunk of await retrievalChain.stream({ input })) {
            if (chunk?.answer) {

                res.write(`data: ${JSON.stringify(chunk)}\n\n`);
            }
        }

    } catch (error) {
        console.log("Error: ", error);
        res.write("data: [ERROR]\n\n");
        res.end();
    }
});

export default router