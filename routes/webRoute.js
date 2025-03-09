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
const express_1 = __importDefault(require("express"));
const extractTextFromWeb_1 = require("../lib/extractTextFromWeb");
const router = express_1.default.Router();
router.post("/web", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const url = req.body.url;
    yield (0, extractTextFromWeb_1.startCrawl)(url);
    res.json();
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
}));
exports.default = router;
