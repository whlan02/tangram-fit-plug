import { Text, View } from "react-native";
import { t, type Locale } from "../i18n";
import { space, type, useTheme } from "../theme";
import { syncFreshness, timeAgo, type SyncFreshness } from "../time-ago";
import { Card } from "./Card";

const STATUS_KEY: Record<SyncFreshness, "status.never" | "status.fresh" | "status.stale"> = {
  never: "status.never",
  fresh: "status.fresh",
  stale: "status.stale",
};

interface Props {
  lastSyncIso: string | null;
  now: Date;
  locale: Locale;
}

export function StatusCard({ lastSyncIso, now, locale }: Props) {
  const theme = useTheme();
  const freshness = syncFreshness(lastSyncIso, now);
  const badge =
    freshness === "fresh" ? theme.success : freshness === "stale" ? theme.warning : theme.muted;
  return (
    <Card>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md }}>
        <Text style={{ flex: 1, fontSize: type.body, color: theme.ink }}>
          {timeAgo(lastSyncIso, now, locale)}
        </Text>
        <View style={{ backgroundColor: `${badge}22`, borderRadius: 999, paddingHorizontal: space.md, paddingVertical: space.xs }}>
          <Text style={{ color: badge, fontSize: type.caption, fontWeight: "600" }}>{t(STATUS_KEY[freshness])}</Text>
        </View>
      </View>
    </Card>
  );
}
