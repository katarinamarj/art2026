import type { DanManifestacije } from "./danManifestacije.model";

export interface Manifestacija {
    Naziv: string;
    Grad: string;
    Lokacija: string;
    DatumOd: string;
    DatumDo: string;
    DodatneInformacije: string;
    dani: DanManifestacije[];
}
