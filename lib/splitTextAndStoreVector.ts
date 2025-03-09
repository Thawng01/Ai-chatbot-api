import { Document } from '@langchain/core/documents';
import {
    RecursiveCharacterTextSplitter

} from 'langchain/text_splitter'
import { vectorEmbedding } from './embedding';

export const splitTextAndStoreVector = async (text: string) => {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 300,
        chunkOverlap: 100,
    });

    const chunks = await splitter.splitText(text);
    const documents = chunks.map(chunk => new Document({ pageContent: chunk }));
    const maxChunks = 200;
    const limitedDocuments = documents.slice(0, maxChunks);
    const vector = await vectorEmbedding()
    await vector.addDocuments(limitedDocuments);
}