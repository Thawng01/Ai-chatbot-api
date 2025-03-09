import { Document } from "@langchain/core/documents";
import { MistralAIEmbeddings } from "@langchain/mistralai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export async function vectorStore() {
    const embeddings = new MistralAIEmbeddings(
        {
            model: "mistral-embed"
        }
    );

    const vectorStore = new MemoryVectorStore(embeddings);
    return vectorStore;
}