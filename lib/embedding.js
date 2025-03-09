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
exports.vectorEmbedding = void 0;
const mistralai_1 = require("@langchain/mistralai");
const memory_1 = require("langchain/vectorstores/memory");
const vectorEmbedding = () => __awaiter(void 0, void 0, void 0, function* () {
    const embeddings = new mistralai_1.MistralAIEmbeddings({ model: "mistral-embed" });
    const vector = new memory_1.MemoryVectorStore(embeddings);
    return vector;
});
exports.vectorEmbedding = vectorEmbedding;
