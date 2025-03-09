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
const multer_1 = require("../lib/multer");
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const router = express_1.default.Router();
router.post('/upload', multer_1.multerUpload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const childProcessPath = path_1.default.resolve(__dirname, "../lib/processPdf.js");
    const childProcess = (0, child_process_1.fork)(childProcessPath);
    childProcess.send(req.file);
    const waitForChildProcess = new Promise((resolve, reject) => {
        childProcess.on("message", (message) => {
            resolve(message);
        });
        // Handle errors
        childProcess.on("error", (error) => {
            console.log("rejected: ", error);
            reject(error);
        });
        childProcess.on("exit", (code) => {
            reject(new Error("Child process exited prematurely"));
        });
    });
    waitForChildProcess.then((message) => {
        console.log("success: ", message);
        if (message.success) {
            res.json({ response: message.message });
        }
        else {
            res.status(400).json({ error: `Something went wrong. ${message.error}` });
        }
    }).catch(error => {
        res.status(500).json({ error: `Something went wrong. ${error}` });
    });
}));
exports.default = router;
