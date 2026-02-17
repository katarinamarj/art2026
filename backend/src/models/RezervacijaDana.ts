export type StatusRezervacije = "POTVRDJENO" | "OTKAZANO";

export interface RezervacijaDana {
    DanID: number;
    ManifestacijaID: number;
    PrijavaID: number;
    BrojZauzetihMesta: number;
    PopustRanePrijave: number;
    StatusRezervacije: StatusRezervacije;
    CenaUTrenutkuPrijave: number;
}
