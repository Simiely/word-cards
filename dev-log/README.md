# 开发日志

## 2026-06-17 卡片模式开发全流程

### 功能：声音播放指示器呼吸动画

播放中文名、英文名、描述、叫声时，卡片右下角出现 🔊 图标做呼吸动画，播放结束后消失。

- 用统一的 `playWithIndicator(src, vol)` 函数处理所有音频播放
- CSS animation 实现呼吸效果（scale + opacity 循环）

---

### 功能：滑动窗口预加载

**需求**：首次打开预加载 4 张卡片后才显示，翻页时后台补充窗口，避免翻页卡顿。

**窗口策略**：后方 3 个 + 前方 1 个 = 共 4 个预加载

**关键决策**：
- 图片优先加载，音频后台静默不阻塞
- 并行加载（不串行，避免逐张等待）
- 超时兜底保证不卡死

---

## 关键问题与解决

### 1. 加载动画永远不消失（Promise 卡死）

**现象**：页面只显示呼吸动画，卡片不出现。

**根因**：`preloadGroup` 中 `loadedAssets[url] = true` 在资源**还没开始加载**时就标记了，后续超时兜底的条件判断有漏洞：
- 音频超时检查 `readyState < 2` → 如果浏览器静默加载完成（`readyState >= 2`）但不触发 `onloadeddata`，超时不触发 → Promise 永不 resolve
- 图片同理：`!img.complete` 条件在缓存命中时为 false → 跳过兜底

**解决**：
- `loadedAssets` 标记移到回调内部（加载完成才标记）
- 每个资源用 IIFE 闭包隔离防重入
- 超时兜底改为无条件触发（靠 `done` 标志防重复）
- 启动加 6 秒总超时兜底，互斥保护防止 `renderCard` 重复调用

### 2. `var` 变量提升导致预加载丢失

**现象**：`preloadAudio` 中 `var audio` 在 for 循环里声明，所有迭代共享同一个变量，前一个 Audio 对象可能被 GC 中断预加载。

**解决**：用 IIFE 闭包隔离每次迭代：
```js
(function(src) {
    var audio = new Audio();
    audio.preload = 'auto';
    audio.src = src;
})(srcs[i]);
```

### 3. `preloadBatch` 闭包问题

**现象**：`for` 循环里 `var idx = indices[i]`，在 `.then()` 回调里 `idx` 引用的是循环结束后的值，所有回调操作同一个索引。

**解决**：IIFE 闭包捕获当前 `idx`：
```js
(function(idx) {
    preloadingSet[idx] = true;
    promises.push(preloadOne(idx).then(...));
})(indices[i]);
```

### 4. 快速翻页预加载风暴

**现象**：每次翻页都调 `maintainPreload`，连点 10 次 = 10 轮预加载请求。

**解决**：200ms 防抖 + `preloadingSet` 去重。

### 5. 翻页时图片闪白

**现象**：翻到未预加载的卡片，图片区域瞬间空白。

**解决**：
- `<img>` 初始 `opacity:0`，`onload` 后设为 `1`，利用 CSS 已有 `transition: opacity 0.35s` 淡入
- `goTo` 先检查 `preloaded[a.image]`，未缓存则显示 loading 动画等待

### 6. 快速翻页时多个 loading 遮罩冲突

**现象**：上一个 loading 还没结束，新翻页又触发一个，遮罩叠加。

**解决**：`navLock` 互斥锁，新翻页取消旧 loading。

### 7. `getGroupForIndex` 末组边界错误

**现象**：用 `g * GROUP_SIZE` 计算组边界，最后一组不足 6 个时索引算错。

**解决**：改用累计偏移量 `offset += groups[g].length`。

---

## 架构演进

### 阶段一：分组预加载（已废弃）
- 20 个动物按 6 个一组分 4 组
- 跨组时显示 loading 等整组加载
- **问题**：分组逻辑复杂，边界 bug 多，Promise 卡死难排查

