// The truck runs on Pacific time no matter where the server is.
export const TIME_ZONE = "America/Los_Angeles";

/** YYYY-MM-DD in Pacific time, `daysFromToday` days from now */
export function pacificDate(daysFromToday = 0, from = new Date()): string {
  const d = new Date(from.getTime() + daysFromToday * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Start of a Pacific day (YYYY-MM-DD) as a UTC ISO string, for created_at filters */
export function pacificDayStart(date: string): string {
  // Pacific is UTC-7 or UTC-8; find the offset at noon that day, then apply it at midnight
  const noon = new Date(`${date}T12:00:00Z`);
  const hourThere = Number(new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" }).format(noon));
  const offsetHours = 12 - hourThere;
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + offsetHours * 3_600_000).toISOString();
}

/** Hour of day (0–23) in Pacific time */
export function pacificHour(iso: string): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", hourCycle: "h23" }).format(new Date(iso)));
}

/** "6:18 PM" in Pacific time */
export function pacificTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}
