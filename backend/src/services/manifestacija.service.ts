import db from '../db/connection.js';
import { Manifestacija } from '../models/Manifestacija.js';
import { Izlozba } from '../models/Izlozba.js';
import { RowDataPacket } from 'mysql2';

class ManifestacijaService {

    async getManifestacija(manifestacijaId: number) {

       
        const [manifestacijaRows] = await db.execute<(Manifestacija & RowDataPacket)[]>(
            `SELECT *
             FROM Manifestacija
             WHERE ManifestacijaID = ?`,
            [manifestacijaId]
        );

        if (manifestacijaRows.length === 0) {
            return null;
        }

        const [daniRows] = await db.execute<any[]>(
            `SELECT 
                d.*,
                COALESCE(SUM(r.BrojZauzetihMesta), 0) AS TrenutnoZauzeto,
                d.MaxBrojPosetilaca - COALESCE(SUM(r.BrojZauzetihMesta), 0) AS SlobodnaMesta
            FROM DanManifestacije d
            LEFT JOIN RezervacijaDana r 
                ON d.DanID = r.DanID 
                AND d.ManifestacijaID = r.ManifestacijaID
                AND r.StatusRezervacije = 'POTVRDJENO'
            WHERE d.ManifestacijaID = ?
            GROUP BY d.DanID, d.ManifestacijaID`,
            [manifestacijaId]
        );

        const [izlozbeRows] = await db.execute<(Izlozba & RowDataPacket)[]>(
            `SELECT *
             FROM Izlozba
             WHERE ManifestacijaID = ?
             ORDER BY DanID, VremeOtvaranja`,
            [manifestacijaId]
        );

        const dani = daniRows.map((dan: any) => ({
            ...dan,
            izlozbe: izlozbeRows.filter(i => i.DanID === dan.DanID)
        }));

        return {
            ...manifestacijaRows[0],
            dani
        };
    }
}

export default new ManifestacijaService();
