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
