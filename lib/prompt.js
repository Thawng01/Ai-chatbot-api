"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prompt = void 0;
const prompts_1 = require("@langchain/core/prompts");
const promptTemplate = `You are an AI assistant. Answer the user's question using the provided context. If the context does not contain relevant information, explicitly state: "Sorry, I don't have enough information. Please ask another question"`;
const finalTemplate = [promptTemplate, `\n\n`, `{context}`].join("");
exports.prompt = prompts_1.ChatPromptTemplate.fromMessages([
    ["system", finalTemplate],
    new prompts_1.MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
]);
