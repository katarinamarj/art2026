import db from "../db/connection.js";
import { RowDataPacket } from "mysql2/promise";
import { IzmeniPrijavuRequest, IzmeniPrijavuResponse } from "../types/prijava.types.js";
import type { DanManifestacije } from "../models/DanManifestacije.js";

type DanRow = RowDataPacket & DanManifestacije;
type SumRow = RowDataPacket & { zauzeto: number};

class IzmenaService {

  private httpError(status: number, message: string) {
    const e: any = new Error(message);
    e.status = status;
    return e;
  }

  private izracunajGrupniPopust(brojOsoba: number): number {
    if (brojOsoba <= 1) return 0;
    return brojOsoba;
  }

  private zaokruziNaDveDecimale(n: number): number {
    return Math.round(n * 100) / 100;
  }

  async izmeniPrijavu(payload: IzmeniPrijavuRequest): Promise<IzmeniPrijavuResponse> {

  const conn = await db.getConnection();

  try {

    await conn.beginTransaction();

    const [prijavaRows] = await conn.query<RowDataPacket[]>(
      `
      SELECT
        p.PrijavaID,
        p.BrojOsoba,
        p.PopustPromoKod,
        p.PosetilacID
      FROM Prijava p
      JOIN Posetilac pos
        ON pos.PosetilacID = p.PosetilacID
      WHERE pos.Email = ?
      AND p.Token = ?
      AND p.StatusTokena = 'AKTIVAN'
      FOR UPDATE
      `,
      [payload.email.trim().toLowerCase(), payload.token]
    );

    if (prijavaRows.length === 0) {
      throw this.httpError(404, "Prijava nije pronađena.");
    }

    const prijava = prijavaRows[0];
    const prijavaId = prijava.PrijavaID;

    const [stareRezervacije] = await conn.query<RowDataPacket[]>(
      `
      SELECT
        rd.DanID,
        rd.ManifestacijaID,
        dm.TipDana,
        dm.OsnovnaCena,
        rd.PopustRanePrijave
      FROM RezervacijaDana rd
      JOIN DanManifestacije dm
        ON dm.DanID = rd.DanID
       AND dm.ManifestacijaID = rd.ManifestacijaID
      WHERE rd.PrijavaID = ?
      `,
      [prijavaId]
    );

    if (stareRezervacije.length === 0) {
      throw this.httpError(404, "Rezervacije nisu pronadjene.");
    }

    const manifestacijaId = stareRezervacije[0].ManifestacijaID;

    const stariDani = stareRezervacije.map(x => x.TipDana);

    const noviDani = payload.dani.filter(
      d => !stariDani.includes(d)
    );

    const obrisaniDani = stariDani.filter(
      d => !payload.dani.includes(d)
    );

    const noviBrojOsoba =
      payload.brojOsoba > 0
        ? Math.floor(payload.brojOsoba)
        : 1;

    const [manifestacijaRows] = await conn.query<RowDataPacket[]>(
      `
      SELECT
        RokRanePrijave
      FROM Manifestacija
      WHERE ManifestacijaID = ?
      `,
      [manifestacijaId]
    );

    const rokRanePrijave = manifestacijaRows[0]?.RokRanePrijave;
    const ranaPrijavaAktivna = rokRanePrijave && new Date() <= new Date(rokRanePrijave);

    for (const tipDana of noviDani) {

      const [danRows] = await conn.query<DanRow[]>(
        `
        SELECT *
        FROM DanManifestacije
        WHERE ManifestacijaID = ?
        AND TipDana = ?
        `,
        [manifestacijaId, tipDana]
      );

      if (danRows.length === 0) {
        throw this.httpError(404, "Dan nije pronađen.");
      }

      const dan = danRows[0];

      const [sumRows] = await conn.query<SumRow[]>(
        `
        SELECT
          COALESCE(SUM(BrojZauzetihMesta),0) AS zauzeto
        FROM RezervacijaDana
        WHERE DanID = ?
        AND ManifestacijaID = ?
        AND StatusRezervacije='POTVRDJENO'
        `,
        [dan.DanID, manifestacijaId]
      );

      const zauzeto = sumRows[0].zauzeto;
      const slobodno = dan.MaxBrojPosetilaca - zauzeto;

      if (noviBrojOsoba > slobodno) {
        throw this.httpError(
          409,
          `Nema dovoljno mesta za ${tipDana}.`
        );
      }

      const popustRane = ranaPrijavaAktivna ? 10 : 0;
      const cena = Number(dan.OsnovnaCena) * (1 - popustRane / 100);

      await conn.query(
        `
        INSERT INTO RezervacijaDana
        (
          DanID,
          ManifestacijaID,
          PrijavaID,
          BrojZauzetihMesta,
          PopustRanePrijave,
          StatusRezervacije,
          CenaUTrenutkuPrijave
        )
        VALUES
        (?, ?, ?, ?, ?, 'POTVRDJENO', ?)
        `,
        [
          dan.DanID,
          manifestacijaId,
          prijavaId,
          noviBrojOsoba,
          popustRane,
          cena
        ]
      );
    }

    for (const tipDana of obrisaniDani) {

      const rezervacija = stareRezervacije.find(
        x => x.TipDana === tipDana
      );

      if (!rezervacija) continue;

      await conn.query(
        `
        DELETE FROM RezervacijaDana
        WHERE DanID = ?
        AND ManifestacijaID = ?
        AND PrijavaID = ?
        `,
        [
          rezervacija.DanID,
          manifestacijaId,
          prijavaId
        ]
      );
    }

    const [sveRezervacije] = await conn.query<RowDataPacket[]>(
      `
      SELECT
        rd.DanID,
        rd.ManifestacijaID,
        rd.CenaUTrenutkuPrijave
      FROM RezervacijaDana rd
      WHERE rd.PrijavaID = ?
      `,
      [prijavaId]
    );

    for (const rezervacija of sveRezervacije) {

      const [sumRows] = await conn.query<SumRow[]>(
        `
        SELECT
          COALESCE(SUM(BrojZauzetihMesta),0) AS zauzeto
        FROM RezervacijaDana
        WHERE DanID = ?
        AND ManifestacijaID = ?
        AND PrijavaID <> ?
        AND StatusRezervacije='POTVRDJENO'
        `,
        [
          rezervacija.DanID,
          rezervacija.ManifestacijaID,
          prijavaId
        ]
      );

      const [danRows] = await conn.query<DanRow[]>(
        `
        SELECT *
        FROM DanManifestacije
        WHERE DanID = ?
        AND ManifestacijaID = ?
        `,
        [
          rezervacija.DanID,
          rezervacija.ManifestacijaID
        ]
      );

      const dan = danRows[0];

      const slobodno = dan.MaxBrojPosetilaca - sumRows[0].zauzeto;

      if (noviBrojOsoba > slobodno) {
        throw this.httpError(
          409,
          `Nema dovoljno slobodnih mesta za ${dan.TipDana}.`
        );
      }

      await conn.query(
        `
        UPDATE RezervacijaDana
        SET BrojZauzetihMesta = ?
        WHERE DanID = ?
        AND ManifestacijaID = ?
        AND PrijavaID = ?
        `,
        [
          noviBrojOsoba,
          rezervacija.DanID,
          rezervacija.ManifestacijaID,
          prijavaId
        ]
      );
    }

    const brojDana = sveRezervacije.length;

    const paketPopust = brojDana === 2 ? 10 : 0;
    const grupniPopust = this.izracunajGrupniPopust(noviBrojOsoba);

    const promoPopust = Number(prijava.PopustPromoKod);

    const ukupnoPrePopusta =
      sveRezervacije.reduce(
        (sum, r) =>
          sum +
          Number(r.CenaUTrenutkuPrijave) *
          noviBrojOsoba,
        0
      );

    let ukupno = ukupnoPrePopusta;

    ukupno = ukupno * (1 - paketPopust / 100);
    ukupno = ukupno * (1 - grupniPopust / 100);
    ukupno = ukupno * (1 - promoPopust / 100);
    ukupno = this.zaokruziNaDveDecimale(ukupno );

    await conn.query(
      `
      UPDATE Prijava
      SET
        BrojOsoba = ?,
        PopustNaPaket = ?,
        PopustNaGrupu = ?,
        UkupnoDugovanje = ?
      WHERE PrijavaID = ?
      `,
      [
        noviBrojOsoba,
        paketPopust,
        grupniPopust,
        ukupno,
        prijavaId
      ]
    );

    await conn.commit();

    return {
      prijavaId,
      ukupnoDugovanje: ukupno,
      popustNaPaket: paketPopust,
      popustNaGrupu: grupniPopust,
      popustPromoKod: promoPopust
    };

  } catch (e) {

    await conn.rollback();
    throw e;

  } finally {

    conn.release();
  }
}
}

export default new IzmenaService();