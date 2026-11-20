import { AuthError, UploadError } from "./ingest";
import { t } from "./i18n";

export function errorToText(err: unknown): string {
  if (err instanceof AuthError) return t("errors.auth");
  if (err instanceof UploadError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return t("errors.unknown");
}
