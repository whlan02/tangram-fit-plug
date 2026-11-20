// iOS: reads Apple Health through HealthKit. Needs a development build (not Expo Go) and a real device for real data.
import {
  queryCategorySamples,
  queryStatisticsCollectionForQuantity,
  queryWorkoutSamples,
  requestAuthorization,
  WorkoutActivityType,
} from "@kingstinct/react-native-healthkit";
import { addDays, eachDate, localDate, localTime, startOfDay } from "../dates";
import { summarizeSleep, type SleepKind, type SleepSample } from "../sleep";
import type { Exercise, HealthReader, IngestRecord } from "../types";

const Q = {
  steps: "HKQuantityTypeIdentifierStepCount",
  active: "HKQuantityTypeIdentifierActiveEnergyBurned",
  basal: "HKQuantityTypeIdentifierBasalEnergyBurned",
  restingHr: "HKQuantityTypeIdentifierRestingHeartRate",
  hrv: "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  weight: "HKQuantityTypeIdentifierBodyMass",
  bodyFat: "HKQuantityTypeIdentifierBodyFatPercentage",
  spo2: "HKQuantityTypeIdentifierOxygenSaturation",
  breathing: "HKQuantityTypeIdentifierRespiratoryRate",
  vo2max: "HKQuantityTypeIdentifierVO2Max",
  wristTemp: "HKQuantityTypeIdentifierAppleSleepingWristTemperature",
} as const;
const SLEEP = "HKCategoryTypeIdentifierSleepAnalysis";

type Stat = "cumulativeSum" | "discreteAverage" | "mostRecent";

/** One value per local day for a quantity type. Statistics queries already de-duplicate overlapping sources (iPhone + Watch). */
async function daily(id: string, stat: Stat, unit: string, from: Date, to: Date): Promise<Map<string, number>> {
  const start = startOfDay(from);
  const rows = await queryStatisticsCollectionForQuantity(id as any, [stat], start, { day: 1 }, { filter: { date: { startDate: start, endDate: to } }, unit } as any);
  const out = new Map<string, number>();
  for (const r of rows as any[]) {
    if (!r.startDate) continue;
    const q = stat === "cumulativeSum" ? r.sumQuantity : stat === "discreteAverage" ? r.averageQuantity : r.mostRecentQuantity;
    if (q && Number.isFinite(q.quantity)) out.set(localDate(new Date(r.startDate)), q.quantity);
  }
  return out;
}

/** HealthKit percentages arrive as 0-100 with the "%" unit, but guard against a 0-1 fraction. */
const percent = (v: number) => (v > 0 && v <= 1 ? v * 100 : v);
const round = (v: number, digits = 0) => Math.round(v * 10 ** digits) / 10 ** digits;

// HKCategoryValueSleepAnalysis: 0 inBed, 1 asleepUnspecified, 2 awake, 3 asleepCore, 4 asleepDeep, 5 asleepREM
const SLEEP_KIND: Record<number, SleepKind> = { 0: "inbed", 1: "light", 2: "awake", 3: "light", 4: "deep", 5: "rem" };

async function readSleep(from: Date, to: Date) {
  // Look back one extra day so a night that started before `from` still gets its first stages.
  const start = addDays(startOfDay(from), -1);
  const rows = await queryCategorySamples(SLEEP as any, { filter: { date: { startDate: start, endDate: to } }, limit: 0, ascending: true } as any);
  const samples: SleepSample[] = [];
  for (const r of rows as any[]) {
    const kind = SLEEP_KIND[Number(r.value)];
    if (kind) samples.push({ start: new Date(r.startDate), end: new Date(r.endDate), kind });
  }
  return summarizeSleep(samples);
}

