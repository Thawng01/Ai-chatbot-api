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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const extractTextFromPdf_1 = require("./extractTextFromPdf");
const text_splitter_1 = require("langchain/text_splitter");
const pinecone_1 = require("@pinecone-database/pinecone");
const mistralai_1 = require("@langchain/mistralai");
const dotenv_1 = require("dotenv");
const uploadsPath = path_1.default.resolve(__dirname, "../uploads");
(0, dotenv_1.config)();
const processPdf = () => __awaiter(void 0, void 0, void 0, function* () {
    process.on("message", (file) => __awaiter(void 0, void 0, void 0, function* () {
        const filePath = path_1.default.join(uploadsPath, file.filename);
        try {
            const fileBuffer = yield fs_1.default.promises.readFile(filePath);
            const text = yield (0, extractTextFromPdf_1.extractTextFromPdf)(fileBuffer);
            const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
                chunkSize: 300,
                chunkOverlap: 100,
            });
            const chunks = yield splitter.splitText(text);
            const embeddings = new mistralai_1.MistralAIEmbeddings({ model: "mistral-embed" });
            const vectors = yield embeddings.embedDocuments(chunks);
            const pinecone = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY });
            const index = pinecone.Index("chatbot").namespace(file.filename);
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
processPdf();
