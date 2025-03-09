import express from "express";
import fs from "fs";
import path from "path";

const app = express();
import { config } from "dotenv";
config()

import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { Document } from "@langchain/core/documents";

import { createRetrievalChain } from 'langchain/chains/retrieval'
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import PdfParse from "pdf-parse";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

const uploadsPath = path.resolve(__dirname, "./uploads");


const embeddings = new MistralAIEmbeddings(
    {
        model: "mistral-embed"
    }
);

const promptTemplate = `You are an AI assistant. Answer the user's question using the provided context. 
    If the context does not contain relevant information, explicitly state: "I don't have enough information."
`
const finalTemplate = [
    promptTemplate,
    `\n\n`,
    `{context}`,
].join("");
const callme = async () => {

    const model = new ChatMistralAI({
        model: "mistral-large-latest",
        temperature: 0
    });

    const prompt = ChatPromptTemplate.fromMessages([
        ['system', finalTemplate],
        new MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
    ]);

    try {
        const files = await fs.promises.readdir(uploadsPath);
        const filePath = path.join(uploadsPath, files[1]);

        const fileBuffer = await fs.promises.readFile(filePath)
        const pdfData = await PdfParse(fileBuffer)

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 300,
            chunkOverlap: 100,
        });

        const chunks = await splitter.splitText(pdfData.text);
        const documents = chunks.map(chunk => new Document({ pageContent: chunk }));
        const maxChunks = 100; // Adjust based on token limit
        const limitedDocuments = documents.slice(0, maxChunks);

        // VECTOR STORE

        const vector = new MemoryVectorStore(embeddings);
        await vector.addDocuments(limitedDocuments);

        const retriever = vector.asRetriever({
            k: 2
        })

        // const retrievalDocs = await retriever._getRelevantDocuments('What is React')
        const chain = await createStuffDocumentsChain({
            llm: model,
            prompt,
        })

        // const retrieverPrompt = ChatPromptTemplate.fromMessages([
        //     new MessagesPlaceholder("chat_history"),
        //     ["user", "{input}"],
        //     [
        //         "user",
        //         "Given the above conversation, generate a search query to look up in order to get information relevant to the conversation",
        //     ],
        // ]);

        // const historyAwareRetrieval = await createHistoryAwareRetriever({
        //     llm: model,
        //     retriever,
        //     rephrasePrompt: ""
        // })

        const retrievalChain = await createRetrievalChain({
            combineDocsChain: chain,
            retriever
        })

        const chatHistory = [

        ]

        const response = await retrievalChain.invoke({
            input: "Tell me my name",


        });

        console.log("Retrieval Chain Input:", response);
    } catch (error) {
        console.log("error : ", error)
    }
}

callme()

const port = process.env.PORT || 5000;
app.listen(() => console.log(`Listening to port ${port}`));
