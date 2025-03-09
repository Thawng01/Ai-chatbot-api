import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const promptTemplate = `You are an AI assistant. Answer the user's question using the provided context. If the context does not contain relevant information, explicitly state: "Sorry, I don't have enough information. Please ask another question"`;
const finalTemplate = [promptTemplate, `\n\n`, `{context}`].join("");

export const prompt = ChatPromptTemplate.fromMessages([
    ["system", finalTemplate],
    new MessagesPlaceholder("chat_history"),
    ["human", "{input}"],
]);