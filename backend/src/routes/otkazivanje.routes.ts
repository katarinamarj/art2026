import { Router } from "express";
import otkazivanjeController from "../controllers/otkazivanje.controller.js";

const router = Router();

router.post("/", otkazivanjeController.otkaziPrijavu);

export default router;