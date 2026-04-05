import { Request, Response } from "express";
import otkazivanjeService from "../services/otkazivanje.service.js";
import type { OtkaziPrijavuRequest } from "../types/otkazivanje.types.js";

class OtkazivanjeController {
  async otkaziPrijavu(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as Partial<OtkaziPrijavuRequest>;

      if (!body) {
        res.status(400).json({ message: "Nedostaje body." });
        return;
      }

      const result = await otkazivanjeService.otkaziPrijavu(body as OtkaziPrijavuRequest);
      res.status(200).json(result);
    } catch (err: any) {
      if (err?.status && err?.message) {
        res.status(err.status).json({ message: err.message });
        return;
      }

      console.error(err);
      res.status(500).json({ message: "Greška na serveru." });
    }
  }
}

export default new OtkazivanjeController();