import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getContacts,
  createContact,
  updateContact,
  deleteContact,
  importContacts,
} from "../controllers/contactController";

const router = Router();

router.use(requireAuth);

router.get("/", getContacts);
router.post("/", createContact);
router.post("/import", importContacts);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

export default router;
