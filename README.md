# 🛡️ avoid-pitfalls · AI 编程避坑指南

> 一份基于真实开发经验整理的踩坑手册。
> 作者：**ralcer-he**（GitHub: [@ralcer-he](https://github.com/ralcer-he)）

---

## 写在前面

你好，我是 ralcer-he。

这份指南来自我自己开发两个 App 的实际经历，都是踩过坑之后整理出来的：

- 一个日记类 App，同时做了 **Windows 桌面端 + Android 手机端 + 网页版**三端；
- 另一个聊天类 App，也做了**桌面端和手机端**。

两个项目加起来，遇到过键盘把输入框顶没了、语音输入一句话重复三遍、手机存几张照片应用就崩溃、打包发给用户却说打不开……这些坑可能你也会遇到，所以我把它整理成了这份**避坑指南**，希望能帮你少走一些弯路。

---

## 这份指南里有什么

| 章节 | 能帮你解决什么 |
| --- | --- |
| 手机端适配 | 状态栏/安全区、键盘弹出、输入法错乱、页面拥挤、返回键 |
| 权限管理 | 麦克风、通知、存储、网络权限的跨端坑 |
| 桌面端打包 | 为什么必须打包 setup、WebView2 运行时 |
| 移动端打包 | APK 打包顺序、签名、versionCode、版本号同步 |
| 多端兼容 | 「WebView ≠ 浏览器」的认知清单 |
| 前端工程与状态管理 | 无限重渲染、闭包陷阱、并发初始化 |
| 数据持久化 | localStorage 配额、IndexedDB 迁移、备份 |
| AI 功能设计 | 降级策略、多服务商兼容、SSE 流式 |
| AI 协作方法论 | 怎么和 AI 配合少走弯路 |
| 开发工作流 | 版本备份、Release 发布、日志习惯 |

**每一条都是：问题 → 解法 → 可推广的教训**，不是空话。

---

## 包结构

```
avoid-pitfalls/
├── SKILL.md                    # 入口 playbook（AI 调用时读这份）
├── README.md                   # 本文件
├── LICENSE.txt                 # MIT 协议
├── references/
│   └── 避坑指南-完整版.md        # 📚 完整版通用指南（内容最全，建议先读）
├── templates/                  # 📝 提示词模板（配合 AI 直接用）
│   ├── 开发前检查.md             # 开工前
│   ├── 疑难bug排查.md            # 卡住时
│   ├── 上下文迁移交接.md          # 换窗口/换 AI 时
│   ├── 发布打包检查.md           # 发版前
│   └── 日志总结.md               # 收尾时
└── scripts/
    └── check-version.js        # ⚙️ 版本号同步检查（一行命令防漏改）
```

---

## 怎么用

### 方式一：让 AI 直接调用（推荐）

如果你用的 AI 工具支持 skill（如 Reasonix），直接：

```
/avoid-pitfalls                    # 加载避坑 playbook
/avoid-pitfalls 帮我开发新页面      # 带任务调用，AI 会自动对照检查
```

### 方式二：人工对照

- **开发前**：打开 `templates/开发前检查.md`，逐项过一遍；
- **出问题**：翻 `references/避坑指南-完整版.md` 对应章节找解法；
- **发版前**：执行 `templates/发布打包检查.md`，再跑一句：

```bash
node scripts/check-version.js package.json src-tauri/tauri.conf.json ...
```

它会帮你扫描所有文件里的版本号，漏改一处都会红牌警告。

### 方式三：把它交给 AI 当"随身老师"

把 `templates/` 里的模板贴给 AI，让它按流程执行——相当于给你的 AI 配了一位"踩过坑的前辈"。

---

## 经验来源

> 两个项目遇到的问题，都记录在这里，供你参考。

1. **三端应用**（React + Tauri 桌面 + Capacitor Android + Web PWA）
   日记/情绪记录类 App。覆盖桌面打包（WebView2 离线运行时）、多端兼容、富文本编辑器、PWA 等深水区。
2. **桌面 + 移动端应用**（React + TypeScript + zustand + Capacitor）
   聊天/角色扮演类 App。在 localStorage 配额、输入法、AI 流式接口、状态管理上都遇到过问题。

---

## 一起完善它

踩了新坑？解决了新问题？**欢迎 PR 或 Issues**：

1. 用 `templates/日志总结.md` 记录：问题 → 解法 → 教训；
2. 补充进 `references/避坑指南-完整版.md` 对应章节；
3. 让这份指南越用越全，帮到更多人。

> 记住：**能写下来的坑，才是好坑。**

---

## 许可证

[MIT](LICENSE.txt) —— 随便用、随便改、随便分享，保留署名即可。

**by [ralcer-he](https://github.com/ralcer-he)**
