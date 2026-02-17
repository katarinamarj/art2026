import type { Izlozba } from "./izlozba.model";

export interface DanManifestacije {
    DanID: number;
    TipDana: string;
    Datum: string;
    MaxBrojPosetilaca: number;
    SlobodnaMesta: number;
    OsnovnaCena: number;
    izlozbe: Izlozba[];
}