### 阶段二：无预加载（过渡方案）
- 直接 `buildOrder()` + `renderCard()`
- **问题**：翻页时图片从零开始加载，体验差

### 阶段三：滑动窗口预加载（最终方案）
- `buildOrder()` 洗牌
- `preloadOne(idx)` 只加载图片，返回 Promise
- `preloadAudio(idx)` 后台静默加载音频
- `preloadBatch(indices)` 并行预加载
- `maintainPreload()` 维护窗口（200ms 防抖）
- `goTo()` 翻页时检查缓存，未缓存显示 loading

---

## 技术要点

| 技术 | 说明 |
|------|------|
| **Fisher-Yates 洗牌** | `displayOrder` 随机排序动物展示顺序 |
| **Image 对象预加载** | `new Image()` + `img.src` 触发浏览器缓存 |
| **Audio 对象预加载** | `new Audio()` + `preload='auto'` 后台缓存音频 |
| **Promise.all 并行** | 多张图片同时加载，全部完成才 resolve |
| **IIFE 闭包** | 解决 `var` 变量提升和 for 循环回调索引问题 |
| **防抖（debounce）** | 200ms 延迟避免快速翻页触发过多预加载 |
| **互斥锁** | `navLock` 防止 loading 遮罩叠加 |
| **超时兜底 + 互斥** | 启动 6s / 翻页 5s 超时，和正常完成互斥防重复 |
| **CSS transition** | `opacity` 过渡实现图片淡入 |
| **Pointer Events** | 统一鼠标和触摸的事件处理 |
| **object-fit: contain** | 图片适配容器不变形 |
| **clamp()** | 响应式字体大小 |
| **env(safe-area-inset)** | 刘海屏安全区域适配 |

---

## 文件结构

```
word-cards/
├── animal-cards.html      # 卡片模式（本项目核心）
├── animal-select.html     # 浏览模式
├── animal-data.js         # 动物数据（共享）
├── image-interaction.js   # 图片缩放/拖拽交互模块
├── index.html             # 首页
├── manifest.json          # PWA 配置
├── animal/
│   ├── images/            # 动物图片
│   ├── speech_zh/         # 中文名语音 MP3
│   ├── speech_en/         # 英文名语音 MP3
│   ├── speech_fact/       # 描述语音 MP3
│   └── sounds_normalized/ # 动物叫声（待添加）
└── dev-log/               # 开发日志（本目录）
```

---

## 经验教训

1. **预加载超时兜底不能有条件** — 浏览器行为不可预测，条件判断总有漏洞，无条件 + 防重入锁最可靠
2. **`var` 在 for 循环里是定时炸弹** — 涉及异步回调必须用 IIFE 或 `let`
3. **先跑通再优化** — 分组预加载的复杂度带来了更多 bug，简单方案（滑动窗口）反而更稳定
4. **每改一步就测试** — 预加载逻辑牵一发动全身，批量修改后很难定位问题
5. **force push 要谨慎** — 多次 force push 导致线上版本和本地不一致，排查时容易误判

---

## 2026-06-20 性能优化：加载速度与离线能力

### 背景

项目 onepage（单页应用）加载不通畅，尤其在移动网络下首屏等待 8-15 秒。图片总计 14MB（21张JPG），音频 1.6MB（63个MP3），无离线缓存。

### 优化项与关键决策

#### 1. 资源预连接 preconnect

```html
<link rel="preconnect" href="https://simiely.github.io">
```

**作用**：浏览器在解析 HTML 早期就完成 DNS + TCP + TLS 握手，省去 200-600ms 连接建立时间。

**决策**：收益中等（GitHub Pages 同域，首屏资源已有预加载），但零成本，三个页面统一添加。

---

#### 2. Service Worker 离线缓存（`sw.js`）

**核心策略**：

