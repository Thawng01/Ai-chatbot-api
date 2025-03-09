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
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const combine_documents_1 = require("langchain/chains/combine_documents");
const documents_1 = require("@langchain/core/documents");
const retrieval_1 = require("langchain/chains/retrieval");
const memory_1 = require("langchain/vectorstores/memory");
const mistralai_1 = require("@langchain/mistralai");
const textsplitters_1 = require("@langchain/textsplitters");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const prompts_1 = require("@langchain/core/prompts");
const uploadsPath = path_1.default.resolve(__dirname, "./uploads");
const embeddings = new mistralai_1.MistralAIEmbeddings({
    model: "mistral-embed"
});
const promptTemplate = `You are an AI assistant. Answer the user's question using the provided context. 
    If the context does not contain relevant information, explicitly state: "I don't have enough information."
`;
const finalTemplate = [
    promptTemplate,
    `\n\n`,
    `{context}`,
].join("");
const callme = () => __awaiter(void 0, void 0, void 0, function* () {
    const model = new mistralai_1.ChatMistralAI({
        model: "mistral-large-latest",
        temperature: 0
    });
    const prompt = prompts_1.ChatPromptTemplate.fromMessages([
        ['system', finalTemplate],
        new prompts_1.MessagesPlaceholder("chat_history"),
        ["human", "{input}"],
    ]);
    try {
        const files = yield fs_1.default.promises.readdir(uploadsPath);
        const filePath = path_1.default.join(uploadsPath, files[1]);
        const fileBuffer = yield fs_1.default.promises.readFile(filePath);
        const pdfData = yield (0, pdf_parse_1.default)(fileBuffer);
        const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
            chunkSize: 300,
            chunkOverlap: 100,
        });
        const chunks = yield splitter.splitText(pdfData.text);
        const documents = chunks.map(chunk => new documents_1.Document({ pageContent: chunk }));
        const maxChunks = 100; // Adjust based on token limit
        const limitedDocuments = documents.slice(0, maxChunks);
        // VECTOR STORE
        const vector = new memory_1.MemoryVectorStore(embeddings);
        yield vector.addDocuments(limitedDocuments);
        const retriever = vector.asRetriever({
            k: 2
        });
        // const retrievalDocs = await retriever._getRelevantDocuments('What is React')
        const chain = yield (0, combine_documents_1.createStuffDocumentsChain)({
            llm: model,
            prompt,
        });
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
        const retrievalChain = yield (0, retrieval_1.createRetrievalChain)({
            combineDocsChain: chain,
            retriever
        });
        const chatHistory = [];
        const response = yield retrievalChain.invoke({
            input: "Tell me my name",
        });
        console.log("Retrieval Chain Input:", response);
    }
    catch (error) {
        console.log("error : ", error);
    }
});
callme();
const port = process.env.PORT || 5000;
app.listen(() => console.log(`Listening to port ${port}`));
