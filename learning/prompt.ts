import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { model } from './llm'

export const prompt = ChatPromptTemplate.fromTemplate(`
    You are an AI assistant answering user questions based ONLY on the provided context. 
    Do not use any external knowledge. If the context does not contain relevant information, say: "I don't have enough information."

    Context:
    {context}

    Question: {input}

    Answer in a clear and detailed manner.
`);


export const chain = prompt.pipe(model)
