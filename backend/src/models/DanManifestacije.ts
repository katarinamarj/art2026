export type TipDana = "Slikarstvo" | "Fotografija";

export interface DanManifestacije {
    DanID: number;
    ManifestacijaID: number;
    TipDana: TipDana;
    Datum?: string | null;
    MaxBrojPosetilaca: number;
    OsnovnaCena: number;
}
