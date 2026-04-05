import db from "../db/connection.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import type { OtkaziPrijavuRequest, OtkaziPrijavuResponse} from "../types/otkazivanje.types.js";

type PrijavaRow = RowDataPacket & {
  PrijavaID: number;
  StatusTokena: "AKTIVAN" | "PASIVAN";
};

class OtkazivanjeService {
  private httpError(status: number, message: string) {
    const e: any = new Error(message);
    e.status = status;
    return e;
  }

  async otkaziPrijavu(payload: OtkaziPrijavuRequest): Promise<OtkaziPrijavuResponse> {
    const emailNorm = (payload.email ?? "").trim().toLowerCase();
    const tokenNorm = (payload.token ?? "").trim();

    if (!emailNorm) throw this.httpError(400, "Email je obavezan.");
    if (!tokenNorm) throw this.httpError(400, "Token je obavezan.");

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [rows] = await conn.query<PrijavaRow[]>(
        `
        SELECT p.PrijavaID, p.StatusTokena
        FROM Prijava p
        JOIN Posetilac po ON po.PosetilacID = p.PosetilacID
        WHERE po.Email = ? AND p.Token = ?
        FOR UPDATE
        `,
        [emailNorm, tokenNorm]
      );

      if (rows.length === 0) {
        throw this.httpError(404, "Prijava nije pronadjena.");
      }

      const prijavaId = rows[0].PrijavaID;

      if (rows[0].StatusTokena !== "AKTIVAN") {
        throw this.httpError(409, "Prijava je vec otkazana.");
      }

      // 2) Deaktiviraj token trajno
      await conn.query<ResultSetHeader>(
        `UPDATE Prijava SET StatusTokena = 'PASIVAN' WHERE PrijavaID = ?`,
        [prijavaId]
      );

      // 3) Otkazi rezervacije dana (mesta se oslobadjaju jer ti zauzece racunas samo za POTVRDJENO)
      //    Ako ti ENUM nema 'OTKAZANO', promeni ovu vrednost u onu koju imas.
      await conn.query<ResultSetHeader>(
        `
        UPDATE RezervacijaDana
        SET StatusRezervacije = 'OTKAZANO'
        WHERE PrijavaID = ? AND StatusRezervacije = 'POTVRDJENO'
        `,
        [prijavaId]
      );

      // 4) Promo kod otkazane prijave postaje nevazeci (kod koji je TA prijava generisala)
      //    Ako ti ENUM nema 'NEVAZECI', promeni vrednost.
      await conn.query<ResultSetHeader>(
        `
        UPDATE PromoKod
        SET Status = 'NEVAZECI'
        WHERE GenerisanPrijavaID = ? AND Status = 'NEISKORISCEN'
        `,
        [prijavaId]
      );

      await conn.commit();

      return {
        prijavaId,
        statusTokena: "PASIVAN",
        poruka: "Prijava je otkazana.",
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
}

export default new OtkazivanjeService();