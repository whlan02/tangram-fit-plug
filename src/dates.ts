const p2 = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD in the device's local time zone. */
export function localDate(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** HH:MM in the device's local time zone. */
export function localTime(d: Date): string {
  return `${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes(), d.getSeconds());
}

/** Every local date from `from` to `to`, inclusive, oldest first. */
export function eachDate(from: Date, to: Date): string[] {
  const out: string[] = [];
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) out.push(localDate(d));
  return out;
}
