import { getLatestEditionDate, getRecentEditionDates } from "./queries";

export interface NavContext {
  currentDate: string;
  latestDate: string | null;
  yesterdayDate: string | null;
  dayBeforeDate: string | null;
}

export async function getNavContext(viewedDate: string): Promise<NavContext> {
  const latestDate = await getLatestEditionDate();
  if (!latestDate) {
    return { currentDate: viewedDate, latestDate: null, yesterdayDate: null, dayBeforeDate: null };
  }
  const recent = await getRecentEditionDates(latestDate, 3);
  return {
    currentDate: viewedDate,
    latestDate,
    yesterdayDate: recent[1] ?? null,
    dayBeforeDate: recent[2] ?? null,
  };
}
