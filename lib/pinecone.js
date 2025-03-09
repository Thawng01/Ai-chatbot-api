"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pinecone_1 = require("@pinecone-database/pinecone");
const pc = new pinecone_1.Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});
