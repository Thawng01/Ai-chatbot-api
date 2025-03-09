import { MistralAIEmbeddings } from "@langchain/mistralai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";

export const vectorEmbedding = async () => {
    const embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });
    const vector = new MemoryVectorStore(embeddings);

    return vector
}