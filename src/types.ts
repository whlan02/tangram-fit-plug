// Mirrors docs/ingest.md (upload format v1) in the Tangram Fit web repository.

export type HrvKind = "rmssd" | "sdnn";

export interface Sleep {
  minutes: number; // actually asleep
  deep?: number;
  light?: number;
  rem?: number;
  awake?: number;
  inbed?: number;
  start?: string; // HH:MM, local
  end?: string;
}

export interface Exercise {
  name: string;
  minutes: number;
  type?: string;
  start?: string;
  end?: string;
  kcal?: number;
  km?: number;
  hr?: number;
}

/** One local calendar day. Sleep belongs to the day you woke up. */
export interface IngestRecord {
  date: string; // YYYY-MM-DD
  steps?: number;
  kcal_total?: number;
  kcal_active?: number;
  resting_hr?: number;
  hrv?: number;
  hrv_kind?: HrvKind; // required whenever hrv is set
  weight_kg?: number;
  body_fat_pct?: number;
  spo2?: number;
  breathing?: number;
  skin_temp?: number;
  vo2max?: number;
  sleep?: Sleep;
  exercise?: Exercise[];
}

export type SourceName = "healthkit" | "health-connect";

export interface HealthReader {
  source: SourceName;
  /** Ask the user for read access. Resolves true when the request was shown (HealthKit never reveals what was granted). */
  requestAccess(): Promise<boolean>;
  /** Daily records for every local day from `from` to `to`, inclusive. */
  readDays(from: Date, to: Date): Promise<IngestRecord[]>;
}

export interface UploadResult {
  accepted: number;
  rejected: { index: number; error: string }[];
  ignored_fields: string[];
}
