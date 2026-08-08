---
name: avoid-pitfalls-skill
description: 跨端应用开发避坑与经验借鉴。移动端适配（键盘/安全区/返回键）、权限、打包（setup/APK）、状态管理、AI 协作工作流——开发前后调用，提醒注意点并给出已验证的解法。
---

# 避坑指南（avoid-pitfalls-skill）

> 基于两个真实跨端项目（Tauri 桌面 + Capacitor Android + Web 三端应用；React + zustand + Capacitor 桌面 + 移动端应用）的全部实战经验。
> 开发任何功能前/中/后调用本 skill，按类别对照检查，避免重复踩坑。
> 完整版参考：本包内 `references/避坑指南-完整版.md`（已做去项目化处理，可直接公开分享）。

## 包结构

本 skill 是一个完整包，包含：

```
avoid-pitfalls-skill/
├── SKILL.md                    # 本文件（入口 playbook）
├── README.md                   # 包说明（作者：ralcer-he）
├── LICENSE.txt                 # MIT 协议
├── references/
│   └── 避坑指南-完整版.md        # 完整版通用指南（详细经验，默认先读它）
├── templates/                  # 提示词模板（可直接使用）
│   ├── 开发前检查.md             # 新功能开发前
│   ├── 疑难bug排查.md            # 遇到搞不定的 bug
│   ├── 上下文迁移交接.md          # AI 上下文过长要换窗口时
│   ├── 发布打包检查.md           # 准备发版时
│   └── 日志总结.md               # 每轮开发收尾
└── scripts/
    └── check-version.js        # 版本号同步检查脚本（node scripts/check-version.js）
```

**使用指引**：
- 需要详细背景/完整清单 → 读 `references/避坑指南-完整版.md`；
- 需要可复用的提示词 → 直接用 `templates/` 下的模板，或告诉用户"用 templates/开发前检查.md 那段话发给 AI"；
- 发版前 → 提示运行 `node scripts/check-version.js <文件列表>` 检查版本号同步。

## 何时使用

- 开始新功能/新页面/新组件开发前：先过一遍「开发前检查」；
- 遇到移动端适配、输入法、打包、数据丢失等疑难 bug 时：查对应类别找已验证解法；
- 发布打包前：执行「打包发布检查」；
- 与 AI 协作开发时：执行「AI 协作工作流」。

## 一、开发前检查（先想后写）

1. **设备/环境判断**：分清 Tauri（桌面）、Capacitor（移动）、Web（浏览器）三种环境，用 `isMobileDevice()` 类工具判断，别用 CSS 断点代替（桌面窗口可能是窄屏手机比例，会误判）；
2. **颜色一律用 CSS 变量**，禁止硬编码色值（深色模式适配的唯一正确方式）；
3. **图标用 SVG 组件，禁止 emoji**（emoji 跨平台渲染不一致、风格难统一、观感廉价）；
4. **移动端页面顶部必须留状态栏高度**（安全区），底部固定栏留 `safe-area-inset-bottom`；Android 15+ edge-to-edge 是强制默认行为，必须主动避让；
5. **输入控件字号 ≥16px**（iOS 聚焦自动缩放）；页面高度用 `h-dvh` 不用 `h-screen`；
6. 权限（麦克风/通知/存储/网络）按「manifest 声明 + 运行时主动请求」两步走，用户拒绝要有兜底不崩溃。

## 二、移动端高频坑（踩得最多的）

- **键盘弹出**：
  - 输入区用 `position: fixed; bottom: 0`（Chromium 自动避让），消息列表底部补 `padding-bottom: calc(输入区高 + 键盘高)`；
  - 键盘高度**只写 CSS 变量（如 `--kb-h`），不要用 setState 存**——重渲染会干扰输入法/语音听写；
  - `visualViewport` 高度变化用阈值（>100 弹出 / <50 收起）防抖动；`resize` 和 `scroll` 都监听；
  - `capacitor.config.json`：`Keyboard.resize: "native"`、`overlaysWebView: false`；
  - 键盘弹出时用 `body.keyboard-open` class 隐藏悬浮按钮。
- **输入法/语音错乱**：先和"能正常工作的参照 app"逐项对比原生配置（viewport meta、capacitor.config.json、windowSoftInputMode、targetSdk），**差异项优先怀疑**，别先在 Web 层反复改代码；输入框保持朴素受控 `<input>`，`Enter` 发送用 `e.nativeEvent.isComposing` 防中文误发。
- **触摸/鼠标事件**：`touchend` 后浏览器会模拟 `mouseup`/`click`，必须用标志位去重；`touchmove` 要 preventDefault 时注册 `{ passive: false }`；拖拽 vs 点击用移动距离（>3px）判定。
- **弹窗/下拉**：Dialog 用 `createPortal(..., document.body)`（父容器 transform/filter 会破坏 fixed 定位）；下拉关闭防穿透要三重防线（遮罩延迟保留 + 捕获期拦截 + stopPropagation）。
- **Android 返回键**：五级优先级（侧边栏 → 弹出层 → 弹窗 → 路由回退 → 双击退出），组件用 `CustomEvent('backbutton')` 自治响应。
- **图片**：存 base64 前必须压缩（手机照片 5-12MB → 200-500KB）；PNG→JPEG 先铺白底防变黑。

