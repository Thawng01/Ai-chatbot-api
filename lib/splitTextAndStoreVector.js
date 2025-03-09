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
exports.splitTextAndStoreVector = void 0;
const documents_1 = require("@langchain/core/documents");
const text_splitter_1 = require("langchain/text_splitter");
const embedding_1 = require("./embedding");
const splitTextAndStoreVector = (text) => __awaiter(void 0, void 0, void 0, function* () {
    const splitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 100,
    });
    const chunks = yield splitter.splitText(text);
    const documents = chunks.map(chunk => new documents_1.Document({ pageContent: chunk }));
    const maxChunks = 200;
    const limitedDocuments = documents.slice(0, maxChunks);
    const vector = yield (0, embedding_1.vectorEmbedding)();
    yield vector.addDocuments(limitedDocuments);
});
exports.splitTextAndStoreVector = splitTextAndStoreVector;
