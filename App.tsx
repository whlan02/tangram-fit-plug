import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AuthError, normalizeServerUrl } from "./src/ingest";
import {
  clearPairing,
  loadLastSync,
  loadPairing,
  saveLastSync,
  savePairing,
  type Pairing,
} from "./src/storage";
import { daysToSync, runSync, type SyncSummary } from "./src/sync";
import reader from "./src/health/reader";

type LogItem = { id: number; text: string };

function hostOf(serverUrl: string): string {
  try {
    return new URL(serverUrl).hostname;
  } catch {
    return serverUrl;
  }
}

function formatLastSync(iso: string | null): string {
  if (!iso) return "还没同步过";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "还没同步过";
  return d.toLocaleString();
}

function formatSyncResult(summary: SyncSummary): string {
  const parts = [`同步完成：读取 ${summary.records} 天，服务器接收 ${summary.accepted} 天`];
  if (summary.rejected.length) {
    parts.push(`被拒绝 ${summary.rejected.length} 条：${summary.rejected[0].error}`);
  }
  if (summary.ignored_fields.length) {
    parts.push(`服务器忽略了这些字段：${summary.ignored_fields.join("、")}`);
  }
  return parts.join("\n");
}

function errorMessage(err: unknown): string {
  if (err instanceof AuthError) {
    return "令牌无效或已吊销，请在服务器上重新生成令牌后重新配对";
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [pairing, setPairing] = useState<Pairing | null>(null);
  const [serverUrlInput, setServerUrlInput] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await loadPairing();
      const ls = await loadLastSync();
      if (cancelled) return;
      setPairing(p);
      setLastSync(ls);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const pushLog = useCallback((text: string) => {
    setLogs((prev) => [{ id: Date.now() + Math.random(), text }, ...prev]);
  }, []);

  const onSavePairing = async () => {
    setFormError(null);
    const token = tokenInput.trim();
    if (!token) {
      setFormError("请填写令牌");
      return;
    }
    let serverUrl: string;
    try {
      serverUrl = normalizeServerUrl(serverUrlInput);
    } catch (err) {
      setFormError(errorMessage(err));
      return;
    }
    await savePairing({ serverUrl, token });
    const ls = await loadLastSync();
    setLastSync(ls);
    setPairing({ serverUrl, token });
    setTokenInput("");
    setServerUrlInput("");
  };

  const withBusy = async (fn: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const onRequestAccess = () =>
    withBusy(async () => {
      try {
        await reader.requestAccess();
        pushLog("已请求健康数据授权");
      } catch (err) {
        pushLog(errorMessage(err));
      }
    });

  const doSync = (days: number) =>
    withBusy(async () => {
      if (!pairing) return;
      try {
        const summary = await runSync(days, {
          reader,
          serverUrl: pairing.serverUrl,
          token: pairing.token,
          device: `${Platform.OS} ${Platform.Version}`,
        });
        const iso = new Date().toISOString();
        await saveLastSync(iso);
        setLastSync(iso);
        pushLog(formatSyncResult(summary));
      } catch (err) {
        pushLog(errorMessage(err));
      }
    });

  const onUnpair = () => {
    Alert.alert("解除配对", "确定要解除配对吗？本地将不再保存服务器地址和令牌。", [
      { text: "取消", style: "cancel" },
      {
        text: "解除",
        style: "destructive",
        onPress: () => {
          withBusy(async () => {
            await clearPairing();
            setPairing(null);
            setLogs([]);
            setFormError(null);
          });
        },
      },
    ]);
  };

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <StatusBar style="auto" />
      </View>
    );
  }

  if (!pairing) {
    return (
      <View style={styles.screen}>
        <StatusBar style="auto" />
        <Text style={styles.title}>Tangram Fit Plug</Text>
        <Text style={styles.lead}>
          只读取手机上的健康数据，上传到你自己的服务器。数据不会经过任何第三方。
        </Text>
        <Text style={styles.label}>服务器地址</Text>
        <TextInput
          style={styles.input}
          value={serverUrlInput}
          onChangeText={setServerUrlInput}
          placeholder="例如 https://your-site.pages.dev"
          placeholderTextColor="#9aa3ad"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!busy}
        />
        <Text style={styles.label}>令牌</Text>
        <TextInput
          style={styles.input}
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="令牌"
          placeholderTextColor="#9aa3ad"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
        />
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={onSavePairing}
          disabled={busy}
        >
          <Text style={styles.buttonText}>保存配对</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Tangram Fit Plug</Text>
      <Text style={styles.meta}>服务器：{hostOf(pairing.serverUrl)}</Text>
      <Text style={styles.meta}>上次同步：{formatLastSync(lastSync)}</Text>
      {busy ? <ActivityIndicator style={styles.spinner} /> : null}
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={onRequestAccess}
        disabled={busy}
      >
        <Text style={styles.buttonText}>授权读取健康数据</Text>
      </Pressable>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={() => doSync(daysToSync(lastSync, new Date()))}
        disabled={busy}
      >
        <Text style={styles.buttonText}>立即同步</Text>
      </Pressable>
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={() => doSync(90)}
        disabled={busy}
      >
        <Text style={styles.buttonText}>补传最近 90 天</Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.buttonDanger, busy && styles.buttonDisabled]}
        onPress={onUnpair}
        disabled={busy}
      >
        <Text style={styles.buttonText}>解除配对</Text>
      </Pressable>
      <Text style={styles.label}>操作记录</Text>
      <ScrollView style={styles.log} contentContainerStyle={styles.logContent}>
        {logs.length === 0 ? (
          <Text style={styles.logEmpty}>还没有操作记录</Text>
        ) : (
          logs.map((item) => (
            <Text key={item.id} style={styles.logItem}>
              {item.text}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#f6f7f9",
    alignItems: "center",
    justifyContent: "center",
  },
  screen: {
    flex: 1,
    backgroundColor: "#f6f7f9",
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1a1d21",
    marginBottom: 8,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    color: "#4a5560",
    marginBottom: 24,
  },
  meta: {
    fontSize: 15,
    color: "#4a5560",
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d8dee6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1a1d21",
  },
  error: {
    color: "#b42318",
    marginTop: 10,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDanger: {
    backgroundColor: "#b42318",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  spinner: {
    marginTop: 12,
  },
  log: {
    flex: 1,
    marginTop: 8,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  logContent: {
    padding: 12,
  },
  logEmpty: {
    color: "#9aa3ad",
    fontSize: 14,
  },
  logItem: {
    fontSize: 14,
    color: "#1a1d21",
    marginBottom: 10,
    lineHeight: 20,
  },
});
