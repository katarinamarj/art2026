export type StatusPromoKoda = "NEISKORIŠĆEN" | "ISKORIŠĆEN" | "NEVAŽEĆI";

export interface PromoKod {
    KodID: number;
    VrednostKoda: string;
    Status: StatusPromoKoda;
    GenerisanPrijavaID: number;
    IskoricenPrijavaID?: number | null;
}
