export interface OtkaziPrijavuRequest {
  email: string;
  token: string;
}

export interface OtkaziPrijavuResponse {
  prijavaId: number;
  statusTokena: "PASIVAN";
  poruka: string;
}
