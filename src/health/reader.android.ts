// Android: reads Health Connect. Needs a development build. NOT YET TESTED ON A DEVICE (iOS is the first target).
// HRV in Health Connect is RMSSD (HeartRateVariabilityRmssdRecord), so hrv_kind is "rmssd".
import {
  aggregateGroupByPeriod,
  ExerciseType,
  getSdkStatus,
  initialize,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from "react-native-health-connect";
import { eachDate, localDate, localTime, startOfDay } from "../dates";
import { summarizeSleep, type SleepKind, type SleepSample } from "../sleep";
import type { Exercise, HealthReader, IngestRecord } from "../types";

const READ_TYPES = [
  "Steps", "ActiveCaloriesBurned", "TotalCaloriesBurned", "RestingHeartRate", "HeartRateVariabilityRmssd",
  "Weight", "BodyFat", "OxygenSaturation", "RespiratoryRate", "Vo2Max", "SleepSession", "ExerciseSession",
] as const;

const round = (v: number, digits = 0) => Math.round(v * 10 ** digits) / 10 ** digits;

async function ensureReady() {
  const status = await getSdkStatus();
  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) throw new Error("这台手机上没有可用的 Health Connect，请先安装或更新它");
  if (!(await initialize())) throw new Error("Health Connect 初始化失败");
}

/** Daily totals computed by Health Connect itself, which de-duplicates overlapping apps. */
async function dailyTotals(recordType: string, pick: (result: any) => number | undefined, from: Date, to: Date): Promise<Map<string, number>> {
  const groups: any[] = await aggregateGroupByPeriod({
    recordType,
    timeRangeFilter: { operator: "between", startTime: startOfDay(from).toISOString(), endTime: to.toISOString() },
    timeRangeSlicer: { period: "DAYS", length: 1 },
  } as any);
  const out = new Map<string, number>();
  for (const g of groups) {
    const v = pick(g.result);
    if (v != null && Number.isFinite(v) && v > 0) out.set(localDate(new Date(g.startTime)), v);
  }
  return out;
}

async function readAll(recordType: string, from: Date, to: Date): Promise<any[]> {
  const records: any[] = [];
  let pageToken: string | undefined;
  do {
    const page: any = await readRecords(recordType as any, {
      timeRangeFilter: { operator: "between", startTime: startOfDay(from).toISOString(), endTime: to.toISOString() },
      pageSize: 1000,
      pageToken,
    } as any);
    records.push(...page.records);
    pageToken = page.pageToken || undefined;
  } while (pageToken);
  return records;
}

/** One value per local day from instantaneous records: the average, or the latest measurement. */
function perDay(records: any[], value: (r: any) => number | undefined, mode: "average" | "latest"): Map<string, number> {
  const byDate = new Map<string, { t: number; v: number }[]>();
  for (const r of records) {
    const v = value(r);
    const t = new Date(r.time).getTime();
    if (v == null || !Number.isFinite(v) || Number.isNaN(t)) continue;
    const date = localDate(new Date(t));
    (byDate.get(date) ?? byDate.set(date, []).get(date)!).push({ t, v });
  }
  const out = new Map<string, number>();
  for (const [date, list] of byDate) {
    out.set(date, mode === "average" ? list.reduce((s, x) => s + x.v, 0) / list.length : list.reduce((a, b) => (b.t > a.t ? b : a)).v);
  }
  return out;
}

const STAGE_KIND: Record<number, SleepKind> = { 1: "awake", 2: "light", 4: "light", 5: "deep", 6: "rem", 7: "awake" };

function sleepSamples(sessions: any[]): SleepSample[] {
  const out: SleepSample[] = [];
  for (const s of sessions) {
    if (Array.isArray(s.stages) && s.stages.length) {
      for (const st of s.stages) {
        const kind = STAGE_KIND[Number(st.stage)];
        if (kind) out.push({ start: new Date(st.startTime), end: new Date(st.endTime), kind });
      }
    } else {
      out.push({ start: new Date(s.startTime), end: new Date(s.endTime), kind: "light" }); // no stages: the whole session counts as asleep
    }
  }
  return out;
}

