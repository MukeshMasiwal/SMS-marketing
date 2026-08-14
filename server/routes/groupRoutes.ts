import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
} from "../controllers/groupController";

const router = Router();

router.use(requireAuth);

router.get("/", getGroups);
router.post("/", createGroup);
router.get("/:id", getGroupById);
router.put("/:id", updateGroup);
router.delete("/:id", deleteGroup);

export default router;
