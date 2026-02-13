import { Request, Response } from 'express';
import manifestacijaService from '../services/manifestacija.service.js';

class ManifestacijaController {

    async getManifestacija(req: Request, res: Response): Promise<void> {
        try {
            const id = Number(req.params.id);

            if (isNaN(id)) {
                res.status(400).json({ message: 'Neispravan ID.' });
                return;
            }

            const data = await manifestacijaService.getManifestacija(id);

            if (!data) {
                res.status(404).json({ message: 'Manifestacija nije pronađena.' });
                return;
            }

            res.json(data);

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Greška na serveru.' });
        }
    }
}

export default new ManifestacijaController();
