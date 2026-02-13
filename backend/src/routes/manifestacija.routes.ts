import { Router } from 'express';
import manifestacijaController from '../controllers/manifestacija.controller.js';

const router = Router();

router.get('/:id', manifestacijaController.getManifestacija);

export default router;
