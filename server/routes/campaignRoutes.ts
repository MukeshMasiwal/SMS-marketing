import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createCampaign,
  getCampaigns,
  getCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaignController";

const router = Router();

router.use(requireAuth);

router.post("/", createCampaign);
router.get("/", getCampaigns);
router.get("/:id", getCampaign);
router.put("/:id", updateCampaign);
router.delete("/:id", deleteCampaign);

export default router;
