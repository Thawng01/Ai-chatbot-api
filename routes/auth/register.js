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
const prisma_1 = require("../../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = express_1.default.Router();
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    try {
        const existingUser = yield prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { name },
                    { email },
                ],
            },
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma_1.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            isAdmin: newUser.isAdmin
        });
    }
    catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    try {
        const user = yield prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin
        });
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
exports.default = router;
