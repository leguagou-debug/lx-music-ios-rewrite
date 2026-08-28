# 洛雪音乐助手（iOS 重写版）

基于 [lyswhut/lx-music-mobile](https://github.com/lyswhut/lx-music-mobile) 的功能**重新实现**的 iOS 听歌软件。
不是对原仓库打补丁——业务代码全部从零编写，只对齐其功能与交互；原生依赖全部选用 iOS 官方支持版本，**不再依赖原仓库的 Android 专属原生模块**（如 `react-native-file-system`、`CryptoModule` 等）。

## 技术栈

- React Native 0.73 + TypeScript
- react-native-navigation（原生导航）
- Redux Toolkit（状态管理 + AsyncStorage 持久化）
- react-native-track-player（官方版，后台播放/锁屏控制）
- react-native-fs（官方版，文件/缓存/下载）
- crypto-js（纯 JS 加密，替代 Android 原生加密模块）

## 功能（与原仓库对齐）

- **多音源搜索**：酷我 / 酷狗 / QQ / 网易云 / 咪咕，统一搜索入口
- **开箱即用的播放**：内置各源播放地址获取（原仓库默认需自备音源配置，本版内置稳定接口）
- **播放器**：播放/暂停、上下首、进度拖动、循环模式（列表循环/随机/顺序/单曲）、倍速
- **歌词**：滚动歌词（当前行高亮、自动居中）、翻译歌词开关
- **歌单**：本地歌单（新建/重命名/删除/清空）、添加歌曲、播放全部
- **排行榜**：酷我热歌榜等（随音源切换）
- **热门搜索 / 搜索历史**
- **设置**：音源、音质（128k/320k/无损）、循环模式、倍速、歌词翻译、列表显示项、清空缓存

## 已知限制

- iOS 无「桌面歌词/悬浮窗」概念，相关功能不提供
- 咪咕播放/歌词接口需签名，暂不支持（搜索可用），请用酷我/酷狗/QQ
- 网易云 weapi 需 RSA，播放走旧版公开接口，个别歌曲可能无版权取不到地址
- 后台播放受 iOS 系统限制，App 被上滑杀掉后无法继续播放（与所有第三方播放器一致）

## 构建未签名 IPA（GitHub Actions）

1. 推送到 GitHub 仓库 `main` 分支自动触发，或 Actions 页手动运行 `Build iOS IPA (unsigned, for sideload)`
2. 构建完成后在 run 的 **Artifacts** 下载 `LxMusicMobile-IPA`（未签名）
3. 用 **AltStore** 或 **Sideloadly** 自签安装（免费 Apple ID 每 7 天重签一次）

## 本地构建（macOS + Xcode）

```bash
npm install
cd ios && pod install
cd ..
npx react-native run-ios --configuration Release
```

## 免责声明

本项目仅供技术学习交流，音乐数据版权归各平台所有，请支持正版。遵循原项目 Apache-2.0 与版权使用限制协议（非商业、技术学习用途）。
