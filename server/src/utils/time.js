// Bangladesh is UTC+6 with no daylight saving; the server (Render) runs in UTC.
export const DAY = 24 * 60 * 60 * 1000;
export const BD_OFFSET = 6 * 60 * 60 * 1000;

export const startOfTodayBD = (now = Date.now()) => new Date(Math.floor((now + BD_OFFSET) / DAY) * DAY - BD_OFFSET);
export const startOfDaysAgoBD = (days, now = Date.now()) => new Date(startOfTodayBD(now).getTime() - days * DAY);

// "2026-10-11" for the Bangladesh calendar day that contains this instant.
export const dateKeyBD = (ms) => new Date(ms + BD_OFFSET).toISOString().slice(0, 10);
