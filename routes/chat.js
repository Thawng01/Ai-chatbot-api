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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const combine_documents_1 = require("langchain/chains/combine_documents");
const retrieval_1 = require("langchain/chains/retrieval");
const mistralai_1 = require("@langchain/mistralai");
const prompt_1 = require("../lib/prompt");
const dotenv_1 = require("dotenv");
const pinecone_1 = require("@pinecone-database/pinecone");
const pinecone_2 = require("@langchain/pinecone");
(0, dotenv_1.config)();
const model = new mistralai_1.ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0,
    streaming: true,
    apiKey: process.env.MISTRAL_API_KEY
});
const router = express_1.default.Router();
let pinecone, index, embeddings, vectorStore, retriever, chain, retrievalChain;
function initializeResources() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            pinecone = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY });
            index = pinecone.Index("chatbot");
            embeddings = new mistralai_1.MistralAIEmbeddings({ model: "mistral-embed" });
            vectorStore = yield pinecone_2.PineconeStore.fromExistingIndex(embeddings, {
                pineconeIndex: index,
            });
            // Initialize Retriever
            retriever = vectorStore.asRetriever({
                k: 2,
                searchType: "similarity",
            });
            chain = yield (0, combine_documents_1.createStuffDocumentsChain)({ llm: model, prompt: prompt_1.prompt });
            retrievalChain = yield (0, retrieval_1.createRetrievalChain)({
                combineDocsChain: chain,
                retriever,
            });
            console.log("Resources initialized successfully.");
        }
        catch (error) {
            console.error("Error initializing resources:", error);
            process.exit(1); // Exit if initialization fails
        }
    });
}
// Initialize resources when the server starts
initializeResources();
router.get("/stream", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const input = req.query.input;
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    try {
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
            for (var _d = true, _e = __asyncValues(yield retrievalChain.stream({ input })), _f; _f = yield _e.next(), _a = _f.done, !_a; _d = true) {
                _c = _f.value;
                _d = false;
                const chunk = _c;
                if (chunk === null || chunk === void 0 ? void 0 : chunk.answer) {
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = _e.return)) yield _b.call(_e);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
    catch (error) {
        console.log("Error: ", error);
        res.write("data: [ERROR]\n\n");
        res.end();
    }
}));
exports.default = router;
