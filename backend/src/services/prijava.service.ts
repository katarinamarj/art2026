import crypto from "crypto";
import db from "../db/connection.js";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import {
  KreirajPrijavuRequest,
  KreirajPrijavuResponse,
} from "../types/prijava.types.js";
import type { DanManifestacije } from "../models/DanManifestacije.js";
import type { PromoKod } from "../models/PromoKod.js";

type DanRow = RowDataPacket & DanManifestacije;
type PromoRow = RowDataPacket & Pick<PromoKod, "KodID" | "Status">;
type SumRow = RowDataPacket & { zauzeto: number };

type ManifestacijaRanaPrijavaRow = RowDataPacket & {
  RokRanePrijave: string | null;
  popustRanePrijaveAktivan: 0 | 1;
};

class PrijavaService {
  private httpError(status: number, message: string) {
    const e: any = new Error(message);
    e.status = status;
    return e;
  }

  private normalizujPromoKod(code?: string) {
    const c = (code ?? "").trim();
    return c.length ? c : undefined;
  }

  private generisiToken(): string {
    return crypto.randomBytes(24).toString("hex");
  }

  private generisiPromoKod(): string {
    const part = crypto.randomBytes(2).toString("hex").toUpperCase();
    return `MANIFESTACIJA-${part}`;
  }

  private izracunajGrupniPopust(brojOsoba: number): number {
    if (brojOsoba <= 1) return 0;
    return brojOsoba;
  }

  private zaokruziNaDveDecimale(n: number): number {
    return Math.round(n * 100) / 100;
  }

