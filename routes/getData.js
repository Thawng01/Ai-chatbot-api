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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pinecone_1 = require("@pinecone-database/pinecone");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
// Initialize Pinecone
const pinecone = new pinecone_1.Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index('chatbot');
router.get('/namespaces', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const indexStats = yield index.describeIndexStats();
        const namespaces = indexStats.namespaces ? Object.keys(indexStats.namespaces) : [];
        res.status(200).json({ namespaces });
    }
    catch (error) {
        console.error('Error fetching namespaces:', error);
        res.status(500).json({ error: 'Failed to fetch namespaces' });
    }
}));
router.delete('/namespace/:namespace', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { namespace } = req.params;
    try {
        // Delete all vectors in the specified namespace
        yield index.namespace(namespace).deleteAll();
        res.status(200).json({ message: `Deleted all vectors in namespace: ${namespace}` });
    }
    catch (error) {
        console.error(`Error deleting namespace ${namespace}:`, error);
        res.status(500).json({ error: `Failed to delete namespace ${namespace}` });
    }
}));
exports.default = router;
