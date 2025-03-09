"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_splitter_1 = require("langchain/text_splitter");
const pinecone_1 = require("@pinecone-database/pinecone");
const mistralai_1 = require("@langchain/mistralai");
const dotenv_1 = require("dotenv");
const extractTextFromWeb_1 = require("./extractTextFromWeb");
(0, dotenv_1.config)();
const processWeb = () => __awaiter(void 0, void 0, void 0, function* () {
    process.on("message", (url) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const docs = yield (0, extractTextFromWeb_1.extractTextFromWeb)(url);
            const combinedText = docs.map(doc => doc.pageContent).join(" ");
            const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
                chunkSize: 300,
                chunkOverlap: 100,
            });
            const chunks = yield splitter.splitText(combinedText);
            const embeddings = new mistralai_1.MistralAIEmbeddings({ model: "mistral-embed" });
            const vectors = yield embeddings.embedDocuments(chunks);
            const pinecone = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY });
            const index = pinecone.Index("chatbot");
            const upsertData = vectors.map((vector, index) => ({
                id: `chunk-${index}`,
                values: vector,
                metadata: {
                    chunkId: `chunk-${index}`,
                    text: chunks[index],
                },
            }));
            yield index.upsert(upsertData);
            process.send && process.send({
                success: true,
                message: "Completed processing pdf."
            });
            process.exit();
        }
        catch (error) {
            process.send && process.send({
                success: false,
                error: `Something went wrong while processing pdf. ${error}`
            });
            process.exit();
        }
    }));
});
processWeb();
