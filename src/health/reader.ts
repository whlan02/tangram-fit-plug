// Fallback for platforms without health data (web). Metro picks reader.ios.ts / reader.android.ts on devices.
import type { HealthReader } from "../types";

export const reader: HealthReader = {
  source: "healthkit",
  async requestAccess() {
    throw new Error("这个平台读不了健康数据，请在 iPhone 或 Android 手机上运行");
  },
  async readDays() {
    throw new Error("这个平台读不了健康数据，请在 iPhone 或 Android 手机上运行");
  },
};

export default reader;