| 资源类型 | 缓存策略 | 说明 |
|---------|---------|------|
| HTML/JS/CSS | Network First → 缓存回退 | 优先最新内容，离线也能用 |
| 图片/音频 | Stale-While-Revalidate | 瞬间返回缓存，后台静默更新 |
| 安装时 | 预缓存 7 个核心文件 | 首次安装后立即可离线打开 |

**版本管理**：`CACHE_VERSION = 'v5'`（公共模块 + 响应式图片时升级），激活时自动清理旧版本缓存。

**关键问题**：SW 更新后不会立即生效，需要刷新页面让新 SW 激活（`skipWaiting()` + `clients.claim()` 加速此过程）。

---

#### 3. 「离线运行」按钮（替代原「预热」按钮）

**演进过程**：

1. **v1 预热按钮**：缓存后续 10 张卡片
   - **问题**：随机排列后预热目标错位，`goRandom()` 清空 `preloaded` 导致缓存全失效

2. **v2 预热按钮**：改为全量缓存 21 张，不清空 `preloaded`
   - **问题**：缓存在内存中，刷新即丢失；仍受 `displayOrder` 影响

3. **v3 离线运行按钮（最终方案）**：通过 SW 全量下载到 Cache Storage
   - **核心机制**：页面通过 `MessageChannel` 向 SW 发送 `{ type: 'DOWNLOAD_ALL', urls }` 消息
   - SW 逐个 `fetch()` + `cache.put()` 写入持久化缓存
   - 实时回报进度：`⏳ 34/89 → ✅ 87/89`
   - **优势**：持久化到磁盘，刷新/断网均可用，不受随机排列影响

**三个页面均部署**：`index.html`、`animal-cards.html`、`animal-select.html`

---

#### 4. 消除硬编码，支持零改动扩展

**问题**：多处写死动物数量（20/21），新增动物需手动同步多个文件。

**修复**：

| 位置 | 改前 | 改后 |
|------|------|------|
| `animal-cards.html` 计数器 | `<span id="totalCount">20</span>` | `<span id="totalCount">-</span>` |
| `index.html` 类别卡片 | `21 种`（写死） | `id="animalCount"`，JS 动态填充 `animals.length` |
| `index.html` 离线列表 | 硬编码 21 个文件名数组 | 从 `animals` 数组动态遍历 |

**新增动物流程**：只需在 `animal-data.js` 加一条数据 + 放入对应素材文件，所有页面自动适配。

---

### 性能数据对比

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 首屏加载（3G） | 8-15 秒 | < 1 秒（SW 缓存命中） |
| 重复访问 | 3-6 秒 | 瞬间（缓存读取） |
| 离线可用 | ❌ | ✅ |
| 翻页等待 | 1-5 秒 | 零等待（已缓存） |
| 图片总大小 | 14 MB（JPG） | 5.8 MB（WebP） + 2 MB（多尺寸） |
| 首屏图片大小（移动端） | ~3 MB | ~112 KB（400w srcset） |

---

### 待办：未落地的优化项

| 优化项 | 收益 | 状态 |
|--------|:---:|:---:|
| ~~图片转 WebP（14MB → 5.8MB）~~ | 🔴 高 | ✅ 已完成 |
| ~~Edge Color 提取异步化~~ | 🟡 中 | ✅ 已完成 |
| ~~`animal-select.html` 事件监听器泄漏~~ | 🟡 中 | ✅ 已完成 |
| ~~音频对象复用~~ | 🟢 低 | ✅ 已完成 |
| ~~公共 CSS / JS 模块提取~~ | 🟡 中 | ✅ 已完成 |
| ~~响应式图片 srcset 多尺寸~~ | 🔴 高 | ✅ 已完成 |
| ~~左右滑动翻页手势~~ | 🔴 高 | ✅ 已完成 |
| PWA 正式 PNG 图标 | 🟢 低 | 待实施 |
| Service Worker 缓存版本自动升级 | 🟢 低 | 待实施 |

