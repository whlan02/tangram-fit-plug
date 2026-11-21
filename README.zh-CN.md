# Tangram Fit Plug

[English](./README.md)

一个开源的小 App：读取手机里已有的健康数据，上传到**你自己的** Tangram Fit 服务器。数据不经过第三方。

<!-- 截图待补：引导、配对、同步、设置。 -->

## 它是什么 / 不是什么

**它是**独立的开源配套程序。在 iPhone 上读 Apple 健康（HealthKit），在 Android 上读 Health Connect，然后把按日汇总的记录 `POST` 到 `https://<你的域名>/api/ingest`。没有账号、没有厂商云：你在自己的服务器上生成令牌，在手机里填服务器地址和令牌即可。

**它不是**付费版 Tangram Fit App，也不是那款产品的精简版。网页版和本 Plug 共用一套 ingest 约定；本仓库只负责手机端读取和上传。

它不会写入或改写健康记录。不能用 [Expo Go](https://docs.expo.dev/develop/development-builds/introduction/)：HealthKit 和 Health Connect 都是原生模块，必须打开发版。

## 功能

- **配对。** 填写服务器地址和令牌，或打开配对链接。保存前会用 Bearer 令牌请求 `GET /api/ingest`；令牌的 `source` 必须和当前手机一致（iOS 为 `healthkit`，Android 为 `health-connect`）。
- **手动同步**最近若干天，以及 **90 天补读**。同步页下拉刷新也会同步。
- **自动同步**（默认开）：打开 App 或回到前台时，若已经请求过健康权限，且距上次成功同步超过一小时，则再同步一次。
- **结果卡片：** 读了几天、服务器接受了几天、被拒的行、被忽略的字段。
- **错误提示：** 令牌无效、来源不匹配、连不上主机、未安装 Health Connect 等。
- **设置：** 语言、自动同步、只读的数据类型列表、隐私说明、版本、GitHub、解除配对。
- **浅色 / 深色**跟随系统（`userInterfaceStyle: automatic`）。
- **38 种语言。** `src/i18n/locales.ts` 里的每一种都有完整目录。除英语和简体中文外，多数文案是机器辅助翻译，欢迎母语者校对。

## 读取哪些数据

一个本地日历日对应一条上传记录。睡眠归在**醒来那天**。HRV 跨平台不可混用：iOS 是 SDNN，Android 是 RMSSD，用 `hrv_kind` 区分。

| 数据 | iOS（HealthKit） | Android（Health Connect） | 上传字段 |
| --- | --- | --- | --- |
| 步数 | `HKQuantityTypeIdentifierStepCount` | `Steps` | `steps` |
| 活动热量 | `HKQuantityTypeIdentifierActiveEnergyBurned` | `ActiveCaloriesBurned` | `kcal_active` |
| 总热量 | 活动 + 基础（`HKQuantityTypeIdentifierBasalEnergyBurned`），两者都有才写 | `TotalCaloriesBurned` | `kcal_total` |
| 静息心率 | `HKQuantityTypeIdentifierRestingHeartRate` | `RestingHeartRate` | `resting_hr` |
| HRV | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` → `hrv_kind: "sdnn"` | `HeartRateVariabilityRmssd` → `hrv_kind: "rmssd"` | `hrv`, `hrv_kind` |
| 体重 | `HKQuantityTypeIdentifierBodyMass` | `Weight` | `weight_kg` |
| 体脂 | `HKQuantityTypeIdentifierBodyFatPercentage` | `BodyFat` | `body_fat_pct` |
| 血氧 | `HKQuantityTypeIdentifierOxygenSaturation` | `OxygenSaturation` | `spo2` |
| 呼吸频率 | `HKQuantityTypeIdentifierRespiratoryRate` | `RespiratoryRate` | `breathing` |
| 最大摄氧量 | `HKQuantityTypeIdentifierVO2Max` | `Vo2Max` | `vo2max` |
| 手腕温度 | `HKQuantityTypeIdentifierAppleSleepingWristTemperature` | *不读* | `skin_temp` |
| 睡眠 | `HKCategoryTypeIdentifierSleepAnalysis` | `SleepSession` | `sleep` |
| 运动 | `HKWorkoutTypeIdentifier` | `ExerciseSession` | `exercise` |

不读的例子：逐跳心率、血压、身高、饮水、经期。类型里有 `exercise[].hr`，两端读取器都没有填。

时间窗口、去重、睡眠分段、运动类型和单位见 **[docs/data-mapping.md](./docs/data-mapping.md)**。

## 隐私与安全

只读。数据只发到你填写的地址（必须是 HTTPS；本地调试可用 localhost 一类主机的 HTTP）。配对令牌和相关状态存在 **expo-secure-store**：iOS 是钥匙串（Keychain），Android 是经 Android Keystore 加密的 `SharedPreferences`。本 App 没有统计、广告或其他第三方遥测。

Android 在 `app.json` 声明的 Health Connect 权限全部是 `READ_*`：步数、活动热量、总热量、静息心率、HRV、体重、体脂、血氧、呼吸、VO₂ max、睡眠、运动。iOS 在 HealthKit 插件里配置了读取说明；代码只请求 **toRead**。

配对链接把令牌放在查询参数里。不要发到公开聊天、Issue 或截图，当作密码对待。

解除配对会清哪些本地数据：**[docs/privacy.md](./docs/privacy.md)**。

## 运行条件

- 已部署的 Tangram Fit 服务器，手机要能访问 `POST /api/ingest` 和 `GET /api/ingest`。若站点在 Cloudflare Access 后面，请给 `/api/ingest` 加 **Bypass**：这条路径靠令牌鉴权；Access 登录页会让配对和上传失败。
- 真机，以及安装开发版的条件（iOS 需要 Apple 开发者账号；Android 需要能装 Health Connect 的设备）。
- **Node.js 22.13.x 或更高**（Expo SDK 58）。本仓库的 `package.json` 没有 `engines` 字段，该下限来自 [SDK 58 文档表](https://docs.expo.dev/versions/v58.0.0/)。
- Android **minSdk 26**（写在 `app.json`）。iOS 随 Expo SDK 58（官方表为 16.4+）。

## 快速开始

### 1. 在服务器上创建令牌

在 **Tangram Fit 服务器 / 网页版**仓库里执行，不是本仓库。iPhone 用 `healthkit`，Android 用 `health-connect`。令牌只显示一次。

```bash
node scripts/db.mjs ingest-token create --source healthkit --label "iphone"
node scripts/db.mjs ingest-token create --source health-connect --label "pixel"
```

### 2. 克隆本仓库并安装依赖

```bash
git clone https://github.com/whlan02/tangram-fit-plug.git
cd tangram-fit-plug
npm install
```

### 3. 改 bundle ID / 应用包名

`app.json` 里 iOS `bundleIdentifier` 和 Android `package` 目前都是 `com.tangramfit.plug`。打包前改成你自己的。HealthKit 以及 Play / Health Connect 的登记都绑在这些 ID 上。

### 4. 登录 EAS 并登记设备

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest device:create   # iOS 内部分发
```

若这个目录已经关联过 EAS 项目，可以跳过 `eas init`。

### 5. 打开发版并装到手机

```bash
npx eas-cli@latest build --profile development --platform ios
npx eas-cli@latest build --profile development --platform android
```

用 EAS 安装链接把产物装上手机。**不能用 Expo Go**：`@kingstinct/react-native-healthkit` 和 `react-native-health-connect` 不在 Expo Go 里。

### 6. 配对、授权、同步

打开 App → 短引导 → 填地址和令牌（或打开配对链接）→ **测试连接并保存** → **允许健康数据访问** → **立即同步**。

### 不用 EAS 的本地构建

本项目用 Continuous Native Generation（仓库里没有提交 `ios/`、`android/`）。本机有 Xcode 或 Android Studio 时：

```bash
npx expo run:ios
npx expo run:android
```

健康数据仍需要真机。模拟器和 `reader.ts` 的 web 回退读不了健康库。

## 配对链接

Scheme 是 `tangramfitplug`（见 `app.json`）：

```
tangramfitplug://pair?url=<urlencoded-https-origin>&token=<token>
```

示例（占位域名和令牌）：

```
tangramfitplug://pair?url=https%3A%2F%2Fyour-site.example&token=replace-me
```

做成二维码、写进备忘录，或隔空投送到自己的手机再打开。表单会被填好，**点「测试连接并保存」之前不会落盘**。不要公开分享这条链接。

## 上传格式

完整接口文档会随 Tangram Fit 网页版开源仓库发布。Plug 实际发送的内容以 `src/ingest.ts` 和 `src/types.ts` 为准。

**校验令牌** — `GET /api/ingest`  
请求头：`Authorization: Bearer <token>`  
期望 JSON：`{ "source": "healthkit" | "health-connect", "label": "…" | null }`

**上传** — `POST /api/ingest`  
请求头：`Content-Type: application/json`，`Authorization: Bearer <token>`  
每批最多 100 天。重复上传同一天是预期行为：服务端按 `(date, source)` 合并。网络错误、HTTP 429 和 5xx 会重试几次。

```json
{
  "version": 1,
  "source": "healthkit",
  "device": "ios 18.0",
  "records": [
    {
      "date": "2026-11-20",
      "steps": 8432,
      "kcal_active": 410,
      "kcal_total": 2100,
      "resting_hr": 58,
      "hrv": 42.1,
      "hrv_kind": "sdnn",
      "weight_kg": 70.2,
      "body_fat_pct": 18.5,
      "spo2": 97.2,
      "breathing": 14.1,
      "vo2max": 42.0,
      "skin_temp": 36.21,
      "sleep": {
        "minutes": 421,
        "deep": 80,
        "light": 240,
        "rem": 101,
        "awake": 25,
        "inbed": 460,
        "start": "23:12",
        "end": "06:52"
      },
      "exercise": [
        {
          "name": "Running",
          "type": "Running",
          "minutes": 32,
          "start": "07:10",
          "end": "07:42",
          "kcal": 280,
          "km": 5.12
        }
      ]
    }
  ]
}
```

`device` 为 `"${Platform.OS} ${Platform.Version}"`。没有数据的可选字段不会出现。Android 上 `hrv_kind` 为 `"rmssd"`，且不会发送 `skin_temp`。

## 排障

| 现象 | 检查 |
| --- | --- |
| 令牌无效（401） | 在服务器上重新生成 ingest 令牌再配对。 |
| 来源不匹配 | iPhone 要用 `--source healthkit`，Android 要用 `health-connect`。配对页会拦截不一致。 |
| 连不上服务器 | HTTPS、DNS、手机网络。普通域名不允许明文 HTTP。 |
| 跳出 Access 登录页 / 响应无法解析 | Cloudflare Access（或同类网关）拦了 `/api/ingest`。给该路径 Bypass，用令牌鉴权。 |
| 同步后没有数据 | 把需要的类型都授权。iOS 上 HealthKit 不会告诉 App 哪些类型被允许——拒绝的类型读出来就是空。手表数据需要已经同步到手机。 |
| iOS 没有 HRV 或睡眠阶段 | SDNN 和分阶段睡眠通常需要 Apple Watch（或其他写入源）。未分类的「睡着」会记成浅睡。 |
| 没有 Health Connect | 安装或更新 [Health Connect](https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata)。错误文案提到它时，同步页会给出商店按钮。 |
| 同步窗口偏短 | 第一次成功同步读 **30** 个本地日。之后按距上次成功的天数 + 1，夹在 **3–90**。要满窗口用 **补读最近 90 天**。没点过健康授权时，自动同步不会跑。 |

## 目录结构

```
App.tsx                 # 引导 → 配对 → 同步 / 设置
src/health/             # reader.ios.ts、reader.android.ts、web 回退
src/ingest.ts           # URL 规则、令牌校验、分批 POST
src/sync.ts             # 天数窗口 + 上传
src/autosync.ts         # 前台一小时规则
src/pairing-link.ts     # tangramfitplug://pair
src/storage.ts          # SecureStore 键
src/sleep.ts            # 睡眠样本 → 按醒来日汇总
src/i18n/               # 语言列表、目录、长度规则
src/ui/                 # 界面
src/state/              # 配对、设置、同步
test/                   # Node 测试（不含真机 HealthKit / Health Connect）
app.json                # Scheme、包名、Android 健康权限、插件
eas.json                # development / preview / production
docs/                   # 数据映射与隐私
```

## 开发

```bash
npm install
npm test
npm run typecheck
npx expo start          # 只有 JS；健康 API 需要原生构建
```

### 语言

目录在 `src/i18n/catalogs/`。新增一种语言：在 `src/i18n/locales.ts` 加上 `{ code, name }`，按英文目录补齐全部键（占位符一致），在 `src/i18n/catalogs/index.ts` 导出。`npm test` 会检查键、占位符和长度上限（`src/i18n/length-rules.ts`：标签最多 12 字、动作类最多 40、其余相对英文有上限），避免撑破现有界面。

## 贡献

- **新的数据类型：** 在 `IngestRecord`（`src/types.ts`）加字段，在 iOS / Android 读取器里读出来，补 HealthKit 类型或 Health Connect 权限（Android 还要改 `app.json`），并在所有语言目录里加设置页文案。不要发明服务端尚未接受的字段。
- **新语言：** 见上一节；更欢迎母语者校对，而不是再堆机器翻译。
- **缺陷和真机结果：** 开 Issue，写明系统版本、手表/手机、授权了哪些类型、是否安装 Health Connect。Android 读取**尚未在真机验证**。iOS 读取已实现，睡眠/同步/上传有单元测试，但**未经大范围真机验证**。

## 现状

代码里已实现：

- 配对（表单 + 链接）、令牌校验、来源校验
- 上表所列的 iOS HealthKit 按日读取
- 上表所列的 Android Health Connect 按日读取（除手腕温度）
- 同步窗口、90 天补读、自动同步、结果卡片、38 种语言、浅色/深色

不能写成「已在真机测过」的部分：

- Android Health Connect（`reader.android.ts` 写明未在设备上测试）
- 覆盖多种手表和系统版本的 iOS HealthKit

本 App 没有：HealthKit 后台投递（插件 `background: false`）、Expo Go、写入健康库、账号、统计。

## 许可证

待定（To be decided）。第三方依赖沿用各自的 npm 许可证。

## 尚未确定的问题

- 本仓库没有真机实验记录，不能断言某套 Watch / iOS 组合已经验证过读取。
- 生成令牌的 CLI（`scripts/db.mjs`）在服务器项目里；`--label` 等参数来自约定的服务器流程，不是本仓库的文件。
- Cloudflare / 反代的具体配置在服务端；Plug 只能看到「返回登录 HTML 而不是 JSON」。
- Health Connect 阶段值 `0` 和 `3` 在代码里没有映射，官方枚举名也没有写在注释里。
- 与付费 Tangram Fit App 的关系，除「独立开源小 App、不是付费 App 的子集」之外，本代码库没有更多定义。
