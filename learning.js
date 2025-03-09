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
const dotenv_1 = require("dotenv");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("cheerio");
const cheerio_1 = require("@langchain/community/document_loaders/web/cheerio");
const documents_1 = require("@langchain/core/documents");
const hub_1 = require("langchain/hub");
const langgraph_1 = require("@langchain/langgraph");
const textsplitters_1 = require("@langchain/textsplitters");
const mistralai_1 = require("@langchain/mistralai");
const memory_1 = require("langchain/vectorstores/memory");
const pdf_parse_1 = __importDefault(require("pdf-parse"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const llm = new mistralai_1.ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0,
    streaming: true,
});
// Load and chunk contents of blog
const pTagSelector = "p";
const cheerioLoader = new cheerio_1.CheerioWebBaseLoader("https://aridient.com/", {
    selector: pTagSelector,
});
const uploadsPath = path_1.default.resolve(__dirname, "./uploads");
const answerQuestion = (input) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = yield fs_1.default.promises.readdir(uploadsPath);
        const filePath = path_1.default.join(uploadsPath, files[0]);
        const fileBuffer = yield fs_1.default.promises.readFile(filePath);
        const pdfData = yield (0, pdf_parse_1.default)(fileBuffer);
        const splitter = new textsplitters_1.RecursiveCharacterTextSplitter({
            chunkSize: 300,
            chunkOverlap: 100,
        });
        const chunks = yield splitter.splitText(pdfData.text);
        const documents = chunks.map((chunk) => new documents_1.Document({ pageContent: chunk }));
        const maxChunks = 100;
        const limitedDocuments = documents.slice(0, maxChunks);
        // Index chunks
        const embeddings = new mistralai_1.MistralAIEmbeddings({ model: "mistral-embed" });
        const vectorStore = new memory_1.MemoryVectorStore(embeddings);
        yield vectorStore.addDocuments(limitedDocuments);
        // Define prompt for question-answering
        const promptTemplate = yield (0, hub_1.pull)("rlm/rag-prompt");
        // Define state for application
        const InputStateAnnotation = langgraph_1.Annotation.Root({
            question: (langgraph_1.Annotation),
        });
        const StateAnnotation = langgraph_1.Annotation.Root({
            question: (langgraph_1.Annotation),
            context: (langgraph_1.Annotation),
            answer: (langgraph_1.Annotation),
        });
        // Define application steps
        const retrieve = (state) => __awaiter(void 0, void 0, void 0, function* () {
            const retrievedDocs = yield vectorStore.similaritySearch(state.question);
            return { context: retrievedDocs };
        });
        const generate = (state) => __awaiter(void 0, void 0, void 0, function* () {
            const docsContent = state.context
                .map((doc) => doc.pageContent)
                .join("\n");
            const botIntroduction = "You are an assistant for answering users' questions. Your name is Aridient Assistant. Always say 'thanks for asking' at the end of the answer";
            const fullContext = `${botIntroduction}\n\n${docsContent}`;
            // Ensure `question` is explicitly passed to the template
            const formattedPrompt = yield promptTemplate.invoke({
                question: state.question,
                context: fullContext,
            });
            const response = yield llm.invoke(formattedPrompt);
            return { answer: response.content };
        });
        // Compile application and test
        const graph = new langgraph_1.StateGraph(StateAnnotation)
            .addNode("retrieve", retrieve)
            .addNode("generate", generate)
            .addEdge("__start__", "retrieve")
            .addEdge("retrieve", "generate")
            .addEdge("generate", "__end__")
            .compile();
        return graph;
    }
    catch (error) {
        console.log("error log: ", error);
    }
});
app.get("/stream", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    var _d;
    const input = req.query.input;
    console.log("input : ", input);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    const graph = yield answerQuestion(input);
    try {
        for (var _e = true, _f = __asyncValues(yield (graph === null || graph === void 0 ? void 0 : graph.stream({ question: input }))), _g; _g = yield _f.next(), _a = _g.done, !_a; _e = true) {
            _c = _g.value;
            _e = false;
            const chunk = _c;
            console.log("chunk : ", chunk);
            if ((_d = chunk === null || chunk === void 0 ? void 0 : chunk.generate) === null || _d === void 0 ? void 0 : _d.answer) {
                res.write(`data: ${JSON.stringify(chunk.generate)}\n\n`);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (!_e && !_a && (_b = _f.return)) yield _b.call(_f);
        }
        finally { if (e_1) throw e_1.error; }
    }
}));
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