  async kreirajPrijavu(payload: KreirajPrijavuRequest): Promise<KreirajPrijavuResponse> {

    const required = [
      ["ime", payload.ime],
      ["prezime", payload.prezime],
      ["adresa1", payload.adresa1],
      ["postanskiBroj", payload.postanskiBroj],
      ["mesto", payload.mesto],
      ["drzava", payload.drzava],
      ["email", payload.email],
      ["potvrdaEmail", payload.potvrdaEmail],
    ] as const;

    for (const [k, v] of required) {
      if (!v || !String(v).trim()) throw this.httpError(400, `Polje ${k} je obavezno.`);
    }

    const emailNorm = payload.email.trim().toLowerCase();
    const emailPotvrdaNorm = payload.potvrdaEmail.trim().toLowerCase();

    if (emailNorm !== emailPotvrdaNorm) {
      throw this.httpError(400, "Email i potvrda email-a se ne poklapaju.");
    }

    if (!Array.isArray(payload.dani) || payload.dani.length === 0) {
      throw this.httpError(400, "Moraš izabrati najmanje jedan dan (Slikarstvo/Fotografija).");
    }

    const daniUnique = Array.from(new Set(payload.dani));
    if (daniUnique.length !== payload.dani.length) {
      throw this.httpError(400, "Ne možeš izabrati isti dan više puta.");
    }
    if (daniUnique.length > 2) {
      throw this.httpError(400, "Možeš izabrati najviše 2 dana.");
    }

    let brojOsoba;

    if (payload.brojOsoba && payload.brojOsoba > 0) {
      brojOsoba = Math.floor(payload.brojOsoba);
    } else {
      brojOsoba = 1;
    }

    const promoKodUnos = this.normalizujPromoKod(payload.promoKod);

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [mRows] = await conn.query<ManifestacijaRanaPrijavaRow[]>(
        `
        SELECT
          RokRanePrijave,
          CASE
            WHEN RokRanePrijave IS NOT NULL AND CURDATE() <= RokRanePrijave THEN 1
            ELSE 0
          END AS popustRanePrijaveAktivan
        FROM Manifestacija
        WHERE ManifestacijaID = ?
        `,
        [payload.manifestacijaId]
      );

      if (mRows.length === 0) throw this.httpError(404, "Manifestacija nije pronađena.");

      const popustRanePrijaveAktivan = mRows[0].popustRanePrijaveAktivan === 1;

      const [danRows] = await conn.query<DanRow[]>(
        `
        SELECT DanID, ManifestacijaID, TipDana, Datum, MaxBrojPosetilaca, OsnovnaCena
        FROM DanManifestacije
        WHERE ManifestacijaID = ? AND TipDana IN (${daniUnique.map(() => "?").join(",")})
        `,
        [payload.manifestacijaId, ...daniUnique]
      );

      if (danRows.length !== daniUnique.length) {
        throw this.httpError(400, "Jedan ili više izabranih dana ne postoji za ovu manifestaciju.");
      }

      for (const dan of danRows) {
        const [sumRows] = await conn.query<SumRow[]>(
          `
          SELECT COALESCE(SUM(BrojZauzetihMesta), 0) AS zauzeto
          FROM RezervacijaDana
          WHERE DanID = ? AND ManifestacijaID = ? AND StatusRezervacije = 'POTVRDJENO'
          `,
          [dan.DanID, dan.ManifestacijaID]
        );

        const zauzeto = sumRows[0]?.zauzeto ?? 0;
        const slobodno = dan.MaxBrojPosetilaca - zauzeto;

        if (brojOsoba > slobodno) {
          throw this.httpError(
            409,
            `Nema dovoljno slobodnih mesta za dan ${dan.TipDana}.`
          );
        }
      }

      let promoPopust = 0;
      let promoKodIdZaAzuriranje: number | null = null;

      if (promoKodUnos) {
        const [pRows] = await conn.query<PromoRow[]>(
          `SELECT KodID, Status FROM PromoKod WHERE VrednostKoda = ? FOR UPDATE`,
          [promoKodUnos]
        );

        if (pRows.length === 0) throw this.httpError(400, "Promo kod ne postoji.");
        if (pRows[0].Status !== "NEISKORISCEN") {
          throw this.httpError(400, "Promo kod nije važeći (već iskorišćen ili nevažeći).");
        }

        promoPopust = 5;
        promoKodIdZaAzuriranje = pRows[0].KodID;
      }

      const [postojeciPosetioci] = await conn.query<RowDataPacket[]>(
        `SELECT PosetilacID FROM Posetilac WHERE Email = ?`,
        [emailNorm]
      );

      if (postojeciPosetioci.length > 0) {
        throw this.httpError(409, "Korisnik sa tom email adresom već postoji.");
      }

      const [insPos] = await conn.query<ResultSetHeader>(
        `
        INSERT INTO Posetilac (Ime, Prezime, Profesija, Adresa1, Adresa2, PostanskiBroj, Mesto, Drzava, Email)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          payload.ime.trim(),
          payload.prezime.trim(),
          payload.profesija?.trim() ?? null,
          payload.adresa1.trim(),
          payload.adresa2?.trim() ?? null,
          payload.postanskiBroj.trim(),
          payload.mesto.trim(),
          payload.drzava.trim(),
          emailNorm,
        ]
      );

      const posetilacId = insPos.insertId;

      const paketPopust = danRows.length === 2 ? 10 : 0;
      const grupaPopust = this.izracunajGrupniPopust(brojOsoba);

      const izracunateRezervacije = danRows.map((dan) => {
        const osnovna = Number(dan.OsnovnaCena);
        const popustRane = popustRanePrijaveAktivan ? 10 : 0;
        const cenaPosleRane = this.zaokruziNaDveDecimale(osnovna * (1 - popustRane / 100));

        return {
          danId: dan.DanID,
          tipDana: dan.TipDana,
          datum: dan.Datum ?? null,
          osnovnaCena: osnovna,
          popustRanePrijave: popustRane,
          cenaUTrenutkuPrijave: cenaPosleRane,
        };
      });

      const ukupnoPrePopusta = this.zaokruziNaDveDecimale(
        izracunateRezervacije.reduce((acc, r) => acc + r.cenaUTrenutkuPrijave * brojOsoba, 0)
      );

      let ukupno = ukupnoPrePopusta;
      ukupno = this.zaokruziNaDveDecimale(ukupno * (1 - paketPopust / 100));
      ukupno = this.zaokruziNaDveDecimale(ukupno * (1 - grupaPopust / 100));
      ukupno = this.zaokruziNaDveDecimale(ukupno * (1 - promoPopust / 100));

      const token = this.generisiToken();

      const [insPrijava] = await conn.query<ResultSetHeader>(
        `
        INSERT INTO Prijava
          (PosetilacID, Token, StatusTokena, BrojOsoba, PopustNaPaket, PopustNaGrupu, PopustPromoKod, UkupnoDugovanje)
        VALUES
          (?, ?, 'AKTIVAN', ?, ?, ?, ?, ?)
        `,
        [posetilacId, token, brojOsoba, paketPopust, grupaPopust, promoPopust, ukupno]
      );

      const prijavaId = insPrijava.insertId;

      if (promoKodIdZaAzuriranje) {
        await conn.query(
          `
          UPDATE PromoKod
          SET Status = 'ISKORISCEN', IskoricenPrijavaID = ?
          WHERE KodID = ?
          `,
          [prijavaId, promoKodIdZaAzuriranje]
        );
      }

      for (const r of izracunateRezervacije) {
        await conn.query<ResultSetHeader>(
          `
          INSERT INTO RezervacijaDana
            (DanID, ManifestacijaID, PrijavaID, BrojZauzetihMesta, PopustRanePrijave, StatusRezervacije, CenaUTrenutkuPrijave)
          VALUES
            (?, ?, ?, ?, ?, 'POTVRDJENO', ?)
          `,
          [
            r.danId,
            payload.manifestacijaId,
            prijavaId,
            brojOsoba,
            r.popustRanePrijave,
            r.cenaUTrenutkuPrijave,
          ]
        );
      }

      const newPromo = this.generisiPromoKod();

      await conn.query<ResultSetHeader>(
        `
        INSERT INTO PromoKod (VrednostKoda, Status, GenerisanPrijavaID, IskoricenPrijavaID)
        VALUES (?, 'NEISKORISCEN', ?, NULL)
        `,
        [newPromo, prijavaId]
      );

      await conn.commit();

      return {
        prijavaId,
        token,
        generisaniPromoKod: newPromo,
        ukupnoDugovanje: ukupno,
        popustNaPaket: paketPopust,
        popustNaGrupu: grupaPopust,
        popustPromoKod: promoPopust,
        rezervacije: izracunateRezervacije.map((r) => ({
          danId: r.danId,
          tipDana: r.tipDana,
          datum: r.datum,
          osnovnaCena: r.osnovnaCena,
          popustRanePrijave: r.popustRanePrijave,
          cenaUTrenutkuPrijave: r.cenaUTrenutkuPrijave,
          brojZauzetihMesta: brojOsoba,
        })),
      };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  }
}

export default new PrijavaService();