# Data mapping

How Tangram Fit Plug turns HealthKit / Health Connect samples into `IngestRecord` objects. Source of truth: `src/health/reader.ios.ts`, `src/health/reader.android.ts`, `src/sleep.ts`, `src/sync.ts`, `src/types.ts`.

English overview: [README.md](../README.md). 中文概述：[README.zh-CN.md](../README.zh-CN.md).

## Time window

`runSync` in `src/sync.ts` reads **inclusive local calendar days** from `startOfDay(now − (days − 1))` through `now`.

| Trigger | `days` |
| --- | --- |
| First successful sync (`last_sync` missing or invalid) | 30 (`FIRST_SYNC_DAYS`) |
| Later automatic / “Sync now” | days between last successful sync and today, plus one, clamped to 3–90 |
| “Backfill last 90 days” | 90 (`MAX_SYNC_DAYS`) |

Sleep queries look back **one extra local day** before `from`, so a night that started yesterday is not cut off. The extra day’s samples are only used to build sessions; upload dates still come from `eachDate(from, to)`.

Dates and clock times are the **device local** timezone (`YYYY-MM-DD`, `HH:MM`).

A day with no values is omitted (the record is skipped if it only has `date`).

## De-duplication

**iOS.** Daily quantities use `queryStatisticsCollectionForQuantity` with a 1-day interval. HealthKit statistics already merge overlapping sources (iPhone + Watch). Aggregation:

| Field | Statistic |
| --- | --- |
| steps, kcal active, kcal basal | `cumulativeSum` |
| resting HR, HRV, SpO₂, respiratory rate, wrist temperature | `discreteAverage` |
| weight, body fat, VO₂ max | `mostRecent` |

**Android.** Steps and both calorie types use Health Connect `aggregateGroupByPeriod` (`DAYS`, length 1), which de-duplicates overlapping apps. Instantaneous types (`RestingHeartRate`, HRV RMSSD, weight, body fat, SpO₂, respiratory rate, VO₂ max) are paged with `readRecords` and then:

- **average** of samples that day: resting HR, HRV, SpO₂, respiratory rate
- **latest** sample that day: weight, body fat, VO₂ max

Zero / non-finite aggregates are dropped. Android daily totals also ignore values `<= 0`.

**Sleep.** Stage intervals of the same kind are merged with `unionMinutes` so overlapping writers are not double-counted. See below.

**Workouts.** Each session is kept; there is no merge of overlapping workouts.

## Calories

- **iOS `kcal_active`:** round of active energy (kcal).
- **iOS `kcal_total`:** only if **both** active and basal exist that day: `round(active + basal)`. Basal-only days do not get `kcal_total`.
- **Android `kcal_active`:** `ACTIVE_CALORIES_TOTAL.inKilocalories`.
- **Android `kcal_total`:** `ENERGY_TOTAL.inKilocalories` from `TotalCaloriesBurned`, independent of active.

## HRV

| Platform | Native type | Daily value | `hrv_kind` |
| --- | --- | --- | --- |
| iOS | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | average, unit `ms`, 1 decimal | `"sdnn"` |
| Android | `HeartRateVariabilityRmssd` | average of `heartRateVariabilityMillis`, 1 decimal | `"rmssd"` |

Do not compare the two series as if they were the same metric. The server must branch on `hrv_kind`. `hrv` is only sent when a value exists; `hrv_kind` is set in the same branch.

## Units and rounding

| Field | iOS | Android | Rounding |
| --- | --- | --- | --- |
| `steps` | `count` | `COUNT_TOTAL` | integer |
| `kcal_active` / `kcal_total` | kcal | kilocalories | integer |
| `resting_hr` | `count/min` | `beatsPerMinute` | integer |
| `hrv` | ms | ms | 1 decimal |
| `weight_kg` | kg | kg, or grams ÷ 1000 | 1 decimal |
| `body_fat_pct` | `%`; if the number is in `(0, 1]` it is treated as a fraction and ×100 | `percentage` as returned (no 0–1 guard) | 1 decimal |
| `spo2` | same percent/fraction guard as body fat | `percentage` | 1 decimal |
| `breathing` | `count/min` | `rate` | 1 decimal |
| `vo2max` | `ml/(kg*min)` | `vo2MillilitersPerMinuteKilogram` | 1 decimal |
| `skin_temp` | `degC` (iOS only) | — | 2 decimals |

## Sleep

`src/sleep.ts` turns raw stage samples into one `Sleep` per **wake-up** local date (`types.ts`: “Sleep belongs to the day you woke up”).

1. Sort samples with `end > start`.
2. Split into sessions when the gap between samples is **> 3 hours**.
3. Drop a session whose wall-clock span is **> 16 hours** (comment: implausible, e.g. a bad Google sync).
4. Asleep minutes = union of `light` + `deep` + `rem`. Sessions with `asleep <= 0` are dropped.
5. If several sessions wake on the same date, the one with the **most asleep minutes** wins.
6. `inbed` is the session span in minutes (first sample start → last sample end), not a union of in-bed intervals. In-bed / in-bed-only samples still participate in grouping and can widen that span.
7. `start` / `end` are local `HH:MM` of that span. Stage fields are omitted when the union is 0.

### iOS stage map (`HKCategoryValueSleepAnalysis`)

| Value | Kind |
| --- | --- |
| 0 | `inbed` |
| 1 | `light` (asleep unspecified) |
| 2 | `awake` |
| 3 | `light` (core) |
| 4 | `deep` |
| 5 | `rem` |

Unmapped values are ignored.

### Android stage map (`SleepSession.stages[].stage`)

| Value | Kind |
| --- | --- |
| 1 | `awake` |
| 2 | `light` |
| 4 | `light` |
| 5 | `deep` |
| 6 | `rem` |
| 7 | `awake` |

`0` and `3` are **not mapped**. If a session has **no** `stages` array (or it is empty), the whole session is one `light` sample (comment: counts as asleep).

Uploaded `sleep` object:

```ts
{
  minutes: number;  // asleep (light + deep + rem union)
  deep?: number;
  light?: number;
  rem?: number;
  awake?: number;
  inbed?: number;
  start?: string;   // HH:MM
  end?: string;
}
```

## Exercise / workouts

Sessions shorter than **1 minute** are skipped. Date = local date of **start**.

**iOS** (`queryWorkoutSamples`):

- `type` / `name`: `WorkoutActivityType` enum name, or the numeric id as a string.
- `minutes`: from `duration` (minutes × 60 if the unit is `min`), else end − start.
- `kcal`: `totalEnergyBurned`; if the unit is `kJ`, divide by 4.184. Integer kcal.
- `km`: `totalDistance`; if not already `km`, divide by 1000. 2 decimals.

**Android** (`ExerciseSession`):

- `name`: `title`, else `ExerciseType` name, else `"OTHER_WORKOUT"`.
- `type`: `ExerciseType` name; omitted if unknown.
- `minutes`: round((end − start) / 60s).
- No `kcal` or `km` on the Android path.

`hr` on `Exercise` is never set.

## Fields that exist on the type but are not read

- Instantaneous / workout heart rate (`exercise[].hr`)
- Wrist temperature on Android
- Any HealthKit / Health Connect type not listed in the README table (for example blood pressure, height, water)

## Source names

| OS | `source` on POST | Token must be created as |
| --- | --- | --- |
| iOS | `healthkit` | `--source healthkit` |
| Android | `health-connect` | `--source health-connect` |
| Web / other (`reader.ts`) | claims `healthkit` but `requestAccess` / `readDays` throw | n/a |