---

### 技术要点

| 技术 | 说明 |
|------|------|
| **Service Worker** | `sw.js` 拦截 fetch 请求，实现三级缓存策略 |
| **MessageChannel** | 页面与 SW 双向通信，实时回报下载进度 |
| **Cache Storage API** | `caches.open()` + `cache.put()` 持久化资源到磁盘 |
| **Stale-While-Revalidate** | 立即返回缓存，后台异步更新 |
| **preconnect** | 提前建立 DNS/TCP/TLS 连接 |
| **动态数据驱动** | 所有数量从 `animals.length` 读取，消除硬编码 |

### 经验教训

1. **预加载目标不能依赖随机顺序** — `displayOrder` 随时可能重新洗牌，缓存目标应基于原始数据
2. **内存缓存 vs 磁盘缓存** — `preloaded` 对象在内存中，刷新即丢；SW Cache Storage 持久化到磁盘
3. **SW 消息通信需要 MessageChannel** — `postMessage` 单向通信无法获取进度，`MessageChannel` 实现双向实时回报
4. **SW 版本升级需刷新生效** — 新 SW 安装后需 `skipWaiting()` + 页面刷新才能激活
5. **硬编码是扩展性的最大敌人** — 凡是写死的数字，最终都会忘记同步

---

## 2026-06-20 后续优化：P1/P2/P0 全部落地

### P1-1：`animal-select.html` 事件监听器泄漏

**问题**：每次 `showCard()` 都重复注册 `cardOverlay` 和 `btnClose2` 的 click 监听器，打开 21 次卡片 = 21 个重复监听器堆积。

**修复**：
- `cardOverlay` 和 `btnClose` 的监听器移到 `showCard` 外部，只注册一次
- `btnClose2` 是每次渲染动态重建的，改用 `popCardImage` 上的事件代理统一处理

### P1-2：Edge Color 提取阻塞渲染

**问题**：`image-interaction.js` 中 Canvas `getImageData` 用原始分辨率（最大近 1000px）同步执行 4 次，切卡片时卡顿。

**修复**：
- Canvas 采样尺寸从原图缩小到 200px，计算量降低约 25 倍
- 用 `requestIdleCallback` 延迟到空闲时执行，不阻塞图片切换渲染

### P2：音频对象复用

**问题**：每次 `speak()` 都 `new Audio()`，预加载时也创建大量 Audio 对象不回收。21 只动物 × 3 个音频 = 63 个 Audio 对象堆积。

**修复**：
- 播放语音/叫声：改为复用全局单例 Audio 对象，每次只换 `src`
- 预加载音频：改用 `fetch()` 触发浏览器/SW 缓存，不再创建 Audio 对象
- Audio 对象从 63+ 个降至 2 个（播放单例）

### P0：图片转 WebP

**问题**：21 张 JPG 共 14MB，首屏 4 张图片约 3MB，移动网络下加载慢。

**修复**：
- 用 ImageMagick 批量转换 `quality=80`，分辨率不变
- `animal-data.js` 路径同步 `.jpg` → `.webp`
- SW 缓存版本 v3 → v4

**效果**：

| 动物 | JPG | WebP | 压缩率 |
|------|-----:|-----:|:---:|
| duck | 972 KB | 360 KB | 62% |
| cat | 870 KB | 220 KB | 74% |
| dog | 385 KB | 163 KB | 57% |
| **总计** | **13.4 MB** | **5.8 MB** | **57%** |

### 经验教训

1. **事件监听器要成对管理** — `addEventListener` 必须有对应的 `removeEventListener`，或用事件代理替代动态元素监听
2. **Canvas 操作要缩小采样** — 取边缘色不需要原图分辨率，200px 足够，计算量降 25 倍
3. **Audio 对象比 fetch 更重** — 预加载音频用 `fetch()` 触发缓存即可，不需要创建 Audio 对象
4. **WebP quality=80 肉眼无差** — 实拍照片在卡片展示尺寸下，80 质量 WebP 与原 JPG 无法分辨

