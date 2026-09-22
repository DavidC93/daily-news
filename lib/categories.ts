import { Category } from "./types";

export const CATEGORY_ORDER: Category[] = [
  "gaming",
  "technology",
  "markets",
  "automotive",
  "sports",
  "security",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  gaming: "גיימינג",
  technology: "טכנולוגיה וגאדג'טים",
  markets: "שוק ההון",
  automotive: "רכב",
  sports: "ספורט וכושר",
  security: "פלילים, צבא וביטחון",
};

export function isCategory(value: string): value is Category {
  return (CATEGORY_ORDER as string[]).includes(value);
}

export const VERIFICATION_LABELS: Record<string, string> = {
  confirmed: "מאומת",
  reported: "דיווח",
  claim: "טענה",
  unverified: "לא אומת עצמאית",
};
