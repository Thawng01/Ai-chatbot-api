import { Pinecone } from '@pinecone-database/pinecone';
import express from 'express'
const router = express.Router()
// Initialize Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const index = pinecone.index('chatbot')

router.get('/namespaces', async (req, res) => {
    try {
        const indexStats = await index.describeIndexStats();
        const namespaces = indexStats.namespaces ? Object.keys(indexStats.namespaces) : [];
        res.status(200).json({ namespaces });
    } catch (error) {
        console.error('Error fetching namespaces:', error);
        res.status(500).json({ error: 'Failed to fetch namespaces' });
    }
});

router.delete('/namespace/:namespace', async (req: any, res: any) => {
    const { namespace } = req.params;

    try {

        // Delete all vectors in the specified namespace
        await index.namespace(namespace).deleteAll()
        res.status(200).json({ message: `Deleted all vectors in namespace: ${namespace}` });
    } catch (error) {
        console.error(`Error deleting namespace ${namespace}:`, error);
        res.status(500).json({ error: `Failed to delete namespace ${namespace}` });
    }
});

export default router