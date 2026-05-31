import { Router } from "express";
import izmenaController from "../controllers/izmena.controller.js";

const router = Router();

router.put("/", izmenaController.izmeniPrijavu);

export default router;