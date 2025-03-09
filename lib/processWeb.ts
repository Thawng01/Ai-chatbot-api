
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { config } from "dotenv";
import { extractTextFromWeb } from "./extractTextFromWeb";

config()


const processWeb = async () => {
    process.on("message", async (url: string) => {

        try {

            const docs = await extractTextFromWeb(url)

            const combinedText = docs.map(doc => doc.pageContent).join(" ");

            const splitter = new RecursiveCharacterTextSplitter({
                chunkSize: 300,
                chunkOverlap: 100,
            });

            const chunks = await splitter.splitText(combinedText);

            const embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });
            const vectors = await embeddings.embedDocuments(chunks);

            const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
            const index = pinecone.Index("chatbot");

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

processWeb()