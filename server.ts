import express from "express";
import cors from 'cors'
import { config } from "dotenv";
import upload from './routes/upload'
import chat from './routes/chat'
import user from './routes/auth/register'
import uploadWeb from './routes/webRoute'

config();
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', user)
app.use("/", upload)
app.use("/", uploadWeb)
app.use('/', chat)


const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
