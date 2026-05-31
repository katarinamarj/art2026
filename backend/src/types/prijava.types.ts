export type TipDana = "Slikarstvo" | "Fotografija";

export interface KreirajPrijavuRequest {
  manifestacijaId: number;
  ime: string;
  prezime: string;
  profesija: string;
  adresa1: string;
  adresa2?: string;
  postanskiBroj: string;
  mesto: string;
  drzava: string;
  email: string;
  potvrdaEmail: string;
  dani: TipDana[];
  brojOsoba?: number; 
  promoKod?: string;
}

export interface KreirajPrijavuResponse {
  prijavaId: number;
  token: string;
  generisaniPromoKod: string;
  ukupnoDugovanje: number;
  popustNaPaket: number;
  popustNaGrupu: number;
  popustPromoKod: number;
  rezervacije: Array<{
    danId: number;
    tipDana: TipDana;
    datum: string | null;
    osnovnaCena: number;
    popustRanePrijave: number;
    cenaUTrenutkuPrijave: number; 
    brojZauzetihMesta: number;
  }>;
}

export interface IzmeniPrijavuRequest {
  email: string;
  token: string;
  dani: TipDana[];
  brojOsoba: number;
}

export interface IzmeniPrijavuResponse {
  prijavaId: number;
  ukupnoDugovanje: number;
  popustNaPaket: number;
  popustNaGrupu: number;
  popustPromoKod: number;
}

export interface OtkaziPrijavuRequest {
  email: string;
  token: string;
}

export interface OtkaziPrijavuResponse {
  prijavaId: number;
  statusTokena: "PASIVAN";
  poruka: string;
}