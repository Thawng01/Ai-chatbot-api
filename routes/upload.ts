import express, { Router } from 'express'
import { multerUpload } from '../lib/multer';
import path from 'path';

import { fork } from 'child_process';

const router: Router = express.Router()
router.post('/upload', multerUpload.single('file'), async (req: any, res: any) => {

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const childProcessPath = path.resolve(__dirname, "../lib/processPdf.js")
    const childProcess = fork(childProcessPath)

    childProcess.send(req.file);

    const waitForChildProcess = new Promise((resolve, reject) => {
        childProcess.on("message", (message) => {
            resolve(message);
        });
        // Handle errors
        childProcess.on("error", (error) => {
            console.log("rejected: ", error)
            reject(error);
        });

        childProcess.on("exit", (code) => {

            reject(new Error("Child process exited prematurely"));
        });
    });

    waitForChildProcess.then((message: any) => {
        console.log("success: ", message)
        if (message.success) {
            res.json({ response: message.message });
        } else {
            res.status(400).json({ error: `Something went wrong. ${message.error}` });
        }
    }).catch(error => {
        res.status(500).json({ error: `Something went wrong. ${error}` });
    })
});


export default router 