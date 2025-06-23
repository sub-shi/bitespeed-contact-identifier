"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const contactService_1 = require("../services/contactService");
const router = express_1.default.Router();
router.post('/', async (req, res) => {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) {
        return res.status(400).json({ error: 'At least email or phoneNumber is required.' });
    }
    try {
        const contact = await (0, contactService_1.identifyContact)(email, phoneNumber);
        return res.status(200).json({ contact });
    }
    catch (err) {
        console.error('Identify error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
