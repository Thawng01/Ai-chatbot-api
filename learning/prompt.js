"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chain = exports.prompt = void 0;
const prompts_1 = require("@langchain/core/prompts");
const llm_1 = require("./llm");
exports.prompt = prompts_1.ChatPromptTemplate.fromTemplate(`
    You are an AI assistant answering user questions based ONLY on the provided context. 
    Do not use any external knowledge. If the context does not contain relevant information, say: "I don't have enough information."

    Context:
    {context}

    Question: {input}

    Answer in a clear and detailed manner.
`);
exports.chain = exports.prompt.pipe(llm_1.model);
