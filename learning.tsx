import { config } from "dotenv";
import express from "express";
import cors from "cors";

import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatMistralAI, MistralAIEmbeddings } from "@langchain/mistralai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import PdfParse from "pdf-parse";
import fs from "fs";
import path from "path";

config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const llm = new ChatMistralAI({
    model: "mistral-large-latest",
    temperature: 0,
    streaming: true,
});

// Load and chunk contents of blog
const pTagSelector = "p";
const cheerioLoader = new CheerioWebBaseLoader("https://aridient.com/", {
    selector: pTagSelector,
});
const uploadsPath = path.resolve(__dirname, "./uploads");

const answerQuestion = async (input: string) => {
    try {
        const files = await fs.promises.readdir(uploadsPath);
        const filePath = path.join(uploadsPath, files[0]);

        const fileBuffer = await fs.promises.readFile(filePath);
        const pdfData = await PdfParse(fileBuffer);

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 300,
            chunkOverlap: 100,
        });

        const chunks = await splitter.splitText(pdfData.text);
        const documents = chunks.map(
            (chunk) => new Document({ pageContent: chunk })
        );
        const maxChunks = 100;
        const limitedDocuments = documents.slice(0, maxChunks);

        // Index chunks
        const embeddings = new MistralAIEmbeddings({ model: "mistral-embed" });
        const vectorStore = new MemoryVectorStore(embeddings);
        await vectorStore.addDocuments(limitedDocuments);

        // Define prompt for question-answering
        const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

        // Define state for application
        const InputStateAnnotation = Annotation.Root({
            question: Annotation<string>,
        });

        const StateAnnotation = Annotation.Root({
            question: Annotation<string>,
            context: Annotation<Document[]>,
            answer: Annotation<string>,
        });

        // Define application steps
        const retrieve = async (state: typeof InputStateAnnotation.State) => {
            const retrievedDocs = await vectorStore.similaritySearch(
                state.question
            );
            return { context: retrievedDocs };
        };

        const generate = async (state: typeof StateAnnotation.State) => {
            const docsContent = state.context
                .map((doc) => doc.pageContent)
                .join("\n");

            const botIntroduction =
                "You are an assistant for answering users' questions. Your name is Aridient Assistant. Always say 'thanks for asking' at the end of the answer";
            const fullContext = `${botIntroduction}\n\n${docsContent}`;

            // Ensure `question` is explicitly passed to the template
            const formattedPrompt = await promptTemplate.invoke({
                question: state.question,
                context: fullContext,
            });

            const response = await llm.invoke(formattedPrompt);
            return { answer: response.content };
        };

        // Compile application and test
        const graph = new StateGraph(StateAnnotation)
            .addNode("retrieve", retrieve)
            .addNode("generate", generate)
            .addEdge("__start__", "retrieve")
            .addEdge("retrieve", "generate")
            .addEdge("generate", "__end__")
            .compile();

        return graph;
    } catch (error) {
        console.log("error log: ", error);
    }
};

app.get("/stream", async (req, res) => {
    const input = req.query.input as string;

    console.log("input : ", input);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const graph = await answerQuestion(input);

    for await (const chunk of await graph?.stream({ question: input })!) {
        console.log("chunk : ", chunk);
        if (chunk?.generate?.answer) {
            res.write(`data: ${JSON.stringify(chunk.generate)}\n\n`);
        }
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