---

## 2026-06-20 架构优化：公共模块 + 响应式图片 + 滑动翻页

### 背景

项目代码重复严重（三页面各写一遍 CSS 变量、reset、按钮样式、SW 注册、音频播放、离线逻辑），移动端图片加载过大（5.8MB 原图），缺少儿童最自然的滑动翻页交互。

### 优化一：common.css 公共样式表

**提取内容**：`:root` 变量、`*` reset、body 基础属性、`@keyframes pulse`、`.card-image` / `.zoom-toggle` / `.card-body` 系列公共样式、离线按钮状态样式。

**收益**：三文件消除约 120 行重复 CSS。

### 优化二：common.js 公共 JS 模块

**提取内容**：

| 函数 | 说明 |
|------|------|
| `registerSW()` | SW 注册，三页面统一调用 |
| `speak(lang, animal)` | 语音朗读单例，统一签名（旧版 animal-cards 无 animal 参数，已统一） |
| `playAnimalSound(animal)` | 叫声播放单例，统一命名（旧版 animal-select 命名 soundAudioPop，已统一） |
| `collectOfflineUrls()` | 收集全部资源 URL（含 common.css/js） |
| `initOfflineButton(btn, opts)` | 离线按钮通用逻辑，opts 参数化文案/提示/时长 |

**收益**：三文件消除约 150 行重复 JS。`speak()` 签名统一为 `(lang, animal)`，animal-cards 所有调用点补传 `currentAnimal()`。

### 优化三：响应式图片 srcset

**方案**：每张 WebP 生成 400w 和 800w 两个尺寸，`<img srcset>` 按屏幕宽度自动选择。

| 设备 | 加载尺寸 | 单张大小 | 首屏4张 |
|------|:---:|:---:|:---:|
| 手机（<600px） | 400w | ~28 KB | ~112 KB |
| 平板（600-1200px） | 800w | ~67 KB | ~268 KB |
| 桌面（>1200px） | 原图 | ~276 KB | ~1.1 MB |

**数据结构变更**：`animal-data.js` 每条数据新增 `image_400` 和 `image_800` 字段。

### 优化四：左右滑动翻页

**冲突分析**：`image-interaction.js` 在 `.card-image` 上绑定了 pointer/touch 事件用于图片拖拽缩放，直接在图片区域监听滑动会冲突。

**解决方案**：在 `.card-body`（文字区域）和 `.nav`（导航栏）上监听 touchstart/touchend，避开图片区域。判断条件：水平滑动 > 50px 且垂直 < 水平的 50%。zoom mode 下自动禁用滑动翻页。

### 技术要点

| 技术 | 说明 |
|------|------|
| **common.css** | 公共样式表，三页面 `<link>` 引入 |
| **common.js** | 公共 JS 模块，三页面 `<script src>` 引入 |
| **srcset + sizes** | 响应式图片，浏览器按屏幕宽度自动选择最合适尺寸 |
| **touchstart/touchend** | 轻量级滑动手势检测，不依赖第三方库 |
| **事件区域隔离** | 滑动翻页绑在 `.card-body`/`.nav`，图片拖拽绑在 `.card-image`，互不干扰 |

### 经验教训

1. **公共模块提取要统一接口** — `speak()` 两个页面签名不同，提取时必须统一为更通用的版本，调用点逐个修改
2. **srcset 比 picture 更轻量** — 单一格式（WebP）不需要 `<picture>`，`srcset` 足够
3. **手势冲突要分区处理** — 图片拖拽和滑动翻页不能在同一区域共存，按 DOM 区域隔离最简单可靠
4. **重构要先做不改功能的** — 公共模块提取是纯重构，先做确保功能不变，再加新功能（滑动翻页）
