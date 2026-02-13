export type StatusTokena = "AKTIVAN" | "PASIVAN";

export interface Prijava {
    PrijavaID: number;
    PosetilacID: number;
    DatumPrijave?: Date;
    Token: string;
    StatusTokena: StatusTokena;
    BrojOsoba: number;
    PopustNaPaket: number;
    PopustNaGrupu: number;
    PopustPromoKod: number;
    UkupnoDugovanje: number;
}
