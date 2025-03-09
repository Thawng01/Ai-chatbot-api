"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.model = void 0;
const mistralai_1 = require("@langchain/mistralai");
exports.model = new mistralai_1.ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0
});
