import { Request, Response } from "express";
import prijavaService from "../services/prijava.service.js";
import { KreirajPrijavuRequest } from "../types/prijava.types.js";

class PrijavaController {
  async kreirajPrijavu(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as Partial<KreirajPrijavuRequest>;

      if (!body) {
        res.status(400).json({ message: "Nedostaje body." });
        return;
      }

      const result = await prijavaService.kreirajPrijavu(body as KreirajPrijavuRequest);
      res.status(201).json(result);
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

export default new PrijavaController();
