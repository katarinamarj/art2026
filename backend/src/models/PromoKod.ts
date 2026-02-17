export type StatusPromoKoda = "NEISKORISCEN" | "ISKORISCEN" | "NEVAZECI";

export interface PromoKod {
    KodID: number;
    VrednostKoda: string;
    Status: StatusPromoKoda;
    GenerisanPrijavaID: number;
    IskoricenPrijavaID?: number | null;
}
