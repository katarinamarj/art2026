import { Request, Response } from "express";
import izmenaService from "../services/izmena.service.js";
import { IzmeniPrijavuRequest } from "../types/prijava.types.js";

class IzmenaController {

  async izmeniPrijavu(req: Request, res: Response): Promise<void> {

    try {
      const body =req.body as IzmeniPrijavuRequest;
      const result = await izmenaService.izmeniPrijavu(body);
      res.status(200).json(result);

    } catch (err: any) {

      if (err?.status && err?.message) {
        res.status(err.status).json({
          message: err.message,
        });
        return;
      }

      res.status(500).json({
        message: "Greska",
      });
    }
  }
}

export default new IzmenaController();