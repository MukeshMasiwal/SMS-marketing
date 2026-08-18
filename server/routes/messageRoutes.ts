import { Router } from "express";
import { sendMessageBatch, getMessageLogs } from "../controllers/messageController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.post("/send", sendMessageBatch);
router.post("/send-message", sendMessageBatch); // Compatibility alias
router.get("/", getMessageLogs);

export default router;
