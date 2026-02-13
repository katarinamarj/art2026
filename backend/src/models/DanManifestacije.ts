export type TipDana = "Slikarstvo" | "Fotografija";

export interface DanManifestacije {
    DanID: number;
    ManifestacijaID: number;
    TipDana: TipDana;
    Datum?: Date;
    MaxBrojPosetilaca: number;
    OsnovnaCena: number;
}
