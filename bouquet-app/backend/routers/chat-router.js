import express from 'express'
import { chatWithFlorist } from './controllers/chat-controller.js'

const router = express.Router();

router.post('/', chatWithFlorist);

export default router;