async function readWorkouts(from: Date, to: Date): Promise<Map<string, Exercise[]>> {
  const rows = await queryWorkoutSamples({ filter: { date: { startDate: startOfDay(from), endDate: to } }, limit: 0, ascending: true } as any);
  const out = new Map<string, Exercise[]>();
  for (const w of rows as any[]) {
    const start = new Date(w.startDate), end = new Date(w.endDate);
    const seconds = w.duration?.unit === "min" ? w.duration.quantity * 60 : w.duration?.quantity ?? (end.getTime() - start.getTime()) / 1000;
    const minutes = Math.round(seconds / 60);
    if (minutes < 1) continue;
    const type = (WorkoutActivityType as any)[w.workoutActivityType] ?? String(w.workoutActivityType);
    const x: Exercise = { name: String(type), type: String(type), minutes, start: localTime(start), end: localTime(end) };
    const e = w.totalEnergyBurned;
    if (e && Number.isFinite(e.quantity)) x.kcal = round(e.unit === "kJ" ? e.quantity / 4.184 : e.quantity);
    const d = w.totalDistance;
    if (d && Number.isFinite(d.quantity)) x.km = round(d.unit === "km" ? d.quantity : d.quantity / 1000, 2);
    const date = localDate(start);
    (out.get(date) ?? out.set(date, []).get(date)!).push(x);
  }
  return out;
}

export const reader: HealthReader = {
  source: "healthkit",

  async requestAccess() {
    // HealthKit never says which types were granted; reads just return nothing for denied types.
    return requestAuthorization({
      toRead: [...Object.values(Q), SLEEP, "HKWorkoutTypeIdentifier"],
    } as any);
  },

  async readDays(from, to) {
    const [steps, active, basal, restingHr, hrv, weight, bodyFat, spo2, breathing, vo2max, wristTemp, sleep, workouts] = await Promise.all([
      daily(Q.steps, "cumulativeSum", "count", from, to),
      daily(Q.active, "cumulativeSum", "kcal", from, to),
      daily(Q.basal, "cumulativeSum", "kcal", from, to),
      daily(Q.restingHr, "discreteAverage", "count/min", from, to),
      daily(Q.hrv, "discreteAverage", "ms", from, to),
      daily(Q.weight, "mostRecent", "kg", from, to),
      daily(Q.bodyFat, "mostRecent", "%", from, to),
      daily(Q.spo2, "discreteAverage", "%", from, to),
      daily(Q.breathing, "discreteAverage", "count/min", from, to),
      daily(Q.vo2max, "mostRecent", "ml/(kg*min)", from, to),
      daily(Q.wristTemp, "discreteAverage", "degC", from, to),
      readSleep(from, to),
      readWorkouts(from, to),
    ]);

    const records: IngestRecord[] = [];
    for (const date of eachDate(from, to)) {
      const r: IngestRecord = { date };
      if (steps.has(date)) r.steps = Math.round(steps.get(date)!);
      if (active.has(date)) {
        r.kcal_active = Math.round(active.get(date)!);
        if (basal.has(date)) r.kcal_total = Math.round(active.get(date)! + basal.get(date)!);
      }
      if (restingHr.has(date)) r.resting_hr = Math.round(restingHr.get(date)!);
      if (hrv.has(date)) { r.hrv = round(hrv.get(date)!, 1); r.hrv_kind = "sdnn"; } // HealthKit HRV is SDNN, never RMSSD
      if (weight.has(date)) r.weight_kg = round(weight.get(date)!, 1);
      if (bodyFat.has(date)) r.body_fat_pct = round(percent(bodyFat.get(date)!), 1);
      if (spo2.has(date)) r.spo2 = round(percent(spo2.get(date)!), 1);
      if (breathing.has(date)) r.breathing = round(breathing.get(date)!, 1);
      if (vo2max.has(date)) r.vo2max = round(vo2max.get(date)!, 1);
      if (wristTemp.has(date)) r.skin_temp = round(wristTemp.get(date)!, 2);
      if (sleep[date]) r.sleep = sleep[date];
      if (workouts.has(date)) r.exercise = workouts.get(date);
      if (Object.keys(r).length > 1) records.push(r);
    }
    return records;
  },
};

export default reader;
