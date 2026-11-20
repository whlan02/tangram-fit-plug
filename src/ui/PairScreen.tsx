import { useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { t } from "../i18n";
import { space, type, useTheme } from "../theme";
import { PrimaryButton } from "./PrimaryButton";
import { Screen } from "./Screen";
import { TextField } from "./TextField";

interface Props {
  serverUrl: string;
  token: string;
  onServerUrl: (v: string) => void;
  onToken: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
}

export function PairScreen({
  serverUrl,
  token,
  onServerUrl,
  onToken,
  onSubmit,
  busy,
  error,
}: Props) {
  const theme = useTheme();
  const tokenRef = useRef<{ focus: () => void } | null>(null);
  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: space.lg, paddingBottom: space.xxxl }}
        >
          <Text style={{ fontSize: type.title, fontWeight: "700", color: theme.ink }}>{t("app.title")}</Text>
          <View>
            <TextField
              label={t("pair.serverUrl")}
              value={serverUrl}
              onChangeText={onServerUrl}
              placeholder={t("pair.serverUrlPlaceholder")}
              keyboardType="url"
              returnKeyType="next"
              onSubmitEditing={() => tokenRef.current?.focus()}
              editable={!busy}
            />
          </View>
          <View>
            <TextField
              label={t("pair.token")}
              value={token}
              onChangeText={onToken}
              placeholder={t("pair.tokenPlaceholder")}
              secure
              returnKeyType="done"
              onSubmitEditing={onSubmit}
              editable={!busy}
              onBind={(node) => {
                tokenRef.current = node;
              }}
            />
          </View>
          {error ? <Text style={{ color: theme.danger, fontSize: type.body }}>{error}</Text> : null}
          <PrimaryButton
            label={busy ? t("pair.testing") : t("pair.testAndSave")}
            onPress={onSubmit}
            busy={busy}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
