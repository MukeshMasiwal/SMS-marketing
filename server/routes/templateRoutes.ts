import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../controllers/templateController";

const router = Router();

router.use(requireAuth);

router.get("/", getTemplates);
router.get("/:id", getTemplateById);
router.post("/", createTemplate);
router.put("/:id", updateTemplate);
router.patch("/:id", updateTemplate);
router.delete("/:id", deleteTemplate);

export default router;