const EXERCISE_NAMES: Record<number, string> = Object.fromEntries(Object.entries(ExerciseType).map(([name, n]) => [n as number, name]));

function exercises(sessions: any[]): Map<string, Exercise[]> {
  const out = new Map<string, Exercise[]>();
  for (const s of sessions) {
    const start = new Date(s.startTime), end = new Date(s.endTime);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (minutes < 1) continue;
    const name = s.title || EXERCISE_NAMES[s.exerciseType] || "OTHER_WORKOUT";
    const x: Exercise = { name: String(name), type: EXERCISE_NAMES[s.exerciseType], minutes, start: localTime(start), end: localTime(end) };
    if (!x.type) delete x.type;
    const date = localDate(start);
    (out.get(date) ?? out.set(date, []).get(date)!).push(x);
  }
  return out;
}

export const reader: HealthReader = {
  source: "health-connect",

  async requestAccess() {
    await ensureReady();
    const granted = await requestPermission(READ_TYPES.map((recordType) => ({ accessType: "read", recordType })) as any);
    return granted.length > 0;
  },

  async readDays(from, to) {
    await ensureReady();
    const [steps, active, total, resting, hrv, weight, bodyFat, spo2, breathing, vo2, sleepSessions, exerciseSessions] = await Promise.all([
      dailyTotals("Steps", (r) => r.COUNT_TOTAL, from, to),
      dailyTotals("ActiveCaloriesBurned", (r) => r.ACTIVE_CALORIES_TOTAL?.inKilocalories, from, to),
      dailyTotals("TotalCaloriesBurned", (r) => r.ENERGY_TOTAL?.inKilocalories, from, to),
      readAll("RestingHeartRate", from, to).then((rs) => perDay(rs, (r) => r.beatsPerMinute, "average")),
      readAll("HeartRateVariabilityRmssd", from, to).then((rs) => perDay(rs, (r) => r.heartRateVariabilityMillis, "average")),
      readAll("Weight", from, to).then((rs) => perDay(rs, (r) => r.weight?.unit === "kilograms" ? r.weight.value : r.weight?.unit === "grams" ? r.weight.value / 1000 : undefined, "latest")),
      readAll("BodyFat", from, to).then((rs) => perDay(rs, (r) => r.percentage, "latest")),
      readAll("OxygenSaturation", from, to).then((rs) => perDay(rs, (r) => r.percentage, "average")),
      readAll("RespiratoryRate", from, to).then((rs) => perDay(rs, (r) => r.rate, "average")),
      readAll("Vo2Max", from, to).then((rs) => perDay(rs, (r) => r.vo2MillilitersPerMinuteKilogram, "latest")),
      readAll("SleepSession", addDaysSafe(from, -1), to),
      readAll("ExerciseSession", from, to),
    ]);
    const sleep = summarizeSleep(sleepSamples(sleepSessions));
    const workouts = exercises(exerciseSessions);

    const records: IngestRecord[] = [];
    for (const date of eachDate(from, to)) {
      const r: IngestRecord = { date };
      if (steps.has(date)) r.steps = Math.round(steps.get(date)!);
      if (active.has(date)) r.kcal_active = Math.round(active.get(date)!);
      if (total.has(date)) r.kcal_total = Math.round(total.get(date)!);
      if (resting.has(date)) r.resting_hr = Math.round(resting.get(date)!);
      if (hrv.has(date)) { r.hrv = round(hrv.get(date)!, 1); r.hrv_kind = "rmssd"; }
      if (weight.has(date)) r.weight_kg = round(weight.get(date)!, 1);
      if (bodyFat.has(date)) r.body_fat_pct = round(bodyFat.get(date)!, 1);
      if (spo2.has(date)) r.spo2 = round(spo2.get(date)!, 1);
      if (breathing.has(date)) r.breathing = round(breathing.get(date)!, 1);
      if (vo2.has(date)) r.vo2max = round(vo2.get(date)!, 1);
      if (sleep[date]) r.sleep = sleep[date];
      if (workouts.has(date)) r.exercise = workouts.get(date);
      if (Object.keys(r).length > 1) records.push(r);
    }
    return records;
  },
};

// Look back one extra day so a night that started before `from` still gets its first stages.
function addDaysSafe(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export default reader;
