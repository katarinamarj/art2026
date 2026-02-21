export interface Manifestacija {
    ManifestacijaID: number;
    Naziv: string;
    Grad?: string;
    Lokacija?: string;
    DatumOd?: string | null;
    DatumDo?: string | null;
    DodatneInformacije?: string;
    RokRanePrijave?: string | null;
}
