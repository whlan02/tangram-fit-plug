import { useState } from "react";
import { Text } from "react-native";
import { t } from "../i18n";
import type { LastResult } from "../storage";
import { type, useTheme } from "../theme";
import { Card } from "./Card";
import { PressableScale } from "./PressableScale";

export function ResultCard({ result }: { result: LastResult | null }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  if (!result) {
    return (
      <Card>
        <Text style={{ fontSize: type.heading, fontWeight: "600", color: theme.ink }}>{t("result.title")}</Text>
        <Text style={{ fontSize: type.body, color: theme.muted }}>{t("result.empty")}</Text>
      </Card>
    );
  }
  const firstReason = result.rejected[0]?.error;
  const rejectedLabel = t("result.rejected", { n: result.rejected.length });
  return (
    <Card>
      <Text style={{ fontSize: type.heading, fontWeight: "600", color: theme.ink }}>{t("result.title")}</Text>
      <Text style={{ fontSize: type.body, color: theme.ink }}>{t("result.daysRead", { n: result.records })}</Text>
      <Text style={{ fontSize: type.body, color: theme.ink }}>{t("result.daysAccepted", { n: result.accepted })}</Text>
      {result.rejected.length ? (
        <PressableScale
          onPress={() => setOpen((v) => !v)}
          accessibilityLabel={rejectedLabel}
          style={{ justifyContent: "center" }}
        >
          <Text style={{ fontSize: type.body, color: theme.danger }}>{rejectedLabel}</Text>
          {open && firstReason ? (
            <Text style={{ fontSize: type.caption, color: theme.muted }}>{t("home.rejectedHint", { reason: firstReason })}</Text>
          ) : null}
        </PressableScale>
      ) : null}
      {result.ignored_fields.length ? (
        <Text style={{ fontSize: type.caption, color: theme.muted }}>
          {t("result.ignored", { fields: result.ignored_fields.join(" · ") })}
        </Text>
      ) : null}
    </Card>
  );
}
