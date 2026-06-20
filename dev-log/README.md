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

**版本管理**：`CACHE_VERSION = 'v3'`，激活时自动清理旧版本缓存。

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

| 指标 | 优化前 | 优化后（SW 缓存命中） |
|------|--------|---------------------|
| 首屏加载（3G） | 8-15 秒 | < 1 秒 |
| 重复访问 | 3-6 秒 | 瞬间（缓存读取） |
| 离线可用 | ❌ | ✅ |
| 翻页等待 | 1-5 秒 | 零等待（已缓存） |
| 图片总大小 | 14 MB | 14 MB（待 WebP 优化） |

---

### 待办：未落地的优化项

| 优化项 | 收益 | 状态 |
|--------|:---:|:---:|
| 图片转 WebP（14MB → ~4MB） | 🔴 高 | 待实施 |
| Edge Color 提取异步化 | 🟡 中 | 待实施 |
| `animal-select.html` 事件监听器泄漏 | 🟡 中 | 待实施 |
| 音频对象复用 | 🟢 低 | 待实施 |
| PWA 正式 PNG 图标 | 🟢 低 | 待实施 |

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
