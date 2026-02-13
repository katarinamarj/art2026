export interface Manifestacija {
    ManifestacijaID: number;
    Naziv: string;
    Grad?: string;
    Lokacija?: string;
    DatumOd?: Date;
    DatumDo?: Date;
    DodatneInformacije?: string;
    RokRanePrijave?: Date;
}
