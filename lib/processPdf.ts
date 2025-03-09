import path from "path";
import fs from 'fs'
import { extractTextFromPdf } from "./extractTextFromPdf"
import { splitTextAndStoreVector } from "./splitTextAndStoreVector"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { vectorEmbedding } from "./embedding";
import { Document } from "@langchain/core/documents";
import { Pinecone } from "@pinecone-database/pinecone";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { config } from "dotenv";

const uploadsPath = path.resolve(__dirname, "../uploads");
config()
interface File {
    fieldname: string,
    originalname: string,
    encoding: string,
    mimetype: string,
    destination: string,
    filename: string,
    path: string,
    size: number
}

const processPdf = async () => {
    process.on("message", async (file: File) => {
        const filePath = path.join(uploadsPath, file.filename)
        try {
            const fileBuffer = await fs.promises.readFile(filePath);
            const text = await extractTextFromPdf(fileBuffer)

            console.log("text : ", text)

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 300,
                chunkOverlap: 100,
            });

            const chunks = await splitter.splitText(text);
            // const documents = chunks.map(chunk => new Document({ pageContent: chunk }));
            // const maxChunks = 200;
            // const limitedDocuments = documents.slice(0, maxChunks);

            const embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });
            const vectors = await embeddings.embedDocuments(chunks);

            const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
            const index = pinecone.Index("chatbot");

            const upsertData = vectors.map((vector, index) => ({
                id: `chunk-${index}`, // Unique ID for the vector
                values: vector, // Embedding vector
                metadata: {
                    chunkId: `chunk-${index}`, // Unique ID for the chunk
                    text: chunks[index], // Actual text content of the chunk
                },
            }));

            await index.upsert(upsertData);

            process.send && process.send({
                success: true,
                message: "Completed processing pdf."
            })
            process.exit();

        } catch (error) {
            process.send && process.send({
                success: false,
                error: `Something went wrong while processing pdf. ${error}`

            })
            process.exit();
        }
    })
}

processPdf()