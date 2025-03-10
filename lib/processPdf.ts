import path from "path";
import fs from 'fs'
import { extractTextFromPdf } from "./extractTextFromPdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
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

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 300,
                chunkOverlap: 100,
            });

            const chunks = await splitter.splitText(text);

            const embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });
            const vectors = await embeddings.embedDocuments(chunks);

            const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
            const index = pinecone.Index("chatbot").namespace(file.filename)

            const upsertData = vectors.map((vector, index) => ({
                id: `chunk-${index}`,
                values: vector,
                metadata: {
                    chunkId: `chunk-${index}`,
                    text: chunks[index],
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