# 开发日志

## 2026-06-17 核心功能开发

### 滑动窗口预加载

首次加载预加载 4 张卡片（当前 + 后方 3 张）后才显示，翻页后台补充窗口。策略：图片优先并行加载 → 音频用 `fetch()` 触发缓存不阻塞 → 200ms 防抖 + `navLock` 互斥锁防冲突。

### 关键 Bug 修复

| Bug | 根因 | 解决 |
|-----|------|------|
| 加载动画永不消失 | Promise 卡死：超时兜底有条件判断，缓存命中时跳过 | 无条件超时 + `done` 防重入 + 6s 总兜底 |
| `var` 变量提升 | for 循环里 `var audio` 共享引用 | IIFE 闭包隔离 |
| `preloadBatch` 闭包 | `.then()` 回调索引是循环结束值 | IIFE 捕获当前 `idx` |
| 翻页图片闪白 | 未预加载时图片瞬间空白 | `opacity:0` → `onload` 淡入 |
| loading 遮罩叠加 | 快速翻页多个 loading 并存 | `navLock` 互斥锁 |

### 架构演进

分组预加载（已废弃）→ 无预加载（过渡）→ 滑动窗口预加载（最终方案，简单稳定）

---

## 2026-06-20 性能与体验优化

### 全量改动一览

| # | 优化项 | 效果 | 涉及文件 |
|:---:|--------|------|------|
| 1 | preconnect 预连接 | 省 200-600ms 连接耗时 | 三页面 |
| 2 | Service Worker | 重复访问秒开，离线可用 | `sw.js` + 三页面 |
| 3 | 离线运行按钮 | 一键全量缓存，实时进度 | 三页面 |
| 4 | 消除硬编码 | 新增动物零改动 | `index.html` `animal-cards.html` |
| 5 | 事件监听器泄漏 | 修复 21 个重复监听器 | `animal-select.html` |
| 6 | Edge Color 异步化 | 采样 200px + `requestIdleCallback`，计算量降 25 倍 | `image-interaction.js` |
| 7 | 音频对象复用 | Audio 对象 63+ → 2 个（播放单例 + fetch 预加载） | `animal-cards.html` `animal-select.html` |
| 8 | JPG → WebP | 14MB → 5.8MB（省 57%，分辨率不变） | `animal-data.js` + 21 张图 |
| 9 | 响应式图片 srcset | 移动端首屏 ~3MB → ~112KB（400w） | `animal-data.js` + 42 张多尺寸 |
| 10 | common.css / common.js | 消除 ~270 行重复代码 | 新建 + 三页面引入 |
| 11 | 滑动翻页 | 全卡片区域手势，zoom 禁用 | `animal-cards.html` |
| 12 | 图片失败兜底 | emoji + 重试按钮 | `animal-cards.html` `animal-select.html` |

### 性能数据

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| 首屏加载（3G） | 8-15 秒 | < 1 秒（SW 缓存命中） |
| 移动端首屏图片 | ~3 MB | ~112 KB |
| 图片总大小 | 14 MB | 5.8 MB + 2 MB 多尺寸 |
| 离线可用 | ❌ | ✅ |
| 翻页等待 | 1-5 秒 | 零等待 |

### 技术要点

| 技术 | 用途 |
|------|------|
| Service Worker（三级策略） | 核心文件 Network First，图片音频 Stale-While-Revalidate，安装预缓存 |
| MessageChannel | 页面 ↔ SW 双向通信，实时回报离线下载进度 |
| WebP + srcset + sizes | 响应式图片，浏览器按屏幕自动选尺寸 |
| requestIdleCallback | Edge Color 异步提取，不阻塞渲染 |
| fetch() 预加载 | 替代 `new Audio()` 触发音频缓存，零内存占用 |
| touchstart/touchend | 轻量滑动手势，zoom 下自动禁用，与图片拖拽互不干扰 |
| 事件代理 | 动态创建的元素（btnClose2）用父容器代理监听 |
| IIFE 闭包 | 解决 `var` 在 for 循环中与异步回调的闭包问题 |

### 经验教训

1. **超时兜底不能有条件** — 无条件 + 防重入锁最可靠
2. **硬编码是扩展性敌人** — 数量从数据源动态读取，新增动物改一处即可
3. **内存 vs 磁盘缓存** — SW Cache Storage 持久化，`preloaded` 对象刷新即丢
4. **公共模块先统一接口** — `speak(lang, animal)` 签名统一，调用点逐个修改
5. **Canvas 采样要缩小** — 边缘色 200px 足够，原图分辨率浪费 25 倍计算
6. **fetch() 比 new Audio() 更轻** — 预加载只需触发缓存，不需要持有对象
7. **手势冲突分区处理** — 图片拖拽和滑动翻页按 DOM 区域隔离
8. **重构先于新功能** — 公共模块纯重构确保不变，再加滑动翻页