## 三、状态管理（zustand / React）

- **selector 必须稳定引用**：`(s) => ({a, b})` 返回新对象 → 无限重渲染；`?? []` 空字面量同样会；先 select 稳定引用再 `useMemo` 派生；
- 对 DOM 唯一绑定的库（编辑器/图表/canvas）**绝不能同时渲染两个实例**（CSS hidden 也不行）→ 条件渲染；
- 拖拽/高频回调用 `ref` 读最新值，不用 state（闭包陷阱）；
- 多组件实例并发初始化要加 Promise 锁 + 幂等函数；
- 修改 store 数据结构必须提升 persist 的 `version`；迁移逻辑放 `merge`；
- 跨 store 派生统计防"复活"：异步回调前判断数据仍存在 + 一次性重算迁移任务。

## 四、数据持久化

- localStorage 5MB 配额是移动端血泪：图片/大数据迁 IndexedDB（异步 StateStorage），迁移必须在 store 加载前执行 + 全部 `rehydrate()` await 后再渲染；
- 关键数据独立备份：双存储（localStorage + sessionStorage）、版本号单调递增（`>= Date.now()` 防时间回拨）、**写失败必须删旧值**、恢复做方向保护；
- 顶层常量被模块加载期代码引用时必须**前置定义**（TDZ 坑），恢复逻辑放 `merge` 而非 `onRehydrateStorage`；
- 数据导出/清空必须覆盖全部表/键，新增表时同步更新；日期处理永远用本地时区（`toISOString()` 是 UTC 陷阱）。

## 五、AI 功能

- 多级降级（完整 AI → 免费额度 → 离线关键词 → 关闭），异步非阻塞，降级内容带可辨识标记；
- 多服务商统一 OpenAI 兼容接口；`max_tokens` 按服务商钳制；视觉子代理不传 `detail` 字段（兼容网关会 400）；
- SSE 流式解析 `TextDecoder` 必须 `{ stream: true }`；超时 + 双向 AbortController，异常分支也要 `removeEventListener`；
- 联网搜索标记首次调用强制非流式，失败剥标记兜底。

## 六、打包发布检查（发布前必过）

- **桌面端必须打包 setup 安装程序**（Tauri NSIS / electron-builder），WebView2 用 `offlineInstaller`（内置运行时，用户免装环境）；裸 exe / 绿色版一律不给用户；
- **APK 顺序**：`npm run build` → 清旧 `assets/public` → `npx cap sync android` → `gradlew clean` → `assembleRelease`；不要用 `npx cap build android`；versionCode 每轮 +1；
- 产物重命名（`app_v{版本}.apk` / `xxx_setup.exe`）并归档；keystore 密码不写死在 build.gradle、文件进 .gitignore；
- **版本号同步**：前端 package.json / 桌面配置 / 更新检查常量 / 官网下载链接 / versionCode，一处漏改 = 用户下错版本；
- GitHub Release：先 `delete-asset` 旧文件再 `upload`（同名不覆盖）；打包后归档 + 写更新日志。

## 七、AI 协作工作流

1. 改任何代码先跑构建（`npm run build` / `npx tsc --noEmit && npx vite build`），过了再交付；
2. 代码打版本标记日志（`console.log('[app] store v4')`），多端口并存时用户能确认跑的是新代码；
3. **上下文过长转移窗口**：AI 开始遗漏早期需求时，开新窗口用「交接提示词 + 交接文档」迁移状态，别硬塞旧对话；
4. 每轮开发后写更新日志 + 交接文档，养成记录习惯；
5. 一个问题一直解决不了 → 换一个更贵/更高级的 AI 模型试试；
6. 善用 skill 复用流程、善用 AI 浏览器自动化测试迭代；
7. 从不同环境测试：自己手机和别人手机不一样（机型/系统版本/输入法/网络），发布前多设备真机验证；
8. 逻辑问题用无头自动化验证；状态栏/键盘/输入法必须真机验证。

## 八、经验借鉴索引

| 遇到问题 | 看哪里 |
|---------|--------|
| 移动端键盘/安全区/输入法 | 本 skill 一、二节 |
| 状态管理/无限重渲染 | 第三节 |
| 数据丢失/配额 | 第四节 |
| AI 接口/流式 | 第五节 |
| 打包/发布/版本 | 第六节 |
| 与 AI 协作方法 | 第七节 |
| 完整版细节 | `references/避坑指南-完整版.md` |
