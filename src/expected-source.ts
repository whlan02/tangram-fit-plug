import type { SourceName } from "./types";

export function expectedSource(os: string): SourceName {
  return os === "ios" ? "healthkit" : "health-connect";
}
