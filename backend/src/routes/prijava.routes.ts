import { Router } from "express";
import prijavaController from "../controllers/prijava.controller.js";

const router = Router();

router.post("/", prijavaController.kreirajPrijavu);

export default router;
