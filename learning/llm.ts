
import { ChatMistralAI } from "@langchain/mistralai";

export const model = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0
});