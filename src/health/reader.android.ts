// Android: Health Connect reader. NOT IMPLEMENTED YET (iOS is built first).
// Plan: react-native-health-connect, HRV is RMSSD (HeartRateVariabilityRmssdRecord) -> hrv_kind "rmssd".
import type { HealthReader } from "../types";

export const reader: HealthReader = {
  source: "health-connect",
  async requestAccess() {
    throw new Error("Android（Health Connect）还没实现");
  },
  async readDays() {
    throw new Error("Android（Health Connect）还没实现");
  },
};

export default reader;
