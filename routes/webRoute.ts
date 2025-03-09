import express from 'express'
import { fork } from 'child_process'
import path from 'path'
import { startCrawl } from '../lib/extractTextFromWeb'

const router = express.Router()

router.post("/web", async (req: any, res: any) => {
    const url = req.body.url

    await startCrawl(url)

    res.json()
    // const childProcessPath = path.resolve(__dirname, "../lib/processWeb.js")
    // const childProcess = fork(childProcessPath)

    // childProcess.send(url);

    // const waitForChildProcess = new Promise((resolve, reject) => {
    //     childProcess.on("message", (message) => {
    //         resolve(message);
    //     });
    //     // Handle errors
    //     childProcess.on("error", (error) => {
    //         console.log("rejected: ", error)
    //         reject(error);
    //     });

    //     childProcess.on("exit", (code) => {

    //         reject(new Error("Child process exited prematurely"));
    //     });
    // });

    // waitForChildProcess.then((message: any) => {
    //     console.log("success: ", message)
    //     if (message.success) {
    //         res.json({ response: message.message });
    //     } else {
    //         res.status(400).json({ error: `Something went wrong. ${message.error}` });
    //     }
    // }).catch(error => {
    //     res.status(500).json({ error: `Something went wrong. ${error}` });
    // })
})

export default router